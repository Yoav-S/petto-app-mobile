import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing } from '@/constants/theme';
import ScreenHeader from '@/components/ui/ScreenHeader';
import ReminderPickerSheet from '@/components/health/ReminderPickerSheet';
import { t } from '@/i18n';
import { useActivePet } from '@/store/petStore';
import { addNote, createRecord } from '@/services/health';
import {
  healthReminderTitle,
  upsertHealthReminder,
  type HealthReminderDraft,
} from '@/services/healthReminder';
import { uploadImage } from '@/services/storage';
import { getErrorMessage } from '@/services/errors';
import { formatDisplayDate } from '@/utils/calendar';

function reminderLabel(draft: HealthReminderDraft): string {
  return `${formatDisplayDate(draft.date)} ${draft.time}`;
}

export default function AddNoteScreen() {
  const router = useRouter();
  const { recordId } = useLocalSearchParams<{ recordId?: string }>();
  const { activePetId } = useActivePet();

  const [conditionTitle, setConditionTitle] = useState('');
  const [note, setNote] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [reminderDraft, setReminderDraft] = useState<HealthReminderDraft | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [reminderSheetVisible, setReminderSheetVisible] = useState(false);

  const needsTitle = !recordId;
  const canSave =
    note.trim().length > 0 && (!needsTitle || conditionTitle.trim().length > 0) && !submitting;

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t('petOnboarding.photo_permission_title'), t('petOnboarding.photo_permission_body'));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!canSave || !activePetId) return;
    try {
      setSubmitting(true);

      let targetRecordId = recordId ?? null;
      if (!targetRecordId) {
        const record = await createRecord(activePetId, { title: conditionTitle.trim() });
        targetRecordId = record.id;
      }

      let photoUrl: string | undefined;
      if (photoUri) {
        photoUrl = await uploadImage(photoUri, 'notes');
      }

      let linkedReminderId: string | undefined;
      if (reminderDraft) {
        linkedReminderId = await upsertHealthReminder(
          activePetId,
          reminderDraft,
          healthReminderTitle(note, conditionTitle),
        );
      }

      await addNote(activePetId, targetRecordId, {
        text: note.trim(),
        photo_url: photoUrl,
        linked_reminder_id: linkedReminderId,
      });

      router.back();
    } catch (err) {
      Alert.alert(t('common.error'), getErrorMessage(err));
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader title={t('health.add_note')} />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {needsTitle ? (
            <>
              <Text style={styles.label}>{t('health.condition_title')}</Text>
              <TextInput
                style={styles.titleInput}
                value={conditionTitle}
                onChangeText={setConditionTitle}
                placeholder={t('health.condition_title_placeholder')}
                placeholderTextColor={Colors.secondaryText}
                autoFocus
              />
            </>
          ) : null}

          <View style={styles.card}>
            {photoUri ? (
              <TouchableOpacity activeOpacity={0.9} onPress={() => setPhotoUri(null)}>
                <Image source={{ uri: photoUri }} style={styles.image} contentFit="cover" />
              </TouchableOpacity>
            ) : null}

            <TextInput
              style={styles.textInput}
              placeholder={t('health.note_placeholder')}
              placeholderTextColor={Colors.secondaryText}
              multiline
              autoFocus={!needsTitle}
              value={note}
              onChangeText={setNote}
              textAlignVertical="top"
            />

            {reminderDraft ? (
              <TouchableOpacity
                style={styles.reminderRow}
                activeOpacity={0.8}
                onPress={() => setReminderSheetVisible(true)}
              >
                <Text style={styles.reminderLabel}>{t('health.reminder_label')}</Text>
                <Text style={styles.reminderValue}> {reminderLabel(reminderDraft)}</Text>
                <TouchableOpacity
                  onPress={() => setReminderDraft(null)}
                  hitSlop={8}
                  accessibilityLabel={t('health.remove_reminder')}
                >
                  <Ionicons name="close-circle" size={16} color={Colors.secondaryText} />
                </TouchableOpacity>
              </TouchableOpacity>
            ) : null}

            <View style={styles.iconRow}>
              <TouchableOpacity style={styles.iconButton} onPress={pickImage}>
                <Ionicons name="image-outline" size={24} color={Colors.secondaryText} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => setReminderSheetVisible(true)}
              >
                <Ionicons name="notifications-outline" size={24} color={Colors.secondaryText} />
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.addButton, !canSave && styles.addButtonDisabled]}
            onPress={handleSave}
            disabled={!canSave}
            activeOpacity={0.8}
          >
            {submitting ? (
              <ActivityIndicator color={Colors.surface} />
            ) : (
              <Text style={styles.addButtonText}>{t('health.add_note')}</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <ReminderPickerSheet
        visible={reminderSheetVisible}
        initialDate={reminderDraft?.date}
        initialTime={reminderDraft?.time}
        initialRepeat={reminderDraft?.repeat}
        onClose={() => setReminderSheetVisible(false)}
        onConfirm={setReminderDraft}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
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
  },
  titleInput: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    fontFamily: 'Rubik-Regular',
    fontSize: 16,
    color: Colors.primaryText,
    marginBottom: Spacing.lg,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    minHeight: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  image: {
    width: '100%',
    height: 180,
    borderRadius: Radius.md,
    marginBottom: Spacing.md,
  },
  textInput: {
    fontFamily: 'Rubik-Regular',
    fontSize: 16,
    color: Colors.primaryText,
    minHeight: 96,
    padding: 0,
  },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  reminderLabel: {
    fontFamily: 'Rubik-Medium',
    fontSize: 14,
    color: Colors.primaryText,
  },
  reminderValue: {
    fontFamily: 'Rubik-Regular',
    fontSize: 14,
    color: Colors.primaryText,
    flex: 1,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.md,
  },
  iconButton: {
    marginRight: Spacing.lg,
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    alignItems: 'flex-end',
  },
  addButton: {
    backgroundColor: Colors.primaryText,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: Radius.md,
    minWidth: 96,
    alignItems: 'center',
  },
  addButtonDisabled: {
    backgroundColor: Colors.button.disabledBg,
  },
  addButtonText: {
    fontFamily: 'Rubik-Medium',
    fontSize: 16,
    color: Colors.surface,
  },
});
