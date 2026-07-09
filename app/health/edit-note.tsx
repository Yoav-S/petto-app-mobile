import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing } from '@/constants/theme';
import ConfirmModal from '@/components/ui/ConfirmModal';
import ScreenHeader from '@/components/ui/ScreenHeader';
import EmptyState from '@/components/ui/EmptyState';
import ReminderPickerSheet from '@/components/health/ReminderPickerSheet';
import { t } from '@/i18n';
import { useActivePet } from '@/store/petStore';
import { getRecord, updateNote, deleteNote } from '@/services/health';
import { getReminder } from '@/services/reminders';
import {
  healthReminderTitle,
  upsertHealthReminder,
  removeHealthReminder,
  type HealthReminderDraft,
} from '@/services/healthReminder';
import { uploadImage } from '@/services/storage';
import { getErrorMessage } from '@/services/errors';
import { formatDisplayDate } from '@/utils/calendar';

function reminderLabel(draft: HealthReminderDraft): string {
  return `${formatDisplayDate(draft.date)} ${draft.time}`;
}

export default function EditNoteScreen() {
  const router = useRouter();
  const { recordId, noteId } = useLocalSearchParams<{ recordId: string; noteId: string }>();
  const { activePetId } = useActivePet();

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [saving, setSaving] = useState(false);

  const [noteText, setNoteText] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoChanged, setPhotoChanged] = useState(false);

  const [linkedReminderId, setLinkedReminderId] = useState<string | null>(null);
  const [reminderDraft, setReminderDraft] = useState<HealthReminderDraft | null>(null);
  const [reminderSheetVisible, setReminderSheetVisible] = useState(false);
  const [deleteVisible, setDeleteVisible] = useState(false);

  const fetchData = useCallback(async () => {
    if (!activePetId || !recordId || !noteId) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    try {
      const detail = await getRecord(activePetId, recordId);
      const note = detail.notes.find((n) => n.id === noteId);
      if (!note) {
        setNotFound(true);
        return;
      }
      setNoteText(note.text);
      setPhotoUri(note.photo_url ?? null);
      setPhotoChanged(false);
      setLinkedReminderId(note.linked_reminder_id ?? null);

      if (note.linked_reminder_id) {
        try {
          const reminder = await getReminder(activePetId, note.linked_reminder_id);
          setReminderDraft({
            date: reminder.date,
            time: reminder.time,
            repeat: (reminder.repeat as HealthReminderDraft['repeat']) ?? 'off',
          });
        } catch {
          setReminderDraft(
            note.linked_reminder_date
              ? {
                  date: note.linked_reminder_date,
                  time: note.linked_reminder_time ?? '09:00',
                  repeat: 'off',
                }
              : null,
          );
        }
      } else {
        setReminderDraft(null);
      }
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [activePetId, recordId, noteId]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchData();
    }, [fetchData]),
  );

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t('petOnboarding.photo_permission_title'), t('petOnboarding.photo_permission_body'));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.85 });
    if (!result.canceled && result.assets[0]?.uri) {
      setPhotoUri(result.assets[0].uri);
      setPhotoChanged(true);
    }
  };

  const removePhoto = () => {
    setPhotoUri(null);
    setPhotoChanged(true);
  };

  const handleSave = async () => {
    if (!activePetId || !recordId || !noteId || !noteText.trim()) return;
    try {
      setSaving(true);

      let photoUrl: string | null | undefined;
      if (photoChanged) {
        photoUrl = photoUri ? await uploadImage(photoUri, 'notes') : null;
      }

      let nextLinkedReminderId: string | null = linkedReminderId;

      if (reminderDraft) {
        nextLinkedReminderId = await upsertHealthReminder(
          activePetId,
          reminderDraft,
          healthReminderTitle(noteText),
          linkedReminderId,
        );
      } else if (linkedReminderId) {
        await removeHealthReminder(activePetId, linkedReminderId);
        nextLinkedReminderId = null;
      }

      await updateNote(activePetId, recordId, noteId, {
        text: noteText.trim(),
        photo_url: photoUrl,
        linked_reminder_id: nextLinkedReminderId,
      });
      router.back();
    } catch (err) {
      Alert.alert(t('common.error'), getErrorMessage(err));
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!activePetId || !recordId || !noteId) return;
    setDeleteVisible(false);
    try {
      await deleteNote(activePetId, recordId, noteId);
      router.replace({ pathname: '/health', params: { deletedNote: 'true' } } as never);
    } catch (err) {
      Alert.alert(t('common.error'), getErrorMessage(err));
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScreenHeader title={t('health.edit_note')} />
        <View style={styles.centered}>
          <ActivityIndicator color={Colors.primaryText} />
        </View>
      </SafeAreaView>
    );
  }

  if (notFound) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScreenHeader title={t('health.edit_note')} />
        <View style={styles.centered}>
          <EmptyState
            title={t('health.not_found_title')}
            subtitle={t('health.not_found_subtitle')}
            actionTitle={t('reminders.back')}
            onAction={() => router.back()}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader title={t('health.edit_note')} />

      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            {photoUri ? (
              <TouchableOpacity activeOpacity={0.9} onPress={removePhoto}>
                <Image source={{ uri: photoUri }} style={styles.image} contentFit="cover" />
              </TouchableOpacity>
            ) : null}

            <TextInput
              style={styles.textInput}
              value={noteText}
              onChangeText={setNoteText}
              multiline
              placeholder={t('health.note_placeholder')}
              placeholderTextColor={Colors.secondaryText}
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
                  onPress={() => {
                    setReminderDraft(null);
                  }}
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

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => setDeleteVisible(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.deleteText}>{t('health.delete_note')}</Text>
          </TouchableOpacity>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.doneButton, (!noteText.trim() || saving) && styles.doneButtonDisabled]}
            onPress={handleSave}
            disabled={!noteText.trim() || saving}
            activeOpacity={0.8}
          >
            {saving ? (
              <ActivityIndicator color={Colors.surface} />
            ) : (
              <Text style={styles.doneButtonText}>{t('common.save')}</Text>
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

      <ConfirmModal
        visible={deleteVisible}
        title={t('health.delete_note_confirm_title')}
        message={t('health.delete_note_confirm_body')}
        confirmText={t('common.delete')}
        onConfirm={handleDelete}
        onCancel={() => setDeleteVisible(false)}
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
  centered: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
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
    lineHeight: 22,
    padding: 0,
    minHeight: 80,
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
  deleteButton: {
    padding: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  deleteText: {
    fontFamily: 'Rubik-Medium',
    fontSize: 16,
    color: Colors.error,
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    alignItems: 'flex-end',
  },
  doneButton: {
    backgroundColor: Colors.primaryText,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: Radius.md,
    minWidth: 96,
    alignItems: 'center',
  },
  doneButtonDisabled: {
    backgroundColor: Colors.button.disabledBg,
  },
  doneButtonText: {
    fontFamily: 'Rubik-Medium',
    fontSize: 16,
    color: Colors.surface,
  },
});
