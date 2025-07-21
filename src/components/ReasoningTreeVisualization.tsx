import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ScrollView,
  Dimensions,
  Modal,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useTheme } from '../contexts/ThemeContext';
import { NuminaColors } from '../utils/colors';
import { NuminaAnimations } from '../utils/animations';

const { width, height } = Dimensions.get('window');

interface ReasoningNode {
  id: string;
  type: 'analysis' | 'factor' | 'conclusion' | 'alternative';
  title: string;
  description: string;
  confidence?: number;
  connections?: string[];
  depth: number;
  evidence?: string[];
  alternatives?: string[];
}

interface ReasoningTreeProps {
  reasoningData: {
    explanation: string;
    methodology: string;
    confidence: number;
    primaryFactors: string[];
    alternativesConsidered: string[];
  };
  visible: boolean;
  onClose: () => void;
  recommendationTitle?: string;
}

export const ReasoningTreeVisualization: React.FC<ReasoningTreeProps> = ({
  reasoningData,
  visible,
  onClose,
  recommendationTitle = "AI Reasoning"
}) => {
  const { isDarkMode } = useTheme();
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  // Convert reasoning data to tree structure
  const reasoningTree: ReasoningNode[] = [
    {
      id: 'root',
      type: 'analysis',
      title: 'AI Analysis Process',
      description: reasoningData.methodology,
      confidence: reasoningData.confidence,
      depth: 0,
      connections: ['factors', 'processing', 'conclusion']
    },
    {
      id: 'factors',
      type: 'factor',
      title: 'Primary Analysis Factors',
      description: 'Key data points that influenced this recommendation',
      depth: 1,
      evidence: reasoningData.primaryFactors,
      connections: ['processing']
    },
    {
      id: 'processing',
      type: 'analysis',
      title: 'Processing Logic',
      description: reasoningData.explanation,
      depth: 1,
      connections: ['conclusion', 'alternatives']
    },
    {
      id: 'conclusion',
      type: 'conclusion',
      title: 'Final Recommendation',
      description: 'The AI arrived at this recommendation through multi-factor analysis',
      confidence: reasoningData.confidence,
      depth: 2
    },
    {
      id: 'alternatives',
      type: 'alternative',
      title: 'Alternatives Considered',
      description: 'Other options the AI evaluated',
      depth: 2,
      alternatives: reasoningData.alternativesConsidered
    }
  ];

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const toggleNodeExpansion = (nodeId: string) => {
    NuminaAnimations.haptic.light();
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  const selectNode = (nodeId: string) => {
    NuminaAnimations.haptic.medium();
    setSelectedNode(selectedNode === nodeId ? null : nodeId);
  };

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'analysis': return 'lightbulb-on';
      case 'factor': return 'database';
      case 'conclusion': return 'check-circle';
      case 'alternative': return 'git-branch';
      default: return 'circle';
    }
  };

  const getNodeColor = (type: string) => {
    switch (type) {
      case 'analysis': return isDarkMode ? NuminaColors.chatBlue[400] : NuminaColors.chatBlue[500];
      case 'factor': return isDarkMode ? NuminaColors.chatYellow[400] : NuminaColors.chatYellow[500];
      case 'conclusion': return isDarkMode ? NuminaColors.chatGreen[400] : NuminaColors.chatGreen[500];
      case 'alternative': return isDarkMode ? NuminaColors.chatPurple[400] : NuminaColors.chatPurple[500];
      default: return isDarkMode ? '#666666' : '#999999';
    }
  };

  const renderNode = (node: ReasoningNode) => {
    const isExpanded = expandedNodes.has(node.id);
    const isSelected = selectedNode === node.id;
    const nodeColor = getNodeColor(node.type);

    return (
      <View key={node.id} style={[styles.nodeContainer, { marginLeft: node.depth * 20 }]}>
        {/* Connection Lines */}
        {node.depth > 0 && (
          <View style={[styles.connectionLine, { 
            backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)' 
          }]} />
        )}

        {/* Node Card */}
        <TouchableOpacity
          onPress={() => selectNode(node.id)}
          onLongPress={() => toggleNodeExpansion(node.id)}
          activeOpacity={0.8}
        >
          <Animated.View
            style={[
              styles.nodeCard,
              {
                backgroundColor: isSelected 
                  ? (isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)')
                  : (isDarkMode ? 'rgba(30, 30, 30, 0.9)' : 'rgba(255, 255, 255, 0.9)'),
                borderColor: isSelected ? nodeColor : 'transparent',
                borderWidth: isSelected ? 2 : 1,
                borderStyle: isSelected ? 'solid' : 'solid',
                borderLeftColor: nodeColor,
                borderLeftWidth: 4,
              }
            ]}
          >
            {/* Node Header */}
            <View style={styles.nodeHeader}>
              <View style={styles.nodeIconContainer}>
                <MaterialCommunityIcons
                  name={getNodeIcon(node.type) as any}
                  size={18}
                  color={nodeColor}
                />
              </View>
              
              <Text style={[
                styles.nodeTitle,
                { color: isDarkMode ? '#ffffff' : '#000000' }
              ]}>
                {node.title}
              </Text>

              {node.confidence && (
                <View style={[styles.confidenceBadge, { backgroundColor: nodeColor + '20' }]}>
                  <Text style={[styles.confidenceText, { color: nodeColor }]}>
                    {Math.round(node.confidence * 100)}%
                  </Text>
                </View>
              )}

              <TouchableOpacity
                onPress={() => toggleNodeExpansion(node.id)}
                style={styles.expandButton}
              >
                <Feather
                  name={isExpanded ? "chevron-up" : "chevron-down"}
                  size={16}
                  color={isDarkMode ? '#999999' : '#666666'}
                />
              </TouchableOpacity>
            </View>

            {/* Node Description */}
            <Text style={[
              styles.nodeDescription,
              { color: isDarkMode ? '#cccccc' : '#666666' }
            ]}>
              {node.description}
            </Text>

            {/* Expanded Content */}
            {isExpanded && (
              <Animated.View style={styles.expandedContent}>
                {node.evidence && (
                  <View style={styles.evidenceSection}>
                    <Text style={[
                      styles.sectionTitle,
                      { color: isDarkMode ? NuminaColors.chatYellow[300] : NuminaColors.chatYellow[600] }
                    ]}>
                      Evidence:
                    </Text>
                    {node.evidence.map((item, index) => (
                      <Text key={index} style={[
                        styles.evidenceItem,
                        { color: isDarkMode ? '#dddddd' : '#555555' }
                      ]}>
                        • {item}
                      </Text>
                    ))}
                  </View>
                )}

                {node.alternatives && (
                  <View style={styles.alternativesSection}>
                    <Text style={[
                      styles.sectionTitle,
                      { color: isDarkMode ? NuminaColors.chatPurple[300] : NuminaColors.chatPurple[600] }
                    ]}>
                      Alternatives Considered:
                    </Text>
                    {node.alternatives.map((item, index) => (
                      <Text key={index} style={[
                        styles.alternativeItem,
                        { color: isDarkMode ? '#dddddd' : '#555555' }
                      ]}>
                        ⚬ {item}
                      </Text>
                    ))}
                  </View>
                )}
              </Animated.View>
            )}
          </Animated.View>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View
        style={[
          styles.modalOverlay,
          {
            opacity: fadeAnim,
          }
        ]}
      >
        <BlurView intensity={80} style={StyleSheet.absoluteFill} />
        
        <Animated.View
          style={[
            styles.modalContainer,
            {
              transform: [{ scale: scaleAnim }],
              backgroundColor: isDarkMode ? 'rgba(20, 20, 20, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            }
          ]}
        >
          {/* Header */}
          <View style={styles.modalHeader}>
            <LinearGradient
              colors={isDarkMode 
                ? [NuminaColors.chatBlue[600], NuminaColors.chatPurple[600]]
                : [NuminaColors.chatBlue[500], NuminaColors.chatPurple[500]]
              }
              style={styles.headerGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <MaterialCommunityIcons
                name="lightbulb-on"
                size={24}
                color="#ffffff"
              />
              <Text style={styles.modalTitle}>
                AI Reasoning Tree
              </Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Feather name="x" size={24} color="#ffffff" />
              </TouchableOpacity>
            </LinearGradient>
          </View>

          {/* Recommendation Context */}
          <View style={styles.contextSection}>
            <Text style={[
              styles.contextTitle,
              { color: isDarkMode ? '#ffffff' : '#000000' }
            ]}>
              For: {recommendationTitle}
            </Text>
          </View>

          {/* Reasoning Tree */}
          <ScrollView
            style={styles.treeContainer}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.treeContent}>
              {reasoningTree.map(renderNode)}
            </View>
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              onPress={() => {
                setExpandedNodes(new Set(reasoningTree.map(n => n.id)));
                NuminaAnimations.haptic.medium();
              }}
              style={[
                styles.footerButton,
                { 
                  backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                  borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
                }
              ]}
            >
              <Feather name="maximize-2" size={16} color={isDarkMode ? '#ffffff' : '#000000'} />
              <Text style={[
                styles.footerButtonText,
                { color: isDarkMode ? '#ffffff' : '#000000' }
              ]}>
                Expand All
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setExpandedNodes(new Set());
                NuminaAnimations.haptic.medium();
              }}
              style={[
                styles.footerButton,
                { 
                  backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                  borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
                }
              ]}
            >
              <Feather name="minimize-2" size={16} color={isDarkMode ? '#ffffff' : '#000000'} />
              <Text style={[
                styles.footerButtonText,
                { color: isDarkMode ? '#ffffff' : '#000000' }
              ]}>
                Collapse All
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: width * 0.9,
    height: height * 0.8,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  modalHeader: {
    height: 60,
  },
  headerGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 12,
  },
  modalTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -0.3,
  },
  closeButton: {
    padding: 4,
  },
  contextSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  contextTitle: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  treeContainer: {
    flex: 1,
  },
  treeContent: {
    padding: 20,
  },
  nodeContainer: {
    marginBottom: 16,
    position: 'relative',
  },
  connectionLine: {
    position: 'absolute',
    left: -12,
    top: 20,
    width: 2,
    height: '100%',
  },
  nodeCard: {
    borderRadius: 12,
    padding: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  nodeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  nodeIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nodeTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  confidenceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  confidenceText: {
    fontSize: 11,
    fontWeight: '600',
  },
  expandButton: {
    padding: 4,
  },
  nodeDescription: {
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: -0.1,
  },
  expandedContent: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  evidenceSection: {
    marginBottom: 12,
  },
  alternativesSection: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    letterSpacing: -0.1,
  },
  evidenceItem: {
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 2,
    marginLeft: 8,
  },
  alternativeItem: {
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 2,
    marginLeft: 8,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  footerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  footerButtonText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
});