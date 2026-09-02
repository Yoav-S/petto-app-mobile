import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import HeaderScrollLayout from '@/components/ui/HeaderScrollLayout';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { pickImageFromCamera, pickImageFromLibrary } from '@/services/imagePicker';
import { useFocusEffect } from '@react-navigation/native';
import { Spacing, type ThemeColors } from '@/constants/theme';
import { useColors, useThemedStyles } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';
import ConfirmModal from '@/components/ui/ConfirmModal';
import ScreenHeader from '@/components/ui/ScreenHeader';
import EmptyState from '@/components/ui/EmptyState';
import HealthNoteEditorCard from '@/components/health/HealthNoteEditorCard';
import { HealthFormScreen } from '@/components/health/HealthKeyboardFooter';
import SavingOverlay from '@/components/ui/SavingOverlay';
import ReminderPickerSheet from '@/components/health/ReminderPickerSheet';
import EditPhotoSheet from '@/components/health/EditPhotoSheet';
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
import { formatDisplayDate, formatDisplayTime } from '@/utils/calendar';
import { normalizeRouteParam } from '@/utils/routeParams';
import { PAGE_HORIZONTAL_PADDING } from '@/constants/layout';

function reminderLabel(draft: HealthReminderDraft): string {
  return `${formatDisplayDate(draft.date)}, ${formatDisplayTime(draft.time)}`;
}

export default function EditNoteScreen() {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const toast = useToast();
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
  const openHandled = useRef(false);

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingPhoto, setSavingPhoto] = useState(false);

  const [noteText, setNoteText] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoMime, setPhotoMime] = useState<string | null>(null);
  const [photoChanged, setPhotoChanged] = useState(false);

  const [recordTitle, setRecordTitle] = useState('');
  const [linkedReminderId, setLinkedReminderId] = useState<string | null>(null);
  const [reminderDraft, setReminderDraft] = useState<HealthReminderDraft | null>(null);
  const [reminderSheetVisible, setReminderSheetVisible] = useState(false);
  const [photoSheetVisible, setPhotoSheetVisible] = useState(false);
  const [deleteVisible, setDeleteVisible] = useState(false);
  const loadedRef = useRef(false);
  const savedTextRef = useRef<string | null>(null);

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
            savedTextRef.current = note.text.trim();
            setPhotoUri(note.photo_url ?? null);
            setPhotoMime(null);
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

  const persistPhoto = useCallback(
    async (uri: string | null, mime: string | null) => {
      if (!activePetId || !recordId || !noteId) return;
      setSavingPhoto(true);
      try {
        const photoUrl = uri ? await uploadHealthNotePhoto(uri, mime) : null;
        await updateNote(activePetId, recordId, noteId, { photo_url: photoUrl });
        setPhotoChanged(false);
      } catch (err) {
        toast.showError(getErrorMessage(err));
      } finally {
        setSavingPhoto(false);
      }
    },
    [activePetId, recordId, noteId, toast],
  );

  const handlePickedPhoto = useCallback(
    async (source: 'camera' | 'library') => {
      setReminderSheetVisible(false);
      const picked =
        source === 'camera' ? await pickImageFromCamera() : await pickImageFromLibrary();
      if (picked === 'denied') {
        Alert.alert(
          t('petOnboarding.photo_permission_title'),
          t('petOnboarding.photo_permission_body'),
        );
        return;
      }
      if (picked?.uri) {
        setPhotoUri(picked.uri);
        setPhotoMime(picked.mimeType);
        setPhotoChanged(true);
        await persistPhoto(picked.uri, picked.mimeType);
      }
    },
    [persistPhoto],
  );

  const handleRemovePhoto = useCallback(() => {
    setPhotoUri(null);
    setPhotoMime(null);
    setPhotoChanged(true);
    void persistPhoto(null, null);
  }, [persistPhoto]);

  useEffect(() => {
    if (loading || notFound || openHandled.current || !open) return;
    openHandled.current = true;
    if (open === 'photo') {
      setPhotoSheetVisible(true);
    } else if (open === 'reminder') {
      Keyboard.dismiss();
      setReminderSheetVisible(true);
    }
  }, [loading, notFound, open]);

  /** Auto-save note text — debounced while typing, flushed on blur / unmount. */
  useEffect(() => {
    if (loading || notFound || !loadedRef.current) return;
    const trimmed = noteText.trim();
    if (!trimmed || trimmed === savedTextRef.current) return;
    if (!activePetId || !recordId || !noteId) return;

    const timer = setTimeout(() => {
      savedTextRef.current = trimmed;
      void updateNote(activePetId, recordId, noteId, { text: trimmed }).catch((err) => {
        savedTextRef.current = null;
        toast.showError(getErrorMessage(err));
      });
    }, 700);

    return () => clearTimeout(timer);
  }, [activePetId, loading, noteId, noteText, notFound, recordId, toast]);

  /** Reminder changes save immediately — the sheet is an explicit confirm. */
  const persistReminder = useCallback(
    async (draft: HealthReminderDraft | null) => {
      setReminderDraft(draft);
      if (!activePetId || !recordId || !noteId) return;
      setSaving(true);
      try {
        let nextLinkedReminderId: string | null = linkedReminderId;
        if (draft) {
          nextLinkedReminderId = await upsertHealthReminder(
            activePetId,
            draft,
            healthReminderTitle(noteText, recordTitle),
            linkedReminderId,
          );
        } else if (linkedReminderId) {
          await removeHealthReminder(activePetId, linkedReminderId);
          nextLinkedReminderId = null;
        }
        setLinkedReminderId(nextLinkedReminderId);
        await updateNote(activePetId, recordId, noteId, {
          linked_reminder_id: nextLinkedReminderId,
        });
      } catch (err) {
        toast.showError(getErrorMessage(err));
      } finally {
        setSaving(false);
      }
    },
    [activePetId, linkedReminderId, noteId, noteText, recordId, recordTitle, toast],
  );

  const handleDelete = () => {
    if (!activePetId || !recordId || !noteId) return;
    setDeleteVisible(false);
    toast.showUndo({
      message: t('topics.deleted'),
      onUndo: () => {},
      onCommit: async () => {
        try {
          await deleteNote(activePetId, recordId, noteId);
          router.replace('/topics' as never);
        } catch (err) {
          toast.showError(getErrorMessage(err));
        }
      },
    });
  };

  const header = <ScreenHeader title={t('topics.edit_note')} />;

  if (loading) {
    return (
      <HeaderScrollLayout header={header} edges={['left', 'right']} topFade={false} bottomFade={false}>
        {({ paddingTop }) => (
          <View style={[styles.centered, { paddingTop }]}>
            <ActivityIndicator color={colors.primaryText} />
          </View>
        )}
      </HeaderScrollLayout>
    );
  }

  if (notFound) {
    return (
      <HeaderScrollLayout header={header} edges={['left', 'right']} topFade={false} bottomFade={false}>
        {({ paddingTop }) => (
          <View style={[styles.centered, { paddingTop }]}>
            <EmptyState
              title={t('topics.not_found_title')}
              subtitle={t('topics.not_found_subtitle')}
              actionTitle={t('reminders.back')}
              onAction={() => router.back()}
            />
          </View>
        )}
      </HeaderScrollLayout>
    );
  }

  return (
    <HeaderScrollLayout header={header} edges={['left', 'right']} topFade bottomFade>
      {({ paddingTop }) => (
        <>
          <HealthFormScreen
            scrollInsetTop={paddingTop}
            contentContainerStyle={{
              paddingTop: Math.max(Spacing.md, 16),
              paddingHorizontal: PAGE_HORIZONTAL_PADDING,
            }}
            footer={{
              label: t('topics.delete_note'),
              tone: 'destructive-text',
              onPress: () => {
                setReminderSheetVisible(false);
                setPhotoSheetVisible(false);
                setDeleteVisible(true);
              },
            }}
          >
            <HealthNoteEditorCard
              noteText={noteText}
              onChangeNoteText={setNoteText}
              photoUri={photoUri}
              onPickImage={() => {
                Keyboard.dismiss();
                setReminderSheetVisible(false);
                setPhotoSheetVisible(true);
              }}
              reminderValue={reminderDraft ? reminderLabel(reminderDraft) : null}
              onReminderPress={() => {
                Keyboard.dismiss();
                setPhotoSheetVisible(false);
                setReminderSheetVisible(true);
              }}
              placeholder={t('topics.note_body_placeholder')}
              autoFocus={open === 'focus'}
            />
          </HealthFormScreen>

          <EditPhotoSheet
            visible={photoSheetVisible}
            hasPhoto={Boolean(photoUri)}
            onClose={() => setPhotoSheetVisible(false)}
            onTake={() => {
              setPhotoSheetVisible(false);
              void handlePickedPhoto('camera');
            }}
            onChoose={() => {
              setPhotoSheetVisible(false);
              void handlePickedPhoto('library');
            }}
            onRemove={
              photoUri
                ? () => {
                    setPhotoSheetVisible(false);
                    handleRemovePhoto();
                  }
                : undefined
            }
          />

          <ReminderPickerSheet
            visible={reminderSheetVisible}
            initialDate={reminderDraft?.date}
            initialTime={reminderDraft?.time}
            initialRepeat={reminderDraft?.repeat}
            onClose={() => setReminderSheetVisible(false)}
            onConfirm={(draft) => {
              void persistReminder(draft);
            }}
          />

          <ConfirmModal
            visible={deleteVisible}
            title={t('topics.delete_note_confirm_title')}
            message={t('topics.delete_note_confirm_body')}
            confirmText={t('common.delete')}
            onConfirm={handleDelete}
            onCancel={() => setDeleteVisible(false)}
          />
          <SavingOverlay visible={saving || savingPhoto} />
        </>
      )}
    </HeaderScrollLayout>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
