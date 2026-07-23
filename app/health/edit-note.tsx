import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Spacing, type ThemeColors } from '@/constants/theme';
import { useColors, useThemedStyles } from '@/context/ThemeContext';
import ConfirmModal from '@/components/ui/ConfirmModal';
import ScreenHeader from '@/components/ui/ScreenHeader';
import EmptyState from '@/components/ui/EmptyState';
import HealthNoteEditorCard from '@/components/health/HealthNoteEditorCard';
import HealthKeyboardFooter, {
  HealthKeyboardAvoidingView,
  healthDoneScrollPadding,
} from '@/components/health/HealthKeyboardFooter';
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
import { uploadHealthNotePhoto } from '@/services/storage';
import { getErrorMessage } from '@/services/errors';
import { formatDisplayDate } from '@/utils/calendar';
import { normalizeRouteParam } from '@/utils/routeParams';

const DESIGN_HEIGHT = 812;

function reminderLabel(draft: HealthReminderDraft): string {
  return `${formatDisplayDate(draft.date)} ${draft.time}`;
}

export default function EditNoteScreen() {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const { recordId: recordIdParam, noteId: noteIdParam, open: openParam } = useLocalSearchParams<{
    recordId: string;
    noteId: string;
    open?: string;
  }>();
  const recordId = normalizeRouteParam(recordIdParam);
  const noteId = normalizeRouteParam(noteIdParam);
  const open = normalizeRouteParam(openParam);
  const { activePetId } = useActivePet();
  const { height } = useWindowDimensions();
  const sy = height / DESIGN_HEIGHT;
  const openHandled = useRef(false);

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [saving, setSaving] = useState(false);

  const [noteText, setNoteText] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoChanged, setPhotoChanged] = useState(false);

  const [recordTitle, setRecordTitle] = useState('');
  const [linkedReminderId, setLinkedReminderId] = useState<string | null>(null);
  const [reminderDraft, setReminderDraft] = useState<HealthReminderDraft | null>(null);
  const [reminderSheetVisible, setReminderSheetVisible] = useState(false);
  const [deleteVisible, setDeleteVisible] = useState(false);
  const loadedRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      openHandled.current = false;

      (async () => {
        if (!activePetId || !recordId || !noteId) {
          if (!cancelled) {
            setNotFound(true);
            setLoading(false);
          }
          return;
        }

        const showFullLoader = !loadedRef.current;
        if (showFullLoader && !cancelled) setLoading(true);

        try {
          const detail = await getRecord(activePetId, recordId);
          const note = detail.notes.find((n) => n.id === noteId);
          if (!note) {
            if (!cancelled) setNotFound(true);
            return;
          }
          if (!cancelled) {
            setNotFound(false);
            setRecordTitle(detail.title ?? '');
            setNoteText(note.text);
            setPhotoUri(note.photo_url ?? null);
            setPhotoChanged(false);
            setLinkedReminderId(note.linked_reminder_id ?? null);
          }

          if (note.linked_reminder_id) {
            try {
              const reminder = await getReminder(activePetId, note.linked_reminder_id);
              if (!cancelled) {
                setReminderDraft({
                  date: reminder.date,
                  time: reminder.time,
                  repeat: (reminder.repeat as HealthReminderDraft['repeat']) ?? 'off',
                });
              }
            } catch {
              if (!cancelled) {
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
            }
          } else if (!cancelled) {
            setReminderDraft(null);
          }

          if (!cancelled) loadedRef.current = true;
        } catch {
          if (!cancelled) setNotFound(true);
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();

      return () => {
        cancelled = true;
      };
    }, [activePetId, recordId, noteId]),
  );

  const pickImage = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    if (loading || notFound || openHandled.current || !open) return;
    openHandled.current = true;
    if (open === 'photo') {
      void pickImage();
    } else if (open === 'reminder') {
      setReminderSheetVisible(true);
    }
  }, [loading, notFound, open, pickImage]);

  const handleSave = async () => {
    if (!activePetId || !recordId || !noteId || !noteText.trim()) return;
    try {
      setSaving(true);

      let photoUrl: string | null | undefined;
      if (photoChanged) {
        photoUrl = photoUri ? await uploadHealthNotePhoto(photoUri) : null;
      }

      let nextLinkedReminderId: string | null = linkedReminderId;

      if (reminderDraft) {
        nextLinkedReminderId = await upsertHealthReminder(
          activePetId,
          reminderDraft,
          healthReminderTitle(noteText, recordTitle),
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
    } finally {
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
      <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
        <ScreenHeader title={t('health.edit_note')} />
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primaryText} />
        </View>
      </SafeAreaView>
    );
  }

  if (notFound) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
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
    <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
      <ScreenHeader title={t('health.edit_note')} />

      <HealthKeyboardAvoidingView>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.content,
            {
              paddingTop: Math.max(Spacing.md, 16 * sy),
              paddingBottom: healthDoneScrollPadding(sy),
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <HealthNoteEditorCard
            key={photoUri ?? 'no-photo'}
            noteText={noteText}
            onChangeNoteText={setNoteText}
            photoUri={photoUri}
            onPickImage={pickImage}
            reminderValue={reminderDraft ? reminderLabel(reminderDraft) : null}
            onReminderPress={() => setReminderSheetVisible(true)}
            onRemoveReminder={() => setReminderDraft(null)}
            placeholder={t('health.note_body_placeholder')}
          />

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => setDeleteVisible(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.deleteText}>{t('health.delete_note')}</Text>
          </TouchableOpacity>
        </ScrollView>

        <HealthKeyboardFooter
          label={t('pickers.done')}
          disabled={!noteText.trim() || saving}
          loading={saving}
          onPress={handleSave}
          fullWidth={false}
        />
      </HealthKeyboardAvoidingView>

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

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: c.background,
  },
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  centered: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    gap: Spacing.lg,
  },
  deleteButton: {
    padding: Spacing.md,
    alignItems: 'center',
  },
  deleteText: {
    fontFamily: 'Rubik-Medium',
    fontSize: 16,
    color: c.error,
  },
});
