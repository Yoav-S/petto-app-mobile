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
import { t } from '@/i18n';
import { useActivePet } from '@/store/petStore';
import { createVaccination } from '@/services/vaccines';
import { getErrorMessage } from '@/services/errors';
import { formatDisplayDate, parseIsoDate } from '@/utils/calendar';

type PickerTarget = 'date' | 'next' | null;

export default function AddVaccineScreen() {
  const router = useRouter();
  const { activePetId } = useActivePet();

  const [name, setName] = useState('');
  const [date, setDate] = useState<string | null>(null);
  const [nextDate, setNextDate] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [picker, setPicker] = useState<PickerTarget>(null);
  const [submitting, setSubmitting] = useState(false);

  const canSave = name.trim().length > 0 && !!date && !submitting;

  const handleSave = async () => {
    if (!canSave || !activePetId || !date) return;
    try {
      setSubmitting(true);
      await createVaccination(activePetId, {
        name: name.trim(),
        date,
        next_date: nextDate ?? undefined,
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
      <ScreenHeader title={t('vaccines.add_title')} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>{t('vaccines.field_name')}</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder={t('vaccines.field_name_placeholder')}
            placeholderTextColor={Colors.secondaryText}
            autoFocus
          />

          <Text style={styles.label}>{t('vaccines.field_date')}</Text>
          <TouchableOpacity style={styles.fieldButton} onPress={() => setPicker('date')}>
            <Text style={[styles.fieldValue, !date && styles.placeholder]}>
              {date ? formatDisplayDate(date) : t('vaccines.field_date_placeholder')}
            </Text>
            <Ionicons name="calendar-outline" size={20} color={Colors.secondaryText} />
          </TouchableOpacity>

          <Text style={styles.label}>{t('vaccines.field_next')}</Text>
          <TouchableOpacity style={styles.fieldButton} onPress={() => setPicker('next')}>
            <Text style={[styles.fieldValue, !nextDate && styles.placeholder]}>
              {nextDate ? formatDisplayDate(nextDate) : t('vaccines.field_next_placeholder')}
            </Text>
            <View style={styles.fieldRight}>
              {nextDate ? (
                <TouchableOpacity onPress={() => setNextDate(null)} hitSlop={8}>
                  <Ionicons name="close-circle" size={18} color={Colors.secondaryText} />
                </TouchableOpacity>
              ) : null}
              <Ionicons name="calendar-outline" size={20} color={Colors.secondaryText} />
            </View>
          </TouchableOpacity>

          <Text style={styles.label}>{t('vaccines.field_note')}</Text>
          <TextInput
            style={[styles.input, styles.noteInput]}
            value={note}
            onChangeText={setNote}
            placeholder={t('vaccines.field_note_placeholder')}
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
        visible={picker === 'date'}
        initialDate={parseIsoDate(date)}
        allowFuture
        onClose={() => setPicker(null)}
        onConfirm={(iso) => {
          setDate(iso);
          setPicker(null);
        }}
      />
      <BirthDatePickerSheet
        visible={picker === 'next'}
        initialDate={parseIsoDate(nextDate)}
        allowFuture
        onClose={() => setPicker(null)}
        onConfirm={(iso) => {
          setNextDate(iso);
          setPicker(null);
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
  fieldRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
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
