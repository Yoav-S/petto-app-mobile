import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
import {
  HealthKeyboardAvoidingView,
} from '@/components/health/HealthKeyboardFooter';
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
import { formatDisplayDate } from '@/utils/calendar';
import { normalizeRouteParam } from '@/utils/routeParams';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { DESIGN_HEIGHT } from '@/constants/layout';

function reminderLabel(draft: HealthReminderDraft): string {
  return `${formatDisplayDate(draft.date)} ${draft.time}`;
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
  const { contentWidth, height } = useResponsiveLayout();
  const deleteBottomPad = Math.max(24, Math.round(height * (58 / DESIGN_HEIGHT)));
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
  const [viewportH, setViewportH] = useState(0);
  const [contentH, setContentH] = useState(0);
  const needsScroll = contentH > viewportH + 1;
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

  const handleSave = async () => {
    Keyboard.dismiss();
    if (!activePetId || !recordId || !noteId || !noteText.trim()) return;
    try {
      setSaving(true);

      let photoUrl: string | null | undefined;
      if (photoChanged) {
        photoUrl = photoUri ? await uploadHealthNotePhoto(photoUri, photoMime) : null;
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
      toast.showError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

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

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
        <ScreenHeader title={t('topics.edit_note')} />
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primaryText} />
        </View>
      </SafeAreaView>
    );
  }

  if (notFound) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
        <ScreenHeader title={t('topics.edit_note')} />
        <View style={styles.centered}>
          <EmptyState
            title={t('topics.not_found_title')}
            subtitle={t('topics.not_found_subtitle')}
            actionTitle={t('reminders.back')}
            onAction={() => router.back()}
          />
        </View>
      </SafeAreaView>
    );
  }

  const canSave = Boolean(noteText.trim()) && !saving && !savingPhoto;

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
      <ScreenHeader title={t('topics.edit_note')} />

      <HealthKeyboardAvoidingView>
        <View
          style={styles.flex}
          onLayout={(e) => setViewportH(e.nativeEvent.layout.height)}
        >
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={[
              styles.content,
              {
                paddingTop: Math.max(Spacing.md, 16),
                paddingBottom: deleteBottomPad,
              },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            scrollEnabled={needsScroll}
            onContentSizeChange={(_w, h) => setContentH(h)}
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

            <View style={styles.footerSpacer} />

            <TouchableOpacity
              style={[
                styles.saveButton,
                { width: contentWidth },
                !canSave && styles.saveButtonDisabled,
              ]}
              onPress={handleSave}
              disabled={!canSave}
              activeOpacity={0.85}
            >
              {saving || savingPhoto ? (
                <ActivityIndicator color={colors.surface} />
              ) : (
                <Text style={[styles.saveText, !canSave && styles.saveTextDisabled]}>
                  {t('common.save')}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => {
                setReminderSheetVisible(false);
                setPhotoSheetVisible(false);
                setDeleteVisible(true);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.deleteText}>{t('topics.delete_note')}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </HealthKeyboardAvoidingView>

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
        onConfirm={setReminderDraft}
      />

      <ConfirmModal
        visible={deleteVisible}
        title={t('topics.delete_note_confirm_title')}
        message={t('topics.delete_note_confirm_body')}
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
  flex: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.lg,
  },
  footerSpacer: {
    flexGrow: 1,
    minHeight: 24,
  },
  saveButton: {
    height: 48,
    borderRadius: 12,
    backgroundColor: c.brand,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: c.button.disabledBg,
  },
  saveText: {
    fontFamily: 'Rubik-Medium',
    fontSize: 16,
    lineHeight: 24,
    color: c.button.primaryText,
  },
  saveTextDisabled: {
    color: c.button.disabledText,
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
