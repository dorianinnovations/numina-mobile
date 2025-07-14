import User from "../models/User.js";
import CollectiveDataConsent from "../models/CollectiveDataConsent.js";
import EmotionalAnalyticsSession from "../models/EmotionalAnalyticsSession.js";
import logger from "../utils/logger.js";
import { createCache } from "../utils/cache.js";

class CollectiveDataService {
  constructor() {
    this.cache = createCache();
    this.cacheKey = "collective_data";
    this.cacheTTL = 3600000; // 1 hour
  }

  // Get aggregated emotional data from consenting users
  async getAggregatedEmotionalData(options = {}) {
    const {
      timeRange = "30d", // 7d, 30d, 90d, 1y, all
      groupBy = "day", // hour, day, week, month
      includeIntensity = true,
      includeContext = false,
      minConsentCount = 1
    } = options;

    try {
      // Check database connection
      const mongoose = await import("mongoose");
      if (!mongoose.default.connection || mongoose.default.connection.readyState !== 1) {
        logger.warn("Database not connected, skipping aggregated emotional data generation");
        return {
          success: false,
          message: "Database not connected",
          error: "Database connection not ready"
        };
      }

      // Check cache first
      const cacheKey = `${this.cacheKey}_emotions_${timeRange}_${groupBy}`;
      const cached = this.cache.get(cacheKey);
      if (cached) {
        logger.info("Returning cached collective emotional data");
        return cached;
      }

      // Get consenting users
      const consentingUsers = await CollectiveDataConsent.find({ 
        consentStatus: "granted" 
      }).populate("userId");

      if (consentingUsers.length < minConsentCount) {
        logger.info("Insufficient consenting users, returning sample data", {
          currentUsers: consentingUsers.length,
          required: minConsentCount
        });
        return this._generateSampleData(timeRange, groupBy);
      }

      const userIds = consentingUsers
        .filter(consent => consent.userId && consent.userId._id)
        .map(consent => consent.userId._id);
        
      if (userIds.length === 0) {
        logger.warn("No valid user IDs found after filtering null users");
        return this._generateSampleData(timeRange, groupBy);
      }
      
      const dateFilter = this._getDateFilter(timeRange);

      // Aggregate emotional data
      const pipeline = [
        { $match: { _id: { $in: userIds } } },
        { $unwind: "$emotionalLog" },
        { 
          $match: { 
            "emotionalLog.timestamp": dateFilter,
            "emotionalLog.emotion": { $exists: true, $ne: null, $ne: "" }
          } 
        },
        {
          $group: {
            _id: {
              emotion: "$emotionalLog.emotion",
              timeGroup: this._getTimeGroupExpression(groupBy)
            },
            count: { $sum: 1 },
            avgIntensity: { $avg: "$emotionalLog.intensity" },
            contexts: { $addToSet: "$emotionalLog.context" }
          }
        },
        {
          $group: {
            _id: "$_id.timeGroup",
            emotions: {
              $push: {
                emotion: "$_id.emotion",
                count: "$count",
                avgIntensity: "$avgIntensity",
                contexts: "$contexts"
              }
            },
            totalEntries: { $sum: "$count" }
          }
        },
        { $sort: { _id: 1 } }
      ];

      const aggregatedData = await User.aggregate(pipeline);

      // Process and compress the data
      const processedData = this._processEmotionalData(aggregatedData, {
        includeIntensity,
        includeContext
      });

      const result = {
        success: true,
        metadata: {
          totalUsers: consentingUsers.length,
          timeRange,
          groupBy,
          dataPoints: processedData.length,
          generatedAt: new Date().toISOString()
        },
        data: processedData
      };

      // Cache the result
      this.cache.set(cacheKey, result, this.cacheTTL);

      logger.info("Generated collective emotional data", {
        userCount: consentingUsers.length,
        dataPoints: processedData.length,
        timeRange,
        groupBy
      });

      return result;

    } catch (error) {
      logger.error("Error generating collective emotional data", {
        error: error.message,
        stack: error.stack
      });
      return {
        success: false,
        message: "Failed to generate collective data",
        error: error.message
      };
    }
  }

  // Get demographic and activity patterns
  async getDemographicPatterns(options = {}) {
    const {
      includeActivityPatterns = true,
      includeGeographicData = false
    } = options;

    try {
      // Check database connection
      const mongoose = await import("mongoose");
      if (!mongoose.default.connection || mongoose.default.connection.readyState !== 1) {
        logger.warn("Database not connected, skipping demographic patterns generation");
        return {
          success: false,
          message: "Database not connected",
          error: "Database connection not ready"
        };
      }

      const cacheKey = `${this.cacheKey}_demographics`;
      const cached = this.cache.get(cacheKey);
      if (cached) {
        return cached;
      }

      const consentingUsers = await CollectiveDataConsent.find({ 
        consentStatus: "granted" 
      }).populate("userId");

      const userIds = consentingUsers
        .filter(consent => consent.userId && consent.userId._id)
        .map(consent => consent.userId._id);
        
      if (userIds.length === 0) {
        logger.warn("No valid user IDs found for demographic patterns");
        return {
          success: true,
          activityPatterns: {},
          message: "No users found for demographic analysis"
        };
      }

      // Get user activity patterns
      const activityPipeline = [
        { $match: { _id: { $in: userIds } } },
        {
          $project: {
            emotionalLogCount: { $size: "$emotionalLog" },
            accountAge: {
              $divide: [
                { $subtract: [new Date(), "$createdAt"] },
                1000 * 60 * 60 * 24 // Convert to days
              ]
            },
            lastActivity: { $max: "$emotionalLog.timestamp" },
            avgIntensity: { $avg: "$emotionalLog.intensity" }
          }
        },
        {
          $group: {
            _id: null,
            totalUsers: { $sum: 1 },
            avgEmotionalLogCount: { $avg: "$emotionalLogCount" },
            avgAccountAge: { $avg: "$accountAge" },
            avgIntensity: { $avg: "$avgIntensity" },
            activityDistribution: {
              $push: {
                emotionalLogCount: "$emotionalLogCount",
                accountAge: "$accountAge",
                avgIntensity: "$avgIntensity"
              }
            }
          }
        }
      ];

      const activityData = await User.aggregate(activityPipeline);

      const result = {
        success: true,
        metadata: {
          totalUsers: userIds.length,
          generatedAt: new Date().toISOString()
        },
        demographics: activityData[0] || {},
        activityPatterns: includeActivityPatterns ? this._analyzeActivityPatterns(activityData[0]) : null
      };

      this.cache.set(cacheKey, result, this.cacheTTL);

      return result;

    } catch (error) {
      logger.error("Error generating demographic patterns", {
        error: error.message,
        stack: error.stack
      });
      return {
        success: false,
        message: "Failed to generate demographic patterns",
        error: error.message
      };
    }
  }

  // Get real-time collective insights
  async getRealTimeInsights() {
    try {
      // Check database connection
      const mongoose = await import("mongoose");
      if (!mongoose.default.connection || mongoose.default.connection.readyState !== 1) {
        logger.warn("Database not connected, skipping real-time insights generation");
        return {
          success: false,
          message: "Database not connected",
          error: "Database connection not ready"
        };
      }

      const cacheKey = `${this.cacheKey}_realtime`;
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.metadata.generatedAt < 300000) { // 5 minutes
        return cached;
      }

      const consentingUsers = await CollectiveDataConsent.find({ 
        consentStatus: "granted" 
      }).populate("userId");

      // Filter out any consent records where userId is null and extract valid user IDs
      const userIds = consentingUsers
        .filter(consent => consent.userId && consent.userId._id)
        .map(consent => consent.userId._id);
      const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

      // Get recent emotional trends
      const recentPipeline = [
        { $match: { _id: { $in: userIds } } },
        { $unwind: "$emotionalLog" },
        { $match: { "emotionalLog.timestamp": { $gte: last24Hours } } },
        {
          $group: {
            _id: "$emotionalLog.emotion",
            count: { $sum: 1 },
            avgIntensity: { $avg: "$emotionalLog.intensity" }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ];

      const recentEmotions = await User.aggregate(recentPipeline);

      // Get active sessions
      const activeSessions = await EmotionalAnalyticsSession.countDocuments({
        userId: { $in: userIds },
        status: { $in: ["active", "in_progress"] }
      });

      const result = {
        success: true,
        metadata: {
          totalUsers: userIds.length,
          generatedAt: new Date().toISOString()
        },
        insights: {
          topEmotions: recentEmotions.slice(0, 5),
          activeSessions,
          totalRecentEntries: recentEmotions.reduce((sum, emotion) => sum + emotion.count, 0),
          avgIntensity: recentEmotions.length > 0 
            ? recentEmotions.reduce((sum, emotion) => sum + emotion.avgIntensity, 0) / recentEmotions.length 
            : 0
        }
      };

      this.cache.set(cacheKey, result, 300000); // 5 minutes cache

      return result;

    } catch (error) {
      logger.error("Error generating real-time insights", {
        error: error.message,
        stack: error.stack
      });
      return {
        success: false,
        message: "Failed to generate real-time insights",
        error: error.message
      };
    }
  }

  // Helper methods
  _getDateFilter(timeRange) {
    const now = new Date();
    switch (timeRange) {
      case "10m":
        return { $gte: new Date(now.getTime() - 10 * 60 * 1000) };
      case "7d":
        return { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) };
      case "30d":
        return { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) };
      case "90d":
        return { $gte: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) };
      case "1y":
        return { $gte: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000) };
      case "all":
      default:
        return {};
    }
  }

  _getTimeGroupExpression(groupBy) {
    switch (groupBy) {
      case "hour":
        return {
          $dateToString: {
            format: "%Y-%m-%d-%H",
            date: "$emotionalLog.timestamp"
          }
        };
      case "week":
        return {
          $dateToString: {
            format: "%Y-W%U",
            date: "$emotionalLog.timestamp"
          }
        };
      case "month":
        return {
          $dateToString: {
            format: "%Y-%m",
            date: "$emotionalLog.timestamp"
          }
        };
      case "day":
      default:
        return {
          $dateToString: {
            format: "%Y-%m-%d",
            date: "$emotionalLog.timestamp"
          }
        };
    }
  }

  _processEmotionalData(aggregatedData, options) {
    return aggregatedData.map(group => {
      const processedGroup = {
        timeGroup: group._id,
        totalEntries: group.totalEntries,
        emotions: group.emotions.map(emotion => ({
          emotion: emotion.emotion,
          count: emotion.count,
          percentage: (emotion.count / group.totalEntries * 100).toFixed(2)
        }))
      };

      if (options.includeIntensity) {
        processedGroup.emotions = processedGroup.emotions.map((emotion, index) => ({
          ...emotion,
          avgIntensity: group.emotions[index].avgIntensity?.toFixed(2) || null
        }));
      }

      if (options.includeContext) {
        processedGroup.emotions = processedGroup.emotions.map((emotion, index) => ({
          ...emotion,
          contexts: group.emotions[index].contexts.filter(ctx => ctx) || []
        }));
      }

      return processedGroup;
    });
  }

  _analyzeActivityPatterns(activityData) {
    if (!activityData) return null;

    const distribution = activityData.activityDistribution || [];
    
    return {
      activeUsers: distribution.filter(user => user.emotionalLogCount > 10).length,
      newUsers: distribution.filter(user => user.accountAge < 7).length,
      engagementLevel: distribution.length > 0 
        ? (distribution.filter(user => user.emotionalLogCount > 5).length / distribution.length * 100).toFixed(2)
        : 0,
      avgEngagement: activityData.avgEmotionalLogCount?.toFixed(2) || 0
    };
  }

  // Clear cache
  clearCache() {
    this.cache.flushAll();
    logger.info("Collective data cache cleared");
  }

  // Generate sample data when insufficient real data is available
  _generateSampleData(timeRange = "30d", groupBy = "day") {
    const sampleEmotions = [
      { emotion: "curious", count: 15, percentage: "30.00", avgIntensity: 6.2 },
      { emotion: "focused", count: 12, percentage: "24.00", avgIntensity: 7.1 },
      { emotion: "calm", count: 8, percentage: "16.00", avgIntensity: 5.8 },
      { emotion: "hopeful", count: 10, percentage: "20.00", avgIntensity: 6.5 },
      { emotion: "contemplative", count: 5, percentage: "10.00", avgIntensity: 5.2 }
    ];

    const daysToGenerate = groupBy === "day" ? 7 : (groupBy === "hour" ? 24 : 4);
    const data = [];

    for (let i = 0; i < daysToGenerate; i++) {
      const date = new Date();
      if (groupBy === "day") {
        date.setDate(date.getDate() - i);
      } else if (groupBy === "hour") {
        date.setHours(date.getHours() - i);
      } else {
        date.setDate(date.getDate() - (i * 7)); // weeks
      }

      const timeGroup = this._formatTimeGroup(date, groupBy);
      const totalEntries = Math.floor(Math.random() * 20) + 30; // 30-50 entries

      data.push({
        timeGroup,
        totalEntries,
        emotions: sampleEmotions.map(emotion => ({
          ...emotion,
          count: Math.floor(emotion.count * (0.8 + Math.random() * 0.4)), // Vary by ±20%
          contexts: []
        }))
      });
    }

    return {
      success: true,
      metadata: {
        totalUsers: 2, // Sample users
        timeRange,
        groupBy,
        dataPoints: data.length,
        generatedAt: new Date().toISOString(),
        isSampleData: true
      },
      data: data.reverse() // Chronological order
    };
  }

  _formatTimeGroup(date, groupBy) {
    switch (groupBy) {
      case "hour":
        return date.toISOString().slice(0, 13); // YYYY-MM-DDTHH
      case "week":
        const year = date.getFullYear();
        const week = Math.ceil((date - new Date(year, 0, 1)) / (7 * 24 * 60 * 60 * 1000));
        return `${year}-W${String(week).padStart(2, '0')}`;
      case "month":
        return date.toISOString().slice(0, 7); // YYYY-MM
      case "day":
      default:
        return date.toISOString().slice(0, 10); // YYYY-MM-DD
    }
  }
}

export default new CollectiveDataService(); 