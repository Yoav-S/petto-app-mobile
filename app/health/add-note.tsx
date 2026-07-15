import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, Spacing } from '@/constants/theme';
import ScreenHeader from '@/components/ui/ScreenHeader';
import HealthNoteEditorCard from '@/components/health/HealthNoteEditorCard';
import HealthKeyboardFooter from '@/components/health/HealthKeyboardFooter';
import ReminderPickerSheet from '@/components/health/ReminderPickerSheet';
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

const DESIGN_HEIGHT = 812;

function reminderLabel(draft: HealthReminderDraft): string {
  return `${formatDisplayDate(draft.date)} ${draft.time}`;
}

export default function AddNoteScreen() {
  const router = useRouter();
  const { recordId: recordIdParam } = useLocalSearchParams<{ recordId?: string }>();
  const recordId = normalizeRouteParam(recordIdParam);
  const { activePetId } = useActivePet();
  const { height } = useWindowDimensions();
  const sy = height / DESIGN_HEIGHT;

  const [recordTitle, setRecordTitle] = useState('');
  const [loadingRecord, setLoadingRecord] = useState(true);
  const [note, setNote] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [reminderDraft, setReminderDraft] = useState<HealthReminderDraft | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [reminderSheetVisible, setReminderSheetVisible] = useState(false);

  useEffect(() => {
    if (!recordId) {
      router.replace('/health/add' as never);
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
    if (!canSave || !activePetId || !recordId) return;
    try {
      setSubmitting(true);

      let photoUrl: string | undefined;
      if (photoUri) {
        photoUrl = await uploadHealthNotePhoto(photoUri);
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
      Alert.alert(t('common.error'), getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (!recordId || loadingRecord) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScreenHeader title={t('health.add_note')} />
        <View style={styles.centered}>
          <ActivityIndicator color={Colors.primaryText} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader title={t('health.add_note')} />

      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingTop: Math.max(Spacing.md, 16 * sy) }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <HealthNoteEditorCard
            key={photoUri ?? 'no-photo'}
            noteText={note}
            onChangeNoteText={setNote}
            photoUri={photoUri}
            onPickImage={pickImage}
            reminderValue={reminderDraft ? reminderLabel(reminderDraft) : null}
            onReminderPress={() => setReminderSheetVisible(true)}
            onRemoveReminder={() => setReminderDraft(null)}
            placeholder={t('health.note_body_placeholder')}
          />
        </ScrollView>

        <HealthKeyboardFooter
          label={t('pickers.done')}
          disabled={!canSave}
          loading={submitting}
          onPress={handleSave}
          fullWidth={false}
        />
      </View>

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
    justifyContent: 'space-between',
  },
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
