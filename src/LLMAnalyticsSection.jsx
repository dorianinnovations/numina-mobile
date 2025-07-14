import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  TrendingUp, 
  Lightbulb, 
  Target, 
  Sparkles, 
  AlertCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useLLMAnalytics } from '../hooks/useLLMAnalytics';
import ConcentricCircleSpinner from './ConcentricCircleSpinner';
import { useDarkMode } from '../layout/DarkModeContext';
import { Link } from 'react-router-dom';

const LLMAnalyticsSection = ({ isVisible = true }) => {
  const { isDarkMode } = useDarkMode();
  const [activeTab, setActiveTab] = useState('insights');
  const [expandedInsight, setExpandedInsight] = useState(null);
  
  const {
    llmInsights,
    llmWeeklyInsights,
    llmRecommendations,
    isGeneratingInsights,
    isGeneratingWeekly,
    isGeneratingRecommendations,
    insightsError,
    weeklyError,
    recommendationsError,
    generateInsights,
    generateWeeklyInsights,
    generateRecommendations,
    getPatternInsights,
    getRecommendationInsights,
    getTrendInsights,
    hasCachedInsights,
    hasCachedWeekly,
    hasCachedRecommendations
  } = useLLMAnalytics();

  // Auto-generate insights when component mounts
  useEffect(() => {
    if (isVisible && !hasCachedInsights) {
      generateInsights({ days: 30, focus: 'general' });
    }
  }, [isVisible, hasCachedInsights, generateInsights]);

  const tabs = [
    { id: 'insights', label: 'Numina Insights', icon: Brain, color: 'from-purple-200 via-pink-100 to-pink-200' },
    { id: 'patterns', label: 'Patterns', icon: TrendingUp, color: 'from-green-200 via-emerald-100 to-emerald-200' },
    { id: 'recommendations', label: 'Recommendations', icon: Target, color: 'from-blue-200 via-cyan-100 to-cyan-200' },
    { id: 'weekly', label: 'Weekly Digest', icon: Sparkles, color: 'from-orange-200 via-pink-100 to-yellow-200' }
    
  ];

// potential area in the future to add premium connectivity

  const handleTabClick = async (tabId) => {
    setActiveTab(tabId);
    
    switch (tabId) {
      case 'patterns':
        await getPatternInsights();
        break;
      case 'recommendations':
        await generateRecommendations({}, true);
        break;
      case 'weekly':
        await generateWeeklyInsights();
        break;
      default:
        await generateInsights({ days: 30, focus: 'general' });
    }
  };

  const renderInsights = () => {
    console.log('Rendering insights, data:', llmInsights);
    console.log('Is generating insights:', isGeneratingInsights);
    console.log('Insights error:', insightsError);
    
    if (isGeneratingInsights) {
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center py-12"
        >
          <div className="text-center">
            <div className="mx-auto mb-4">
              <ConcentricCircleSpinner 
                color="rgb(34, 197, 94)" 
                size={40}
              />
            </div>
            <p className={`text-sm ${isDarkMode ? 'text-darkMode-300' : 'text-darkMode-600'}`}>
              Analyzing...
            </p>
          </div>
        </motion.div>
      );
    }

    if (insightsError) {

      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-6 text-center"
        >
          <AlertCircle className="w-8 h-8 mx-auto mb-4 text-red-400" />
          <p className={`text-sm ${isDarkMode ? 'text-darkMode-300' : 'text-darkMode-600'}`}>
            {insightsError}
          </p>
          <button
            onClick={() => generateInsights({ forceRefresh: true })}
            className="mt-4 px-4 py-2 bg-chatGreen-500 text-white rounded-lg hover:bg-chatGreen-600 transition-colors"
          >
            Try Again
          </button>
        </motion.div>
      );
    }

    if (!llmInsights?.insights?.length) {
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <Sparkles className="w-12 h-12 mx-auto mb-4 text-chatGreen-400" />
          <p className={`text-sm ${isDarkMode ? 'text-darkMode-300' : 'text-darkMode-600'}`}>
            Generate insights to see personalized analysis
          </p>
          <button
            onClick={() => generateInsights({ forceRefresh: true })}
            className="mt-4 px-4 py-2 bg-chatGreen-500 text-white rounded-lg hover:bg-chatGreen-600 transition-colors"
          >
            Generate Insights
          </button>
        </motion.div>
      );
    }

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-4"
      >
        {llmInsights.insights.map((insight, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${
              expandedInsight === index
                ? isDarkMode 
                  ? 'bg-black/60 border-white/20'
                  : 'bg-white/80 border-white/60'
                : isDarkMode 
                  ? 'bg-black/40 border-white/10 hover:bg-black/50'
                  : 'bg-white/60 border-white/40 hover:bg-white/70'
            }`}
            onClick={() => setExpandedInsight(expandedInsight === index ? null : index)}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                <div className={`p-2 rounded-xl ${
                  insight.type === 'pattern' ? 'bg-blue-500/15 text-blue-400' :
                  insight.type === 'trend' ? 'bg-green-500/15 text-green-400' :
                  insight.type === 'recommendation' ? 'bg-purple-500/15 text-purple-400' :
                  'bg-orange-500/15 text-orange-400'
                }`}>
                  {insight.type === 'pattern' ? <TrendingUp className="w-4 h-4" /> :
                   insight.type === 'trend' ? <TrendingUp className="w-4 h-4" /> :
                   insight.type === 'recommendation' ? <Target className="w-4 h-4" /> :
                   <Lightbulb className="w-4 h-4" />}
                </div>
                <div className="flex-1">
                  <h4 className={`font-semibold mb-1 ${
                    isDarkMode ? 'text-darkMode-100' : 'text-darkMode-800'
                  }`}>
                    {insight.title}
                  </h4>
                  <p className={`text-sm ${
                    isDarkMode ? 'text-darkMode-300' : 'text-darkMode-600'
                  }`}>
                    {insight.description}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      insight.confidence === 'high'
                        ? 'bg-green-500/15 text-green-400 border border-green-500/40'
                        : insight.confidence === 'medium'
                        ? 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/40'
                        : 'bg-red-500/15 text-red-400 border border-red-500/40'
                    }`}>
                      {insight.confidence} confidence
                    </span>
                    {insight.actionable && (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-500/15 text-blue-400 border border-blue-500/40">
                        actionable
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button className="p-1">
                {expandedInsight === index ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
            
            <AnimatePresence>
              {expandedInsight === index && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 pt-4 border-t border-white/20"
                >
                  <div className={`text-sm ${isDarkMode ? 'text-darkMode-300' : 'text-darkMode-600'}`}>
                    <p><strong>Category:</strong> {insight.category}</p>
                    <p><strong>Type:</strong> {insight.type}</p>
                    {insight.actionable && (
                      <p className="mt-2 text-chatGreen-400">
                        💡 This insight suggests an action you can take to improve your emotional well-being.
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </motion.div>
    );
  };

  const renderRecommendations = () => {
    console.log('Rendering recommendations, data:', llmRecommendations);
    console.log('Is generating:', isGeneratingRecommendations);
    console.log('Error:', recommendationsError);
    
    if (isGeneratingRecommendations) {
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center py-12"
        >
          <div className="text-center">
            <div className="mx-auto mb-4">
              <ConcentricCircleSpinner 
                color="rgb(34, 197, 94)" 
                size={40}
              />
            </div>
            <p className={`text-sm ${isDarkMode ? 'text-darkMode-300' : 'text-darkMode-600'}`}>
              Generating personalized recommendations...
            </p>
          </div>
        </motion.div>
      );
    }

    if (recommendationsError) {
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-6 text-center"
        >
          <AlertCircle className="w-8 h-8 mx-auto mb-4 text-red-400" />
          <p className={`text-sm ${isDarkMode ? 'text-darkMode-300' : 'text-darkMode-600'}`}>
            {recommendationsError}
          </p>
          <button
            onClick={() => generateRecommendations({}, true)}
            className="mt-4 px-4 py-2 bg-chatGreen-500 text-white rounded-lg hover:bg-chatGreen-600 transition-colors"
          >
            Try Again
          </button>
        </motion.div>
      );
    }

    if (!llmRecommendations?.recommendations?.length) {
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <Target className="w-12 h-12 mx-auto mb-4 text-chatGreen-400" />
          <p className={`text-sm ${isDarkMode ? 'text-darkMode-300' : 'text-darkMode-600'}`}>
            Generate recommendations based on your emotional patterns
          </p>
          <button
            onClick={() => generateRecommendations({}, true)}
            className="mt-4 px-4 py-2 bg-chatGreen-500 text-white rounded-lg hover:bg-chatGreen-600 transition-colors"
          >
            Generate Recommendations
          </button>
        </motion.div>
      );
    }

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-4"
      >
        {llmRecommendations.recommendations.map((rec, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`p-4 rounded-2xl border-2 ${
              isDarkMode 
                ? 'bg-black/40 border-white/10' 
                : 'bg-white/60 border-white/40'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-xl ${
                rec.difficulty === 'easy' ? 'bg-green-500/15 text-green-400' :
                rec.difficulty === 'medium' ? 'bg-yellow-500/15 text-yellow-400' :
                'bg-red-500/15 text-red-400'
              }`}>
                <Target className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <h4 className={`font-semibold mb-1 ${
                  isDarkMode ? 'text-darkMode-100' : 'text-darkMode-800'
                }`}>
                  {rec.title}
                </h4>
                <p className={`text-sm mb-2 ${
                  isDarkMode ? 'text-darkMode-300' : 'text-darkMode-600'
                }`}>
                  {rec.description}
                </p>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    rec.difficulty === 'easy' ? 'bg-green-500/15 text-green-400' :
                    rec.difficulty === 'medium' ? 'bg-yellow-500/15 text-yellow-400' :
                    'bg-red-500/15 text-red-400'
                  }`}>
                    {rec.difficulty} difficulty
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    rec.impact === 'high' ? 'bg-blue-500/15 text-blue-400' :
                    rec.impact === 'medium' ? 'bg-yellow-500/15 text-yellow-400' :
                    'bg-gray-500/15 text-gray-400'
                  }`}>
                    {rec.impact} impact
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    );
  };

  const renderWeeklyInsights = () => {
    if (isGeneratingWeekly) {
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center py-12"
        >
          <div className="text-center">
            <div className="mx-auto mb-4">
              <ConcentricCircleSpinner 
                color="rgb(34, 197, 94)" 
                size={40}
              />
            </div>
            <p className={`text-sm ${isDarkMode ? 'text-darkMode-300' : 'text-darkMode-600'}`}>
              Analyzing your weekly patterns...
            </p>
          </div>
        </motion.div>
      );
    }

    if (weeklyError) {
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-6 text-center"
        >
          <AlertCircle className="w-8 h-8 mx-auto mb-4 text-red-400" />
          <p className={`text-sm ${isDarkMode ? 'text-darkMode-300' : 'text-darkMode-600'}`}>
            {weeklyError}
          </p>
          <button
            onClick={() => generateWeeklyInsights(true)}
            className="mt-4 px-4 py-2 bg-chatGreen-500 text-white rounded-lg hover:bg-chatGreen-600 transition-colors"
          >
            Try Again
          </button>
        </motion.div>
      );
    }

    if (!llmWeeklyInsights?.weeklyInsights?.insights?.length) {
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <Sparkles className="w-12 h-12 mx-auto mb-4 text-chatGreen-400" />
          <p className={`text-sm ${isDarkMode ? 'text-darkMode-300' : 'text-darkMode-600'}`}>
            Nudge Numina to generate weekly insights
          </p>
          <button
            onClick={() => generateWeeklyInsights(true)}
            className="mt-4 px-4 py-2 bg-chatGreen-500 text-white rounded-lg hover:bg-chatGreen-600 transition-colors"
          >
            Generate Weekly Insights
          </button>
        </motion.div>
      );
    }

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-4"
      >
        {llmWeeklyInsights.weeklyInsights.insights.map((insight, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`p-4 rounded-2xl border-2 ${
              isDarkMode 
                ? 'bg-black/40 border-white/10' 
                : 'bg-white/60 border-white/40'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-chatGreen-500/20 text-chatGreen-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <h4 className={`font-semibold mb-1 ${
                  isDarkMode ? 'text-darkMode-100' : 'text-darkMode-800'
                }`}>
                  {insight.title}
                </h4>
                <p className={`text-sm ${
                  isDarkMode ? 'text-darkMode-300' : 'text-darkMode-600'
                }`}>
                  {insight.description}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    );
  };

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-4 sm:p-8 rounded-2xl sm:rounded-3xl backdrop-blur-xl border-2 shadow-2xl ${
        isDarkMode 
          ? 'bg-black/40 border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.3)]' 
          : 'bg-white/60 border-white/40 shadow-[0_0_40px_rgba(0,0,0,0.1)]'
      }`}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className={`text-lg sm:text-xl font-bold ${
            isDarkMode ? 'text-white' : 'text-darkMode-900'
          }`}>
            Numina-Powered Analytics
          </h3>
        </div>
        <button
          onClick={() => handleTabClick(activeTab)}
          className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === tab.id
                ? `bg-gradient-to-r ${tab.color} text-white`
                : isDarkMode 
                  ? 'bg-black/40 text-darkMode-300 hover:bg-black/60'
                  : 'bg-white/40 text-darkMode-600 hover:bg-white/60'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>


      {/* Tab Content */}
      <div className="min-h-[300px]">
        {activeTab === 'insights' && renderInsights()}
        {activeTab === 'patterns' && renderInsights()}
        {activeTab === 'recommendations' && renderRecommendations()}
        {activeTab === 'weekly' && renderWeeklyInsights()}
      </div>
    </motion.div>
  );
};

export default LLMAnalyticsSection; 