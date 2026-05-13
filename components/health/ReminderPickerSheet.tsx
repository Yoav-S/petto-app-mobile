import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing } from '@/constants/theme';
import SettingRow from '@/components/ui/SettingRow';

import InlineDatePicker from '@/components/ui/InlineDatePicker';
import InlineTimePicker from '@/components/ui/InlineTimePicker';
import InlineRepeatPicker from '@/components/ui/InlineRepeatPicker';

interface ReminderPickerSheetProps {
  visible: boolean;
  onClose: () => void;
}

const CHIPS = [
  { id: 'morning', label: 'Morning', time: '9:00' },
  { id: 'afternoon', label: 'Afternoon', time: '13:00' },
  { id: 'evening', label: 'Evening', time: '20:00' },
];

type ExpandedRowType = 'date' | 'time' | 'repeat' | null;

export default function ReminderPickerSheet({ visible, onClose }: ReminderPickerSheetProps) {
  const [selectedChip, setSelectedChip] = useState<string | null>('afternoon');
  const [expandedRow, setExpandedRow] = useState<ExpandedRowType>(null);

  const toggleRow = (row: ExpandedRowType) => {
    if (expandedRow === row) {
      setExpandedRow(null);
    } else {
      setExpandedRow(row);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />
        
        <View style={styles.sheet}>
          <View style={styles.dragHandle} />
          
          <View style={styles.header}>
            <View style={styles.headerSpacer} />
            <Text style={styles.title}>Set reminder</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={20} color={Colors.primaryText} />
            </TouchableOpacity>
          </View>
          
          <ScrollView 
            showsVerticalScrollIndicator={false} 
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.contentCard}>
              <Text style={styles.sectionTitle}>Today</Text>
              
              <View style={styles.chipsContainer}>
                {CHIPS.map((chip) => {
                  const isSelected = selectedChip === chip.id;
                  return (
                    <TouchableOpacity 
                      key={chip.id}
                      style={[styles.chip, isSelected && styles.chipActive]}
                      onPress={() => setSelectedChip(chip.id)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.chipLabel, isSelected && styles.chipLabelActive]}>{chip.label}</Text>
                      <Text style={[styles.chipTime, isSelected && styles.chipTimeActive]}>{chip.time}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.settingsWrapper}>
                {/* Date Row */}
                <SettingRow 
                  icon="calendar-outline" 
                  label="Date" 
                  value="24.06.26" 
                  onPress={() => toggleRow('date')} 
                  hideDivider={expandedRow === 'date'}
                />
                {expandedRow === 'date' && (
                  <View style={styles.pickerContainer}>
                    <InlineDatePicker />
                  </View>
                )}

                {/* Time Row */}
                <SettingRow 
                  icon="time-outline" 
                  label="Time" 
                  value="8:00" 
                  onPress={() => toggleRow('time')} 
                  hideDivider={expandedRow === 'time'}
                />
                {expandedRow === 'time' && (
                  <View style={styles.pickerContainer}>
                    <InlineTimePicker />
                  </View>
                )}

                {/* Repeat Row */}
                <SettingRow 
                  icon="repeat-outline" 
                  label="Repeat" 
                  value="Off" 
                  hideDivider // Always hide divider for last row visually unless expanded picker needs it
                  onPress={() => toggleRow('repeat')} 
                />
                {expandedRow === 'repeat' && (
                  <View style={[styles.pickerContainer, styles.pickerContainerLast]}>
                    <InlineRepeatPicker />
                  </View>
                )}
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.doneButton} onPress={onClose} activeOpacity={0.8}>
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingTop: Spacing.md,
    maxHeight: '90%', // Prevent it from taking over the whole screen
  },
  dragHandle: {
    width: 36,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  headerSpacer: {
    width: 32,
  },
  title: {
    fontFamily: 'Rubik-Medium',
    fontSize: 18,
    color: Colors.primaryText,
  },
  closeButton: {
    width: 32,
    height: 32,
    backgroundColor: Colors.background,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  contentCard: {
    backgroundColor: Colors.background,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
  },
  sectionTitle: {
    fontFamily: 'Rubik-Medium',
    fontSize: 16,
    color: Colors.primaryText,
    marginBottom: Spacing.md,
  },
  chipsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
  },
  chip: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chipActive: {
    backgroundColor: Colors.primaryText,
  },
  chipLabel: {
    fontFamily: 'Rubik-Medium',
    fontSize: 12,
    color: Colors.secondaryText,
    marginBottom: 4,
  },
  chipLabelActive: {
    color: Colors.surface,
  },
  chipTime: {
    fontFamily: 'Rubik-Medium',
    fontSize: 14,
    color: Colors.primaryText,
  },
  chipTimeActive: {
    color: Colors.surface,
  },
  settingsWrapper: {
    marginTop: Spacing.sm,
  },
  pickerContainer: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingBottom: Spacing.md,
    marginBottom: Spacing.sm, // Add small gap after picker before next row
  },
  pickerContainerLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
    marginBottom: 0,
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl * 2,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  doneButton: {
    backgroundColor: Colors.primaryText,
    borderRadius: Radius.md,
    paddingVertical: 16,
    alignItems: 'center',
  },
  doneButtonText: {
    fontFamily: 'Rubik-Medium',
    fontSize: 16,
    color: '#FFFFFF',
  },
});
