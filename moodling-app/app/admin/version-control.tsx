/**
 * Model Version Control Admin
 *
 * Git-style version control UI for AI models.
 * View versions, rollback, manage deployments.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  useColorScheme,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import {
  ModelVersion,
  RollbackEvent,
  getAllVersions,
  getProductionVersion,
  getStagedVersion,
  getRollbackLog,
  rollback,
  stageVersion,
  promoteToProduction,
  getDeploymentGates,
  DeploymentGate,
} from '@/services/modelVersionControlService';

type Tab = 'versions' | 'rollback' | 'gates';

export default function VersionControlScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState<Tab>('versions');
  const [loading, setLoading] = useState(true);

  // Data state
  const [versions, setVersions] = useState<ModelVersion[]>([]);
  const [productionVersion, setProductionVersion] = useState<ModelVersion | null>(null);
  const [stagedVersion, setStagedVersion] = useState<ModelVersion | null>(null);
  const [rollbackLog, setRollbackLog] = useState<RollbackEvent[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<ModelVersion | null>(null);
  const [deploymentGates, setDeploymentGates] = useState<DeploymentGate[]>([]);

  // Action state
  const [actionLoading, setActionLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [allVersions, production, staged, log] = await Promise.all([
        getAllVersions(),
        getProductionVersion(),
        getStagedVersion(),
        getRollbackLog(),
      ]);
      setVersions(allVersions);
      setProductionVersion(production);
      setStagedVersion(staged);
      setRollbackLog(log);
    } catch (error) {
      console.error('Failed to load version data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRollback = async (version: ModelVersion) => {
    Alert.alert(
      'Rollback to Version',
      `Are you sure you want to rollback to "${version.name}" (v${version.version})?\n\nThis will immediately switch the production model.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Rollback',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              const result = await rollback(version.id, 'Manual rollback from admin');
              if (result.success) {
                Alert.alert('Success', 'Rolled back successfully');
                loadData();
              } else {
                Alert.alert('Failed', result.message);
              }
            } catch (error) {
              Alert.alert('Error', 'Rollback failed');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleStage = async (version: ModelVersion) => {
    setActionLoading(true);
    try {
      const result = await stageVersion(version.id);
      if (result.success) {
        Alert.alert('Success', 'Version staged for testing');
        loadData();
      } else {
        Alert.alert('Failed', result.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Staging failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePromote = async (version: ModelVersion) => {
    Alert.alert(
      'Promote to Production',
      `Are you sure you want to promote "${version.name}" (v${version.version}) to production?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Promote',
          onPress: async () => {
            setActionLoading(true);
            try {
              const result = await promoteToProduction(version.id, 'Admin');
              if (result.success) {
                Alert.alert('Success', 'Version promoted to production');
                loadData();
              } else {
                Alert.alert('Failed', result.message);
              }
            } catch (error) {
              Alert.alert('Error', 'Promotion failed');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const viewGates = async (version: ModelVersion) => {
    try {
      const gates = await getDeploymentGates(version.id);
      setDeploymentGates(gates);
      setSelectedVersion(version);
    } catch (error) {
      Alert.alert('Error', 'Failed to load deployment gates');
    }
  };

  const getStatusColor = (status: ModelVersion['status']) => {
    switch (status) {
      case 'production': return '#4CAF50';
      case 'staged': return '#FF9800';
      case 'testing': return '#2196F3';
      case 'draft': return colors.textSecondary;
      case 'retired': return '#9E9E9E';
      case 'rolled_back': return '#F44336';
      default: return colors.textSecondary;
    }
  };

  const renderVersionsTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Current Production */}
      {productionVersion && (
        <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Production</Text>
            <View style={[styles.statusBadge, { backgroundColor: '#4CAF5030' }]}>
              <Text style={{ color: '#4CAF50', fontSize: 11 }}>LIVE</Text>
            </View>
          </View>
          <Text style={[styles.versionName, { color: colors.text }]}>
            {productionVersion.name}
          </Text>
          <Text style={[styles.versionInfo, { color: colors.textSecondary }]}>
            v{productionVersion.version} • {productionVersion.trainingData.insightCount} insights
          </Text>
          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <Text style={[styles.metricValue, { color: colors.tint }]}>
                {productionVersion.metrics.overallQuality}%
              </Text>
              <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Quality</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={[styles.metricValue, { color: colors.text }]}>
                {productionVersion.metrics.empathyScore}%
              </Text>
              <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Empathy</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={[styles.metricValue, { color: colors.text }]}>
                {productionVersion.metrics.safetyScore}%
              </Text>
              <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Safety</Text>
            </View>
          </View>
        </View>
      )}

      {/* Staged Version */}
      {stagedVersion && (
        <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Staged</Text>
            <View style={[styles.statusBadge, { backgroundColor: '#FF980030' }]}>
              <Text style={{ color: '#FF9800', fontSize: 11 }}>TESTING</Text>
            </View>
          </View>
          <Text style={[styles.versionName, { color: colors.text }]}>
            {stagedVersion.name}
          </Text>
          <Text style={[styles.versionInfo, { color: colors.textSecondary }]}>
            v{stagedVersion.version}
          </Text>
          <View style={styles.actionRow}>
            <Pressable
              style={[styles.actionButton, { backgroundColor: colors.tint }]}
              onPress={() => handlePromote(stagedVersion)}
              disabled={actionLoading}
            >
              <Text style={styles.actionButtonText}>Promote</Text>
            </Pressable>
            <Pressable
              style={[styles.actionButton, { backgroundColor: colors.border }]}
              onPress={() => viewGates(stagedVersion)}
            >
              <Text style={[styles.actionButtonText, { color: colors.text }]}>Gates</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* All Versions */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        All Versions ({versions.length})
      </Text>

      {versions.length === 0 ? (
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          No model versions yet. Train your first model to get started.
        </Text>
      ) : (
        versions.map((version) => (
          <View
            key={version.id}
            style={[styles.versionCard, { backgroundColor: colors.cardBackground }]}
          >
            <View style={styles.versionHeader}>
              <View style={styles.versionTitleRow}>
                <Text style={[styles.versionName, { color: colors.text }]}>
                  {version.name}
                </Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(version.status) + '30' }]}>
                  <Text style={{ color: getStatusColor(version.status), fontSize: 10 }}>
                    {version.status.toUpperCase()}
                  </Text>
                </View>
              </View>
              <Text style={[styles.versionInfo, { color: colors.textSecondary }]}>
                v{version.version} • {version.branch} • {new Date(version.createdAt).toLocaleDateString()}
              </Text>
            </View>

            <View style={styles.versionStats}>
              <Text style={[styles.versionStat, { color: colors.textSecondary }]}>
                Quality: {version.metrics.overallQuality}%
              </Text>
              <Text style={[styles.versionStat, { color: colors.textSecondary }]}>
                Insights: {version.trainingData.insightCount}
              </Text>
              {version.metrics.qualityDelta !== 0 && (
                <Text style={[
                  styles.versionStat,
                  { color: version.metrics.qualityDelta > 0 ? '#4CAF50' : '#F44336' }
                ]}>
                  {version.metrics.qualityDelta > 0 ? '+' : ''}{version.metrics.qualityDelta}%
                </Text>
              )}
            </View>

            <View style={styles.versionActions}>
              {version.status !== 'production' && (
                <Pressable
                  style={[styles.smallButton, { borderColor: colors.tint }]}
                  onPress={() => handleStage(version)}
                  disabled={actionLoading}
                >
                  <Text style={{ color: colors.tint, fontSize: 12 }}>Stage</Text>
                </Pressable>
              )}
              {version.status !== 'production' && (
                <Pressable
                  style={[styles.smallButton, { borderColor: '#FF9800' }]}
                  onPress={() => handleRollback(version)}
                  disabled={actionLoading}
                >
                  <Text style={{ color: '#FF9800', fontSize: 12 }}>Rollback</Text>
                </Pressable>
              )}
              <Pressable
                style={[styles.smallButton, { borderColor: colors.border }]}
                onPress={() => viewGates(version)}
              >
                <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Details</Text>
              </Pressable>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );

  const renderRollbackTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Rollback Log</Text>
        <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
          History of version changes and rollbacks
        </Text>
      </View>

      {rollbackLog.length === 0 ? (
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          No rollbacks yet. Your model has been stable!
        </Text>
      ) : (
        rollbackLog.map((event, index) => (
          <View
            key={event.id || index}
            style={[styles.logCard, { backgroundColor: colors.cardBackground }]}
          >
            <View style={styles.logHeader}>
              <View style={[
                styles.logIcon,
                { backgroundColor: event.automatic ? '#F4433630' : '#FF980030' }
              ]}>
                <Text style={{ fontSize: 14 }}>
                  {event.automatic ? '⚠️' : '↩️'}
                </Text>
              </View>
              <View style={styles.logInfo}>
                <Text style={[styles.logTitle, { color: colors.text }]}>
                  {event.automatic ? 'Auto-Rollback' : 'Manual Rollback'}
                </Text>
                <Text style={[styles.logTime, { color: colors.textSecondary }]}>
                  {new Date(event.timestamp).toLocaleString()}
                </Text>
              </View>
            </View>
            <Text style={[styles.logDetail, { color: colors.textSecondary }]}>
              From v{event.fromVersion} → v{event.toVersion}
            </Text>
            <Text style={[styles.logReason, { color: colors.text }]}>
              {event.reason}
            </Text>
            {event.triggeredBy && (
              <Text style={[styles.logTriggeredBy, { color: colors.textSecondary }]}>
                Triggered by: {event.triggeredBy}
              </Text>
            )}
          </View>
        ))
      )}
    </ScrollView>
  );

  const renderGatesTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Deployment Gates</Text>
        <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
          Safety checks required before promotion
        </Text>
      </View>

      <View style={[styles.gatesList, { backgroundColor: colors.cardBackground }]}>
        <View style={styles.gateItem}>
          <View style={[styles.gateIcon, { backgroundColor: '#4CAF5030' }]}>
            <Text>✓</Text>
          </View>
          <View style={styles.gateInfo}>
            <Text style={[styles.gateName, { color: colors.text }]}>Safety Score Check</Text>
            <Text style={[styles.gateDesc, { color: colors.textSecondary }]}>
              Safety score must be ≥90%
            </Text>
          </View>
          <Text style={{ color: '#4CAF50' }}>Required</Text>
        </View>

        <View style={styles.gateItem}>
          <View style={[styles.gateIcon, { backgroundColor: '#4CAF5030' }]}>
            <Text>✓</Text>
          </View>
          <View style={styles.gateInfo}>
            <Text style={[styles.gateName, { color: colors.text }]}>Quality Threshold</Text>
            <Text style={[styles.gateDesc, { color: colors.textSecondary }]}>
              Overall quality must be ≥70%
            </Text>
          </View>
          <Text style={{ color: '#4CAF50' }}>Required</Text>
        </View>

        <View style={styles.gateItem}>
          <View style={[styles.gateIcon, { backgroundColor: '#FF980030' }]}>
            <Text>⏳</Text>
          </View>
          <View style={styles.gateInfo}>
            <Text style={[styles.gateName, { color: colors.text }]}>A/B Testing</Text>
            <Text style={[styles.gateDesc, { color: colors.textSecondary }]}>
              Win rate ≥55% with ≥50 comparisons
            </Text>
          </View>
          <Text style={{ color: '#FF9800' }}>Optional</Text>
        </View>

        <View style={styles.gateItem}>
          <View style={[styles.gateIcon, { backgroundColor: '#2196F330' }]}>
            <Text>👤</Text>
          </View>
          <View style={styles.gateInfo}>
            <Text style={[styles.gateName, { color: colors.text }]}>Human Approval</Text>
            <Text style={[styles.gateDesc, { color: colors.textSecondary }]}>
              Manual review and approval
            </Text>
          </View>
          <Text style={{ color: '#2196F3' }}>Required</Text>
        </View>
      </View>
    </ScrollView>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'versions': return renderVersionsTab();
      case 'rollback': return renderRollbackTab();
      case 'gates': return renderGatesTab();
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={20}>
          <Text style={[styles.backButton, { color: colors.tint }]}>← Back</Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Version Control</Text>
        <View style={{ width: 50 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {(['versions', 'rollback', 'gates'] as Tab[]).map((tab) => (
          <Pressable
            key={tab}
            style={[
              styles.tab,
              activeTab === tab && { borderBottomColor: colors.tint, borderBottomWidth: 2 },
            ]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, { color: activeTab === tab ? colors.tint : colors.textSecondary }]}>
              {tab === 'versions' ? 'Versions' :
               tab === 'rollback' ? 'Rollback Log' :
               'Gates'}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Content */}
      {renderContent()}

      {/* Action Loading Overlay */}
      {actionLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      )}

      {/* Version Detail Modal */}
      <Modal visible={!!selectedVersion} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
            {selectedVersion && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  {selectedVersion.name}
                </Text>
                <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                  v{selectedVersion.version} • {selectedVersion.branch}
                </Text>

                <Text style={[styles.sectionLabel, { color: colors.text }]}>Description</Text>
                <Text style={[styles.modalText, { color: colors.textSecondary }]}>
                  {selectedVersion.description || 'No description provided'}
                </Text>

                <Text style={[styles.sectionLabel, { color: colors.text }]}>Training Data</Text>
                <Text style={[styles.modalText, { color: colors.textSecondary }]}>
                  {selectedVersion.trainingData.insightCount} insights from {selectedVersion.trainingData.categories.length} categories
                </Text>

                <Text style={[styles.sectionLabel, { color: colors.text }]}>Deployment Gates</Text>
                {deploymentGates.map((gate, i) => (
                  <View key={i} style={styles.gateRow}>
                    <Text style={{ color: gate.status === 'passed' ? '#4CAF50' : gate.status === 'failed' ? '#F44336' : '#FF9800' }}>
                      {gate.status === 'passed' ? '✓' : gate.status === 'failed' ? '✗' : '⏳'}
                    </Text>
                    <Text style={[styles.gateRowText, { color: colors.text }]}>{gate.name}</Text>
                  </View>
                ))}

                <Pressable
                  style={[styles.closeButton, { backgroundColor: colors.border }]}
                  onPress={() => setSelectedVersion(null)}
                >
                  <Text style={{ color: colors.text }}>Close</Text>
                </Pressable>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    fontSize: 16,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  cardSubtitle: {
    fontSize: 13,
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  versionName: {
    fontSize: 15,
    fontWeight: '600',
  },
  versionInfo: {
    fontSize: 12,
    marginTop: 4,
  },
  metricsRow: {
    flexDirection: 'row',
    marginTop: 16,
    justifyContent: 'space-around',
  },
  metricItem: {
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  metricLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    marginTop: 8,
  },
  emptyText: {
    textAlign: 'center',
    marginVertical: 20,
    fontSize: 14,
  },
  versionCard: {
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
  },
  versionHeader: {
    marginBottom: 8,
  },
  versionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  versionStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 10,
  },
  versionStat: {
    fontSize: 12,
  },
  versionActions: {
    flexDirection: 'row',
    gap: 8,
  },
  smallButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  logCard: {
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
  },
  logHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  logIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logInfo: {
    flex: 1,
  },
  logTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  logTime: {
    fontSize: 11,
    marginTop: 2,
  },
  logDetail: {
    fontSize: 12,
    marginBottom: 4,
  },
  logReason: {
    fontSize: 13,
  },
  logTriggeredBy: {
    fontSize: 11,
    marginTop: 4,
    fontStyle: 'italic',
  },
  gatesList: {
    borderRadius: 12,
    padding: 8,
  },
  gateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  gateIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  gateInfo: {
    flex: 1,
  },
  gateName: {
    fontSize: 14,
    fontWeight: '500',
  },
  gateDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 6,
  },
  modalText: {
    fontSize: 14,
    lineHeight: 20,
  },
  gateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  gateRowText: {
    fontSize: 14,
  },
  closeButton: {
    marginTop: 24,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
});
