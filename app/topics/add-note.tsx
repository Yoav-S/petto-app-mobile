import React, { useEffect, useState } from 'react';
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
import { Spacing, type ThemeColors } from '@/constants/theme';
import { useColors, useThemedStyles } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';
import ScreenHeader from '@/components/ui/ScreenHeader';
import HealthNoteEditorCard from '@/components/health/HealthNoteEditorCard';
import { HealthFormScreen } from '@/components/health/HealthKeyboardFooter';
import ReminderPickerSheet from '@/components/health/ReminderPickerSheet';
import EditPhotoSheet from '@/components/health/EditPhotoSheet';
import { t } from '@/i18n';
import { useActivePet } from '@/store/petStore';
import { addNote, getRecord } from '@/services/health';
import {
  healthReminderTitle,
  upsertHealthReminder,
  type HealthReminderDraft,
} from '@/services/healthReminder';
import { uploadHealthNotePhoto } from '@/services/storage';
import { getErrorMessage } from '@/services/errors';
import { formatDisplayDate } from '@/utils/calendar';
import { normalizeRouteParam } from '@/utils/routeParams';

function reminderLabel(draft: HealthReminderDraft): string {
  return `${formatDisplayDate(draft.date)} ${draft.time}`;
}

export default function AddNoteScreen() {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const toast = useToast();
  const router = useRouter();
  const { recordId: recordIdParam } = useLocalSearchParams<{ recordId?: string }>();
  const recordId = normalizeRouteParam(recordIdParam);
  const { activePetId } = useActivePet();

  const [recordTitle, setRecordTitle] = useState('');
  const [loadingRecord, setLoadingRecord] = useState(true);
  const [note, setNote] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoMime, setPhotoMime] = useState<string | null>(null);
  const [reminderDraft, setReminderDraft] = useState<HealthReminderDraft | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [reminderSheetVisible, setReminderSheetVisible] = useState(false);
  const [photoSheetVisible, setPhotoSheetVisible] = useState(false);

  useEffect(() => {
    if (!recordId) {
      router.replace('/topics/add' as never);
      return;
    }
    if (!activePetId) {
      setLoadingRecord(false);
      return;
    }
    getRecord(activePetId, recordId)
      .then((record) => setRecordTitle(record.title))
      .catch(() => {})
      .finally(() => setLoadingRecord(false));
  }, [activePetId, recordId, router]);

  const canSave = note.trim().length > 0 && !submitting && !loadingRecord;

  const handlePickedPhoto = async (source: 'camera' | 'library') => {
    setReminderSheetVisible(false);
    const picked =
      source === 'camera' ? await pickImageFromCamera() : await pickImageFromLibrary();
    if (picked === 'denied') {
      Alert.alert(t('petOnboarding.photo_permission_title'), t('petOnboarding.photo_permission_body'));
      return;
    }
    if (picked?.uri) {
      setPhotoUri(picked.uri);
      setPhotoMime(picked.mimeType);
    }
  };

  const handleSave = async () => {
    Keyboard.dismiss();
    if (!canSave || !activePetId || !recordId) return;
    try {
      setSubmitting(true);

      let photoUrl: string | undefined;
      if (photoUri) {
        photoUrl = await uploadHealthNotePhoto(photoUri, photoMime);
      }

      let linkedReminderId: string | undefined;
      if (reminderDraft) {
        linkedReminderId = await upsertHealthReminder(
          activePetId,
          reminderDraft,
          healthReminderTitle(note, recordTitle),
        );
      }

      await addNote(activePetId, recordId, {
        text: note.trim(),
        photo_url: photoUrl,
        linked_reminder_id: linkedReminderId,
      });

      router.back();
    } catch (err) {
      toast.showError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const header = <ScreenHeader title={t('topics.add_note')} />;

  if (!recordId || loadingRecord) {
    return (
      <HeaderScrollLayout header={header} edges={['left', 'right']}>
        {({ paddingTop }) => (
          <View style={[styles.centered, { paddingTop }]}>
            <ActivityIndicator color={colors.primaryText} />
          </View>
        )}
      </HeaderScrollLayout>
    );
  }

  return (
    <HeaderScrollLayout header={header} edges={['left', 'right']}>
      {({ paddingTop }) => (
        <>
          <HealthFormScreen
            scrollInsetTop={paddingTop}
            contentContainerStyle={{
              paddingTop: Math.max(Spacing.md, 16),
            }}
            footer={{
              label: t('common.save'),
              disabled: !canSave,
              loading: submitting,
              onPress: handleSave,
              fullWidth: true,
            }}
          >
            <HealthNoteEditorCard
              noteText={note}
              onChangeNoteText={setNote}
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
                setPhotoUri(null);
                setPhotoMime(null);
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
        </>
      )}
    </HeaderScrollLayout>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
});
