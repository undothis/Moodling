/**
 * Safety Plan Builder
 *
 * Interactive tool to create a personal crisis safety plan.
 * Based on the Stanley-Brown Safety Planning Intervention.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SAFETY_PLAN_KEY = 'mood_leaf_safety_plan';

interface SafetyPlan {
  warningSignals: string[];
  copingStrategies: string[];
  distractions: string[];
  supportPeople: { name: string; phone: string }[];
  professionals: { name: string; phone: string }[];
  emergencyContacts: { name: string; phone: string }[];
  safeEnvironment: string[];
  reasonsToLive: string[];
  lastUpdated: string;
}

const DEFAULT_PLAN: SafetyPlan = {
  warningSignals: [],
  copingStrategies: [],
  distractions: [],
  supportPeople: [],
  professionals: [],
  emergencyContacts: [
    { name: 'National Suicide Prevention Lifeline', phone: '988' },
    { name: 'Crisis Text Line', phone: 'Text HOME to 741741' },
  ],
  safeEnvironment: [],
  reasonsToLive: [],
  lastUpdated: new Date().toISOString(),
};

interface SafetyPlanBuilderProps {
  onClose?: () => void;
}

export default function SafetyPlanBuilder({ onClose }: SafetyPlanBuilderProps) {
  const [plan, setPlan] = useState<SafetyPlan>(DEFAULT_PLAN);
  const [activeSection, setActiveSection] = useState<number>(0);
  const [newItem, setNewItem] = useState('');
  const [newContact, setNewContact] = useState({ name: '', phone: '' });
  const [isEditing, setIsEditing] = useState(false);

  const sections = [
    {
      title: '1. Warning Signs',
      emoji: '⚠️',
      description: 'What thoughts, feelings, or behaviors tell you a crisis may be developing?',
      key: 'warningSignals' as const,
      type: 'list',
      placeholder: 'e.g., "Feeling hopeless", "Isolating from friends"',
    },
    {
      title: '2. Coping Strategies',
      emoji: '🛠️',
      description: 'Things I can do on my own to take my mind off problems:',
      key: 'copingStrategies' as const,
      type: 'list',
      placeholder: 'e.g., "Go for a walk", "Listen to music"',
    },
    {
      title: '3. Distractions',
      emoji: '🎯',
      description: 'Places and social activities that help distract me:',
      key: 'distractions' as const,
      type: 'list',
      placeholder: 'e.g., "Coffee shop", "Call a friend"',
    },
    {
      title: '4. People I Can Ask for Help',
      emoji: '👥',
      description: 'Friends or family I can reach out to:',
      key: 'supportPeople' as const,
      type: 'contacts',
      placeholder: 'Name',
    },
    {
      title: '5. Professionals',
      emoji: '👨‍⚕️',
      description: 'Therapists, doctors, or counselors I can contact:',
      key: 'professionals' as const,
      type: 'contacts',
      placeholder: 'Name',
    },
    {
      title: '6. Emergency Contacts',
      emoji: '🆘',
      description: 'Crisis lines and emergency services:',
      key: 'emergencyContacts' as const,
      type: 'contacts',
      placeholder: 'Name',
    },
    {
      title: '7. Making My Environment Safe',
      emoji: '🏠',
      description: 'Steps to reduce access to lethal means:',
      key: 'safeEnvironment' as const,
      type: 'list',
      placeholder: 'e.g., "Give medications to trusted person"',
    },
    {
      title: '8. My Reasons for Living',
      emoji: '💚',
      description: 'What matters most to me and keeps me going:',
      key: 'reasonsToLive' as const,
      type: 'list',
      placeholder: 'e.g., "My children", "My pet", "Future goals"',
    },
  ];

  // Load saved plan
  useEffect(() => {
    AsyncStorage.getItem(SAFETY_PLAN_KEY).then((stored) => {
      if (stored) {
        setPlan(JSON.parse(stored));
      }
    });
  }, []);

  // Save plan
  const savePlan = async (updatedPlan: SafetyPlan) => {
    updatedPlan.lastUpdated = new Date().toISOString();
    await AsyncStorage.setItem(SAFETY_PLAN_KEY, JSON.stringify(updatedPlan));
    setPlan(updatedPlan);
  };

  // Add item to list
  const addListItem = (key: keyof SafetyPlan) => {
    if (!newItem.trim()) return;
    const updated = { ...plan };
    (updated[key] as string[]).push(newItem.trim());
    savePlan(updated);
    setNewItem('');
  };

  // Add contact
  const addContact = (key: keyof SafetyPlan) => {
    if (!newContact.name.trim()) return;
    const updated = { ...plan };
    (updated[key] as { name: string; phone: string }[]).push({
      name: newContact.name.trim(),
      phone: newContact.phone.trim(),
    });
    savePlan(updated);
    setNewContact({ name: '', phone: '' });
  };

  // Remove item
  const removeItem = (key: keyof SafetyPlan, index: number) => {
    Alert.alert('Remove Item', 'Are you sure you want to remove this?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          const updated = { ...plan };
          (updated[key] as any[]).splice(index, 1);
          savePlan(updated);
        },
      },
    ]);
  };

  const currentSection = sections[activeSection];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Safety Plan</Text>
          <Text style={styles.subtitle}>Your personal crisis roadmap</Text>
        </View>
        {onClose && (
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#64748B" />
          </TouchableOpacity>
        )}
      </View>

      {/* Section tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsContainer}>
        {sections.map((section, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.tab, activeSection === index && styles.tabActive]}
            onPress={() => setActiveSection(index)}
          >
            <Text style={styles.tabEmoji}>{section.emoji}</Text>
            <Text style={[styles.tabNumber, activeSection === index && styles.tabNumberActive]}>
              {index + 1}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Content */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionEmoji}>{currentSection.emoji}</Text>
          <Text style={styles.sectionTitle}>{currentSection.title}</Text>
        </View>
        <Text style={styles.sectionDescription}>{currentSection.description}</Text>

        {/* List items */}
        {currentSection.type === 'list' && (
          <>
            {(plan[currentSection.key] as string[]).map((item, index) => (
              <View key={index} style={styles.listItem}>
                <Text style={styles.listItemText}>{item}</Text>
                <TouchableOpacity onPress={() => removeItem(currentSection.key, index)}>
                  <Ionicons name="close-circle" size={20} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ))}
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                placeholder={currentSection.placeholder}
                placeholderTextColor="#94A3B8"
                value={newItem}
                onChangeText={setNewItem}
                onSubmitEditing={() => addListItem(currentSection.key)}
              />
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => addListItem(currentSection.key)}
              >
                <Ionicons name="add" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Contact items */}
        {currentSection.type === 'contacts' && (
          <>
            {(plan[currentSection.key] as { name: string; phone: string }[]).map((contact, index) => (
              <View key={index} style={styles.contactItem}>
                <View style={styles.contactInfo}>
                  <Text style={styles.contactName}>{contact.name}</Text>
                  <Text style={styles.contactPhone}>{contact.phone}</Text>
                </View>
                <TouchableOpacity onPress={() => removeItem(currentSection.key, index)}>
                  <Ionicons name="close-circle" size={20} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ))}
            <View style={styles.contactInputs}>
              <TextInput
                style={[styles.input, styles.contactNameInput]}
                placeholder="Name"
                placeholderTextColor="#94A3B8"
                value={newContact.name}
                onChangeText={(text) => setNewContact({ ...newContact, name: text })}
              />
              <TextInput
                style={[styles.input, styles.contactPhoneInput]}
                placeholder="Phone"
                placeholderTextColor="#94A3B8"
                value={newContact.phone}
                onChangeText={(text) => setNewContact({ ...newContact, phone: text })}
                keyboardType="phone-pad"
              />
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => addContact(currentSection.key)}
              >
                <Ionicons name="add" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Tips */}
        <View style={styles.tipBox}>
          <Ionicons name="bulb" size={16} color="#F59E0B" />
          <Text style={styles.tipText}>
            {activeSection === 0 && 'Recognizing warning signs early can help you intervene before a crisis escalates.'}
            {activeSection === 1 && 'These are things you can do alone, without needing to contact anyone.'}
            {activeSection === 2 && 'Having multiple options helps when one strategy isn\'t working.'}
            {activeSection === 3 && 'Let these people know they\'re on your safety plan so they\'re prepared.'}
            {activeSection === 4 && 'Include your therapist\'s after-hours number if available.'}
            {activeSection === 5 && '988 is the Suicide & Crisis Lifeline, available 24/7.'}
            {activeSection === 6 && 'Reducing access to means saves lives. Ask someone to hold items temporarily.'}
            {activeSection === 7 && 'Revisit this list when you\'re feeling good to add more reasons.'}
          </Text>
        </View>
      </ScrollView>

      {/* Navigation */}
      <View style={styles.navigation}>
        <TouchableOpacity
          style={[styles.navButton, activeSection === 0 && styles.navButtonDisabled]}
          onPress={() => setActiveSection((s) => Math.max(0, s - 1))}
          disabled={activeSection === 0}
        >
          <Ionicons name="chevron-back" size={20} color={activeSection === 0 ? '#CBD5E1' : '#6366F1'} />
          <Text style={[styles.navText, activeSection === 0 && styles.navTextDisabled]}>Previous</Text>
        </TouchableOpacity>

        <Text style={styles.pageIndicator}>{activeSection + 1} / {sections.length}</Text>

        <TouchableOpacity
          style={[styles.navButton, activeSection === sections.length - 1 && styles.navButtonDisabled]}
          onPress={() => setActiveSection((s) => Math.min(sections.length - 1, s + 1))}
          disabled={activeSection === sections.length - 1}
        >
          <Text style={[styles.navText, activeSection === sections.length - 1 && styles.navTextDisabled]}>Next</Text>
          <Ionicons name="chevron-forward" size={20} color={activeSection === sections.length - 1 ? '#CBD5E1' : '#6366F1'} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },
  closeButton: {
    padding: 8,
  },
  tabsContainer: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tab: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  tabActive: {
    backgroundColor: '#EEF2FF',
  },
  tabEmoji: {
    fontSize: 20,
    marginBottom: 2,
  },
  tabNumber: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
  },
  tabNumberActive: {
    color: '#6366F1',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionEmoji: {
    fontSize: 28,
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  sectionDescription: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 20,
    lineHeight: 20,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  listItemText: {
    flex: 1,
    fontSize: 15,
    color: '#334155',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#1E293B',
  },
  addButton: {
    backgroundColor: '#6366F1',
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#334155',
  },
  contactPhone: {
    fontSize: 13,
    color: '#6366F1',
    marginTop: 2,
  },
  contactInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  contactNameInput: {
    flex: 2,
    marginRight: 8,
  },
  contactPhoneInput: {
    flex: 1,
  },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFBEB',
    padding: 12,
    borderRadius: 12,
    marginTop: 20,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: '#92400E',
    marginLeft: 8,
    lineHeight: 18,
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366F1',
  },
  navTextDisabled: {
    color: '#CBD5E1',
  },
  pageIndicator: {
    fontSize: 12,
    color: '#94A3B8',
  },
});
