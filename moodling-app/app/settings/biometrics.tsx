/**
 * Biometric Safety Settings
 *
 * Configure voice analysis, facial detection, and emergency contact features.
 * Following Mood Leaf Ethics:
 * - User has full control over every feature
 * - Privacy-first: all biometric data stays on device
 * - Triage approach: alert user first, then emergency contact
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  Pressable,
  TextInput,
  useColorScheme,
  Alert,
  Platform,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import {
  getBiometricSettings,
  saveBiometricSettings,
  BiometricSettingsUI,
  EmergencyContactUI,
  getDefaultBiometricSettings,
} from '@/services/biometricMonitoringService';
import {
  hasVoicePrint as isVoicePrintEnrolled,
  enrollVoicePrint,
  deleteVoicePrint as clearVoicePrint,
} from '@/services/speechAnalysisService';
import {
  hasFacePrint as isFacePrintEnrolled,
  enrollFacePrint,
  deleteFacePrint as clearFacePrint,
} from '@/services/facialRecognitionService';

// Wait time options for emergency contact notification
const WAIT_TIME_OPTIONS = [
  { value: 2, label: '2 minutes' },
  { value: 5, label: '5 minutes' },
  { value: 10, label: '10 minutes' },
  { value: 15, label: '15 minutes' },
  { value: 30, label: '30 minutes' },
];

// Notification preference options
const NOTIFICATION_OPTIONS: { value: EmergencyContact['notificationPreference']; label: string; description: string }[] = [
  { value: 'sms', label: 'SMS Only', description: 'Text message alert' },
  { value: 'call', label: 'Call Only', description: 'Phone call alert' },
  { value: 'email', label: 'Email Only', description: 'Email alert' },
  { value: 'all', label: 'All Methods', description: 'SMS, call, and email' },
];

export default function BiometricSettingsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<BiometricSettingsUI>(getDefaultBiometricSettings());
  const [voiceEnrolled, setVoiceEnrolled] = useState(false);
  const [faceEnrolled, setFaceEnrolled] = useState(false);
  const [showEmergencyContactForm, setShowEmergencyContactForm] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactRelationship, setContactRelationship] = useState('');

  // Load settings
  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      const [loadedSettings, voiceStatus, faceStatus] = await Promise.all([
        getBiometricSettings(),
        isVoicePrintEnrolled(),
        isFacePrintEnrolled(),
      ]);

      setSettings(loadedSettings);
      setVoiceEnrolled(voiceStatus);
      setFaceEnrolled(faceStatus);

      // Pre-fill emergency contact form if exists
      if (loadedSettings.emergencyContact) {
        setContactName(loadedSettings.emergencyContact.name);
        setContactPhone(loadedSettings.emergencyContact.phone);
        setContactEmail(loadedSettings.emergencyContact.email || '');
        setContactRelationship(loadedSettings.emergencyContact.relationship);
      }
    } catch (error) {
      console.error('Error loading biometric settings:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Save settings helper
  const updateSettings = async (updates: Partial<BiometricSettingsUI>) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    await saveBiometricSettings(newSettings);
  };

  // Handle voice enrollment
  const handleVoiceEnrollment = async () => {
    if (voiceEnrolled) {
      // Confirm clear
      const confirm = Platform.OS === 'web'
        ? window.confirm('Remove your voice print? You\'ll need to re-enroll for voice verification.')
        : await new Promise<boolean>((resolve) => {
            Alert.alert(
              'Remove Voice Print',
              'Remove your voice print? You\'ll need to re-enroll for voice verification.',
              [
                { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
                { text: 'Remove', style: 'destructive', onPress: () => resolve(true) },
              ]
            );
          });

      if (confirm) {
        await clearVoicePrint();
        setVoiceEnrolled(false);
      }
    } else {
      // Start enrollment
      Alert.alert(
        'Voice Enrollment',
        'To enroll your voice, please speak naturally for about 30 seconds. This creates a unique "voice print" that stays on your device.\n\nReady to begin?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Start', onPress: () => {
            // In a real implementation, this would start audio recording
            Alert.alert('Coming Soon', 'Voice enrollment will be available in a future update.');
          }},
        ]
      );
    }
  };

  // Handle face enrollment
  const handleFaceEnrollment = async () => {
    if (faceEnrolled) {
      const confirm = Platform.OS === 'web'
        ? window.confirm('Remove your face print? You\'ll need to re-enroll for face verification.')
        : await new Promise<boolean>((resolve) => {
            Alert.alert(
              'Remove Face Print',
              'Remove your face print? You\'ll need to re-enroll for face verification.',
              [
                { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
                { text: 'Remove', style: 'destructive', onPress: () => resolve(true) },
              ]
            );
          });

      if (confirm) {
        await clearFacePrint();
        setFaceEnrolled(false);
      }
    } else {
      Alert.alert(
        'Face Enrollment',
        'To enroll your face, we\'ll take a few photos from different angles. This creates a unique "face print" that stays on your device.\n\nReady to begin?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Start', onPress: () => {
            // In a real implementation, this would start camera
            Alert.alert('Coming Soon', 'Face enrollment will be available in a future update.');
          }},
        ]
      );
    }
  };

  // Save emergency contact
  const saveEmergencyContact = async () => {
    if (!contactName.trim() || !contactPhone.trim()) {
      Alert.alert('Required Fields', 'Please enter at least a name and phone number.');
      return;
    }

    const contact: EmergencyContactUI = {
      name: contactName.trim(),
      phone: contactPhone.trim(),
      email: contactEmail.trim() || undefined,
      relationship: contactRelationship.trim() || 'Emergency Contact',
      notificationPreference: settings.emergencyContact?.notificationPreference || 'sms',
    };

    await updateSettings({
      emergencyContact: contact,
      notifyEmergencyContact: true,
    });
    setShowEmergencyContactForm(false);
  };

  // Remove emergency contact
  const removeEmergencyContact = async () => {
    const confirm = Platform.OS === 'web'
      ? window.confirm('Remove emergency contact?')
      : await new Promise<boolean>((resolve) => {
          Alert.alert(
            'Remove Emergency Contact',
            'Remove this emergency contact?',
            [
              { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
              { text: 'Remove', style: 'destructive', onPress: () => resolve(true) },
            ]
          );
        });

    if (confirm) {
      await updateSettings({
        emergencyContact: null,
        notifyEmergencyContact: false,
      });
      setContactName('');
      setContactPhone('');
      setContactEmail('');
      setContactRelationship('');
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Safety & Monitoring',
          headerBackTitle: 'Settings',
        }}
      />
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
      >
        {/* Voice Analysis Section */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              🎙️ Voice Analysis
            </Text>
          </View>

          <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
            Detects speech patterns that may indicate distress, intoxication, or medical issues. Your voice data never leaves your device.
          </Text>

          <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                Enable Voice Analysis
              </Text>
              <Text style={[styles.settingHint, { color: colors.textMuted }]}>
                Analyze speech during conversations
              </Text>
            </View>
            <Switch
              value={settings.speechAnalysisEnabled}
              onValueChange={(value) => updateSettings({ speechAnalysisEnabled: value })}
              trackColor={{ false: '#767577', true: colors.tint + '80' }}
              thumbColor={settings.speechAnalysisEnabled ? colors.tint : '#f4f3f4'}
            />
          </View>

          {settings.speechAnalysisEnabled && (
            <>
              {/* Voice Print Status */}
              <View style={[styles.enrollmentCard, { backgroundColor: colors.background }]}>
                <View style={styles.enrollmentInfo}>
                  <Text style={[styles.enrollmentLabel, { color: colors.text }]}>
                    Voice Print
                  </Text>
                  <Text style={[styles.enrollmentStatus, { color: voiceEnrolled ? '#4CAF50' : colors.textMuted }]}>
                    {voiceEnrolled ? '✓ Enrolled' : 'Not enrolled'}
                  </Text>
                </View>
                <Pressable
                  style={[styles.enrollmentButton, { backgroundColor: voiceEnrolled ? colors.error + '20' : colors.tint }]}
                  onPress={handleVoiceEnrollment}
                >
                  <Text style={[styles.enrollmentButtonText, { color: voiceEnrolled ? colors.error : '#fff' }]}>
                    {voiceEnrolled ? 'Remove' : 'Enroll'}
                  </Text>
                </Pressable>
              </View>

              <Text style={[styles.detailText, { color: colors.textMuted }]}>
                Detects: slurring, stuttering changes, pace changes, voice tremor
              </Text>
            </>
          )}
        </View>

        {/* Facial Analysis Section */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              📷 Facial Analysis
            </Text>
          </View>

          <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
            Detects emotional states and signs of fatigue or distress. Camera images are processed locally and never stored.
          </Text>

          <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                Enable Facial Analysis
              </Text>
              <Text style={[styles.settingHint, { color: colors.textMuted }]}>
                Detect emotions and fatigue
              </Text>
            </View>
            <Switch
              value={settings.facialAnalysisEnabled}
              onValueChange={(value) => updateSettings({ facialAnalysisEnabled: value })}
              trackColor={{ false: '#767577', true: colors.tint + '80' }}
              thumbColor={settings.facialAnalysisEnabled ? colors.tint : '#f4f3f4'}
            />
          </View>

          {settings.facialAnalysisEnabled && (
            <>
              {/* Face Print Status */}
              <View style={[styles.enrollmentCard, { backgroundColor: colors.background }]}>
                <View style={styles.enrollmentInfo}>
                  <Text style={[styles.enrollmentLabel, { color: colors.text }]}>
                    Face Print
                  </Text>
                  <Text style={[styles.enrollmentStatus, { color: faceEnrolled ? '#4CAF50' : colors.textMuted }]}>
                    {faceEnrolled ? '✓ Enrolled' : 'Not enrolled'}
                  </Text>
                </View>
                <Pressable
                  style={[styles.enrollmentButton, { backgroundColor: faceEnrolled ? colors.error + '20' : colors.tint }]}
                  onPress={handleFaceEnrollment}
                >
                  <Text style={[styles.enrollmentButtonText, { color: faceEnrolled ? colors.error : '#fff' }]}>
                    {faceEnrolled ? 'Remove' : 'Enroll'}
                  </Text>
                </Pressable>
              </View>

              <Text style={[styles.detailText, { color: colors.textMuted }]}>
                Detects: emotions, fatigue, stress indicators, distress signs
              </Text>
            </>
          )}
        </View>

        {/* Continuous Monitoring */}
        {(settings.speechAnalysisEnabled || settings.facialAnalysisEnabled) && (
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                ⏱️ Monitoring Mode
              </Text>
            </View>

            <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  Continuous Monitoring
                </Text>
                <Text style={[styles.settingHint, { color: colors.textMuted }]}>
                  Monitor throughout conversations
                </Text>
              </View>
              <Switch
                value={settings.continuousMonitoring}
                onValueChange={(value) => updateSettings({ continuousMonitoring: value })}
                trackColor={{ false: '#767577', true: colors.tint + '80' }}
                thumbColor={settings.continuousMonitoring ? colors.tint : '#f4f3f4'}
              />
            </View>

            <Text style={[styles.detailText, { color: colors.textMuted }]}>
              When off, analysis only happens at the start of a conversation.
            </Text>
          </View>
        )}

        {/* Emergency Contact Section */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              🚨 Emergency Contact
            </Text>
          </View>

          <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
            Optionally notify someone if concerning patterns are detected and you don't respond. You're always alerted first.
          </Text>

          {settings.emergencyContact ? (
            <View style={[styles.contactCard, { backgroundColor: colors.background }]}>
              <View style={styles.contactInfo}>
                <Text style={[styles.contactName, { color: colors.text }]}>
                  {settings.emergencyContact.name}
                </Text>
                <Text style={[styles.contactDetails, { color: colors.textSecondary }]}>
                  {settings.emergencyContact.relationship} • {settings.emergencyContact.phone}
                </Text>
              </View>
              <View style={styles.contactActions}>
                <Pressable
                  style={styles.contactEditButton}
                  onPress={() => setShowEmergencyContactForm(true)}
                >
                  <Text style={[styles.contactEditText, { color: colors.tint }]}>Edit</Text>
                </Pressable>
                <Pressable
                  style={styles.contactRemoveButton}
                  onPress={removeEmergencyContact}
                >
                  <Text style={[styles.contactRemoveText, { color: colors.error }]}>Remove</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <Pressable
              style={[styles.addContactButton, { backgroundColor: colors.tint }]}
              onPress={() => setShowEmergencyContactForm(true)}
            >
              <Text style={styles.addContactText}>+ Add Emergency Contact</Text>
            </Pressable>
          )}

          {/* Emergency Contact Form */}
          {showEmergencyContactForm && (
            <View style={[styles.contactForm, { backgroundColor: colors.background }]}>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                placeholder="Name"
                placeholderTextColor={colors.textMuted}
                value={contactName}
                onChangeText={setContactName}
              />
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                placeholder="Phone Number"
                placeholderTextColor={colors.textMuted}
                value={contactPhone}
                onChangeText={setContactPhone}
                keyboardType="phone-pad"
              />
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                placeholder="Email (optional)"
                placeholderTextColor={colors.textMuted}
                value={contactEmail}
                onChangeText={setContactEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                placeholder="Relationship (e.g., Partner, Friend)"
                placeholderTextColor={colors.textMuted}
                value={contactRelationship}
                onChangeText={setContactRelationship}
              />

              <View style={styles.formButtons}>
                <Pressable
                  style={[styles.formButton, { backgroundColor: colors.tint }]}
                  onPress={saveEmergencyContact}
                >
                  <Text style={styles.formButtonText}>Save Contact</Text>
                </Pressable>
                <Pressable
                  style={styles.cancelButton}
                  onPress={() => setShowEmergencyContactForm(false)}
                >
                  <Text style={[styles.cancelButtonText, { color: colors.textMuted }]}>Cancel</Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* Triage Settings */}
          {settings.emergencyContact && (
            <>
              <View style={[styles.settingRow, { borderBottomColor: colors.border, marginTop: 16 }]}>
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>
                    Notify Emergency Contact
                  </Text>
                  <Text style={[styles.settingHint, { color: colors.textMuted }]}>
                    After you don't respond to alerts
                  </Text>
                </View>
                <Switch
                  value={settings.notifyEmergencyContact}
                  onValueChange={(value) => updateSettings({ notifyEmergencyContact: value })}
                  trackColor={{ false: '#767577', true: colors.tint + '80' }}
                  thumbColor={settings.notifyEmergencyContact ? colors.tint : '#f4f3f4'}
                />
              </View>

              {settings.notifyEmergencyContact && (
                <>
                  {/* Wait Time */}
                  <View style={styles.waitTimeSection}>
                    <Text style={[styles.waitTimeLabel, { color: colors.text }]}>
                      Wait before notifying
                    </Text>
                    <View style={styles.waitTimeOptions}>
                      {WAIT_TIME_OPTIONS.map((option) => (
                        <Pressable
                          key={option.value}
                          style={[
                            styles.waitTimeOption,
                            {
                              backgroundColor: settings.emergencyContactDelay === option.value
                                ? colors.tint
                                : colors.background,
                              borderColor: colors.border,
                            },
                          ]}
                          onPress={() => updateSettings({ emergencyContactDelay: option.value })}
                        >
                          <Text
                            style={[
                              styles.waitTimeText,
                              { color: settings.emergencyContactDelay === option.value ? '#fff' : colors.text },
                            ]}
                          >
                            {option.label}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>

                  {/* Bypass for Urgent */}
                  <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
                    <View style={styles.settingInfo}>
                      <Text style={[styles.settingLabel, { color: colors.text }]}>
                        Bypass Delay for Urgent
                      </Text>
                      <Text style={[styles.settingHint, { color: colors.textMuted }]}>
                        Contact immediately for severe alerts
                      </Text>
                    </View>
                    <Switch
                      value={settings.bypassDelayForUrgent}
                      onValueChange={(value) => updateSettings({ bypassDelayForUrgent: value })}
                      trackColor={{ false: '#767577', true: colors.tint + '80' }}
                      thumbColor={settings.bypassDelayForUrgent ? colors.tint : '#f4f3f4'}
                    />
                  </View>
                </>
              )}
            </>
          )}
        </View>

        {/* Privacy Section */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              🔒 Privacy
            </Text>
          </View>

          <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                Help Improve Detection
              </Text>
              <Text style={[styles.settingHint, { color: colors.textMuted }]}>
                Share anonymous patterns (no personal data)
              </Text>
            </View>
            <Switch
              value={settings.shareAnonymousDataForTraining}
              onValueChange={(value) => updateSettings({ shareAnonymousDataForTraining: value })}
              trackColor={{ false: '#767577', true: colors.tint + '80' }}
              thumbColor={settings.shareAnonymousDataForTraining ? colors.tint : '#f4f3f4'}
            />
          </View>

          <Text style={[styles.privacyNote, { color: colors.textMuted }]}>
            All biometric data (voice recordings, face images) stays on your device. Only aggregated, anonymous metrics are shared if you enable the option above.
          </Text>
        </View>

        {/* How It Works */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              ℹ️ How Triage Works
            </Text>
          </View>

          <View style={styles.triageSteps}>
            <View style={styles.triageStep}>
              <Text style={[styles.triageNumber, { color: colors.tint }]}>1</Text>
              <Text style={[styles.triageText, { color: colors.textSecondary }]}>
                Concerning pattern detected
              </Text>
            </View>
            <View style={styles.triageStep}>
              <Text style={[styles.triageNumber, { color: colors.tint }]}>2</Text>
              <Text style={[styles.triageText, { color: colors.textSecondary }]}>
                YOU are alerted first: "Are you okay?"
              </Text>
            </View>
            <View style={styles.triageStep}>
              <Text style={[styles.triageNumber, { color: colors.tint }]}>3</Text>
              <Text style={[styles.triageText, { color: colors.textSecondary }]}>
                If you respond "I'm fine" — no escalation
              </Text>
            </View>
            <View style={styles.triageStep}>
              <Text style={[styles.triageNumber, { color: colors.tint }]}>4</Text>
              <Text style={[styles.triageText, { color: colors.textSecondary }]}>
                If no response after wait time — emergency contact notified (if enabled)
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  section: {
    borderRadius: 16,
    padding: 16,
  },
  sectionHeader: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  sectionDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  settingInfo: {
    flex: 1,
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingHint: {
    fontSize: 13,
    marginTop: 2,
  },
  detailText: {
    fontSize: 13,
    marginTop: 12,
    fontStyle: 'italic',
  },
  enrollmentCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginTop: 12,
  },
  enrollmentInfo: {
    flex: 1,
  },
  enrollmentLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  enrollmentStatus: {
    fontSize: 13,
    marginTop: 2,
  },
  enrollmentButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  enrollmentButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  contactCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
  },
  contactDetails: {
    fontSize: 13,
    marginTop: 2,
  },
  contactActions: {
    flexDirection: 'row',
    gap: 12,
  },
  contactEditButton: {
    padding: 8,
  },
  contactEditText: {
    fontSize: 14,
    fontWeight: '500',
  },
  contactRemoveButton: {
    padding: 8,
  },
  contactRemoveText: {
    fontSize: 14,
    fontWeight: '500',
  },
  addContactButton: {
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  addContactText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  contactForm: {
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
    gap: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
  },
  formButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  formButton: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  formButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
  },
  waitTimeSection: {
    marginTop: 16,
    marginBottom: 8,
  },
  waitTimeLabel: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 10,
  },
  waitTimeOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  waitTimeOption: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  waitTimeText: {
    fontSize: 14,
  },
  privacyNote: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 12,
  },
  triageSteps: {
    gap: 12,
  },
  triageStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  triageNumber: {
    fontSize: 18,
    fontWeight: '700',
    width: 24,
  },
  triageText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
});
