import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing } from '@/constants/theme';
import ScreenHeader from '@/components/ui/ScreenHeader';
import BirthDatePickerSheet from '@/components/onboarding/BirthDatePickerSheet';
import TimePickerSheet from '@/components/pickers/TimePickerSheet';
import RepeatPickerSheet, { repeatLabel } from '@/components/pickers/RepeatPickerSheet';
import { t } from '@/i18n';
import { useActivePet } from '@/store/petStore';
import { createReminder, type RepeatOption } from '@/services/reminders';
import { getErrorMessage } from '@/services/errors';
import { formatDisplayDate, parseIsoDate } from '@/utils/calendar';

type Sheet = 'date' | 'time' | 'repeat' | null;

export default function AddReminderScreen() {
  const router = useRouter();
  const { activePetId } = useActivePet();

  const [title, setTitle] = useState('');
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [repeat, setRepeat] = useState<RepeatOption>('off');
  const [note, setNote] = useState('');
  const [sheet, setSheet] = useState<Sheet>(null);
  const [submitting, setSubmitting] = useState(false);

  const canSave = title.trim().length > 0 && !!date && !!time && !submitting;

  const handleSave = async () => {
    if (!canSave || !activePetId || !date || !time) return;
    try {
      setSubmitting(true);
      await createReminder(activePetId, {
        title: title.trim(),
        date,
        time,
        repeat,
        note: note.trim() || undefined,
      });
      router.back();
    } catch (err) {
      Alert.alert(t('common.error'), getErrorMessage(err));
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader title={t('reminders.add_title')} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>{t('reminders.field_title')}</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder={t('reminders.field_title_placeholder')}
            placeholderTextColor={Colors.secondaryText}
            autoFocus
          />

          <Text style={styles.label}>{t('reminders.field_date')}</Text>
          <TouchableOpacity style={styles.fieldButton} onPress={() => setSheet('date')}>
            <Text style={[styles.fieldValue, !date && styles.placeholder]}>
              {date ? formatDisplayDate(date) : t('reminders.field_date_placeholder')}
            </Text>
            <Ionicons name="calendar-outline" size={20} color={Colors.secondaryText} />
          </TouchableOpacity>

          <Text style={styles.label}>{t('reminders.field_time')}</Text>
          <TouchableOpacity style={styles.fieldButton} onPress={() => setSheet('time')}>
            <Text style={[styles.fieldValue, !time && styles.placeholder]}>
              {time ?? t('reminders.field_time_placeholder')}
            </Text>
            <Ionicons name="time-outline" size={20} color={Colors.secondaryText} />
          </TouchableOpacity>

          <Text style={styles.label}>{t('reminders.field_repeat')}</Text>
          <TouchableOpacity style={styles.fieldButton} onPress={() => setSheet('repeat')}>
            <Text style={styles.fieldValue}>{repeatLabel(repeat)}</Text>
            <Ionicons name="repeat-outline" size={20} color={Colors.secondaryText} />
          </TouchableOpacity>

          <Text style={styles.label}>{t('reminders.field_note')}</Text>
          <TextInput
            style={[styles.input, styles.noteInput]}
            value={note}
            onChangeText={setNote}
            placeholder={t('reminders.field_note_placeholder')}
            placeholderTextColor={Colors.secondaryText}
            multiline
            textAlignVertical="top"
          />
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={!canSave}
            activeOpacity={0.85}
          >
            {submitting ? (
              <ActivityIndicator color={Colors.surface} />
            ) : (
              <Text style={styles.saveText}>{t('common.save')}</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <BirthDatePickerSheet
        visible={sheet === 'date'}
        initialDate={parseIsoDate(date)}
        allowFuture
        onClose={() => setSheet(null)}
        onConfirm={(iso) => {
          setDate(iso);
          setSheet(null);
        }}
      />
      <TimePickerSheet
        visible={sheet === 'time'}
        value={time}
        onClose={() => setSheet(null)}
        onConfirm={(value) => {
          setTime(value);
          setSheet(null);
        }}
      />
      <RepeatPickerSheet
        visible={sheet === 'repeat'}
        value={repeat}
        onClose={() => setSheet(null)}
        onSelect={(value) => {
          setRepeat(value);
          setSheet(null);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  label: {
    fontFamily: 'Rubik-Medium',
    fontSize: 14,
    color: Colors.primaryText,
    marginBottom: Spacing.sm,
    marginTop: Spacing.lg,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    fontFamily: 'Rubik-Regular',
    fontSize: 16,
    color: Colors.primaryText,
  },
  noteInput: {
    minHeight: 96,
  },
  fieldButton: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fieldValue: {
    fontFamily: 'Rubik-Regular',
    fontSize: 16,
    color: Colors.primaryText,
  },
  placeholder: {
    color: Colors.secondaryText,
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  saveButton: {
    backgroundColor: Colors.primaryText,
    borderRadius: Radius.md,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: Colors.button.disabledBg,
  },
  saveText: {
    fontFamily: 'Rubik-Medium',
    fontSize: 16,
    color: Colors.surface,
  },
});
