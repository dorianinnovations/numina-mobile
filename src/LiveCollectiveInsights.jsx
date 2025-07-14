import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  Radio, 
  Users, 
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  Zap,
  Heart,
  Brain
} from 'lucide-react';
import { useDarkMode } from '../layout/DarkModeContext';
import ConcentricCircleSpinner from './ConcentricCircleSpinner';

const LiveCollectiveInsights = () => {
  const { isDarkMode } = useDarkMode();
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    loadInsights();
    // Set up polling for real-time updates
    const interval = setInterval(loadInsights, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadInsights = async () => {
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      const baseApiUrl = import.meta.env.DEV 
        ? "/api"  // Use proxy in development
        : (import.meta.env.VITE_APP_API_URL || "https://server-a7od.onrender.com");
      const response = await fetch(`${baseApiUrl}/collective-data/insights`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setInsights(data);
        setLastUpdated(new Date());
      } else {
        throw new Error('Failed to load collective insights');
      }
    } catch (error) {
      console.error('Error loading insights:', error);
      
      // Differentiate between no data and actual errors
      if (error.message.includes('404') || error.message.includes('No data')) {
        setError(null);
        setInsights(null);
      } else {
        setError(error.message);
        setInsights(null);
      }
      setLastUpdated(new Date());
    } finally {
      setLoading(false);
    }
  };

  const generateMockInsights = () => ({
    currentResonance: {
      dominantEmotion: 'Joy',
      intensity: 7.2,
      participants: 247,
      trend: 'up' // 'up', 'down', 'stable'
    },
    emotionBreakdown: [
      { emotion: 'Joy', percentage: 35, change: +5 },
      { emotion: 'Calm', percentage: 28, change: +2 },
      { emotion: 'Sadness', percentage: 15, change: -3 },
      { emotion: 'Excitement', percentage: 12, change: +8 },
      { emotion: 'Anxiety', percentage: 10, change: -2 }
    ],
    insights: [
      {
        type: 'pattern',
        message: 'Community joy levels are 15% higher than last week',
        confidence: 0.87
      },
      {
        type: 'trend',
        message: 'Evening meditation sessions show increased calm resonance',
        confidence: 0.92
      },
      {
        type: 'anomaly',
        message: 'Unusual spike in collective excitement detected around 3 PM',
        confidence: 0.78
      }
    ],
    nextUpdate: Date.now() + 1800000 // 30 minutes from now
  });

  const getEmotionColor = (emotion) => {
    const colors = {
      joy: 'text-yellow-400 bg-yellow-400/20',
      calm: 'text-cyan-400 bg-cyan-400/20',
      sadness: 'text-blue-400 bg-blue-400/20',
      excitement: 'text-orange-400 bg-orange-400/20',
      anxiety: 'text-purple-400 bg-purple-400/20'
    };
    return colors[emotion?.toLowerCase()] || 'text-gray-400 bg-gray-400/20';
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-400" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-400" />;
      default:
        return <Minus className="w-4 h-4 text-gray-400" />;
    }
  };

  const getInsightIcon = (type) => {
    switch (type) {
      case 'pattern':
        return <Brain className="w-5 h-5 text-blue-400" />;
      case 'trend':
        return <TrendingUp className="w-5 h-5 text-green-400" />;
      case 'anomaly':
        return <Zap className="w-5 h-5 text-yellow-400" />;
      default:
        return <Activity className="w-5 h-5 text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <ConcentricCircleSpinner />
      </div>
    );
  }

  if (error && !insights) {
    return (
      <div className="text-center p-8">
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6">
          <p className="text-red-300 mb-4">{error}</p>
          <button
            onClick={loadInsights}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-all mx-auto"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Show empty state when no insights are available
  if (!insights) {
    return (
      <div className="text-center p-12">
        <div className="relative mb-6">
          <Radio className="w-16 h-16 mx-auto text-gray-400/50" />
          <div className="absolute inset-0 w-16 h-16 mx-auto border-2 border-dashed border-gray-400/30 rounded-full animate-pulse" />
        </div>
        <h3 className="text-lg font-semibold text-white dark:text-darkMode-100 mb-2">
          Awaiting Community Data
        </h3>
        <p className="text-white/60 dark:text-darkMode-400 mb-4 max-w-md mx-auto leading-relaxed">
          Live collective insights will appear here once community members start sharing their emotional data. 
          Real-time analysis updates every 30 seconds.
        </p>
        <div className="text-sm text-white/40 dark:text-darkMode-500">
          Be part of the collective emotional intelligence - grant consent to contribute your data
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Last Updated */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Radio className="w-6 h-6 text-emerald-400" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-pulse" />
          </div>
          <h3 className="text-lg font-semibold text-white dark:text-darkMode-100">
            Live Community Resonance
          </h3>
        </div>
        <div className="flex items-center gap-2 text-sm text-white/60 dark:text-darkMode-400">
          <span>Updated: {lastUpdated?.toLocaleTimeString()}</span>
          <button
            onClick={loadInsights}
            className="p-1 hover:bg-white/10 rounded transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Current Resonance Card */}
      {insights?.currentResonance && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-cyan-500/20 rounded-2xl p-6 border border-emerald-300/20"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Dominant Emotion */}
            <div className="text-center">
              <div className={`w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center ${getEmotionColor(insights.currentResonance.dominantEmotion)}`}>
                <Heart className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-white dark:text-darkMode-100">
                {insights.currentResonance?.dominantEmotion || 'Unknown'}
              </h4>
              <p className="text-white/60 dark:text-darkMode-400 text-sm">Dominant Emotion</p>
            </div>

            {/* Intensity */}
            <div className="text-center">
              <div className="relative w-16 h-16 mx-auto mb-3">
                <svg className="w-16 h-16 transform -rotate-90">
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="currentColor"
                    strokeWidth="6"
                    fill="transparent"
                    className="text-white/20"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="currentColor"
                    strokeWidth="6"
                    fill="transparent"
                    strokeDasharray={`${2 * Math.PI * 28}`}
                    strokeDashoffset={`${2 * Math.PI * 28 * (1 - (insights.currentResonance?.intensity || 0) / 10)}`}
                    className="text-emerald-400 transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold text-white dark:text-darkMode-100">
                    {insights.currentResonance?.intensity || 0}
                  </span>
                </div>
              </div>
              <p className="text-white/60 dark:text-darkMode-400 text-sm">Intensity Level</p>
            </div>

            {/* Participants */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-3">
                <Users className="w-8 h-8 text-cyan-400" />
                {getTrendIcon(insights.currentResonance.trend)}
              </div>
              <h4 className="text-lg font-bold text-white dark:text-darkMode-100">
                {(insights.currentResonance?.participants || 0).toLocaleString()}
              </h4>
              <p className="text-white/60 dark:text-darkMode-400 text-sm">Active Participants</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Emotion Breakdown */}
      {insights?.emotionBreakdown && Array.isArray(insights.emotionBreakdown) && insights.emotionBreakdown.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/10 dark:bg-darkMode-800/30 backdrop-blur-md rounded-2xl p-6 border border-white/20 dark:border-darkMode-600/30"
        >
          <h4 className="text-lg font-semibold text-white dark:text-darkMode-100 mb-4">
            Current Emotion Distribution
          </h4>
          <div className="space-y-3">
            {insights.emotionBreakdown.map((emotion, index) => (
              <motion.div
                key={emotion.emotion}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getEmotionColor(emotion.emotion)}`}>
                    <Heart className="w-4 h-4" />
                  </div>
                  <span className="text-white dark:text-darkMode-100 font-medium">
                    {emotion.emotion}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-24 h-2 bg-white/20 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${emotion.percentage}%` }}
                      transition={{ delay: index * 0.1, duration: 0.8 }}
                      className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400"
                    />
                  </div>
                  <span className="text-white dark:text-darkMode-100 font-medium w-10 text-right">
                    {emotion.percentage}%
                  </span>
                  <div className={`flex items-center gap-1 w-12 ${
                    emotion.change > 0 ? 'text-green-400' : emotion.change < 0 ? 'text-red-400' : 'text-gray-400'
                  }`}>
                    {emotion.change > 0 ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : emotion.change < 0 ? (
                      <TrendingDown className="w-3 h-3" />
                    ) : (
                      <Minus className="w-3 h-3" />
                    )}
                    <span className="text-xs">
                      {emotion.change > 0 ? '+' : ''}{emotion.change}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* AI-Generated Insights */}
      {insights?.insights && Array.isArray(insights.insights) && insights.insights.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/10 dark:bg-darkMode-800/30 backdrop-blur-md rounded-2xl p-6 border border-white/20 dark:border-darkMode-600/30"
        >
          <h4 className="text-lg font-semibold text-white dark:text-darkMode-100 mb-4">
            AI Insights
          </h4>
          <div className="space-y-4">
            {insights.insights.map((insight, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                className="flex items-start gap-3 p-3 bg-white/5 rounded-lg"
              >
                {getInsightIcon(insight.type)}
                <div className="flex-1">
                  <p className="text-white/90 dark:text-darkMode-200 leading-relaxed">
                    {insight.message}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-white/50 dark:text-darkMode-500">
                      Confidence: {Math.round(insight.confidence * 100)}%
                    </span>
                    <div className="w-16 h-1 bg-white/20 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-400 rounded-full"
                        style={{ width: `${insight.confidence * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default LiveCollectiveInsights;