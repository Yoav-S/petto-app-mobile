import React, { useCallback, useState } from 'react';
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
  Modal,
  Pressable,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing } from '@/constants/theme';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { t } from '@/i18n';
import { useActivePet } from '@/store/petStore';
import { addNote, createRecord } from '@/services/health';
import { listReminders } from '@/services/reminders';
import { uploadImage } from '@/services/storage';
import { getErrorMessage } from '@/services/errors';
import { formatDisplayDate } from '@/utils/calendar';
import type { Reminder } from '@/types/api';

export default function AddNoteScreen() {
  const router = useRouter();
  const { recordId } = useLocalSearchParams<{ recordId?: string }>();
  const { activePetId } = useActivePet();

  const [conditionTitle, setConditionTitle] = useState('');
  const [note, setNote] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [linkedReminder, setLinkedReminder] = useState<Reminder | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [reminderModalVisible, setReminderModalVisible] = useState(false);
  const [reminderOptions, setReminderOptions] = useState<Reminder[]>([]);
  const [loadingReminders, setLoadingReminders] = useState(false);

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

  const openReminderModal = useCallback(async () => {
    if (!activePetId) return;
    setReminderModalVisible(true);
    setLoadingReminders(true);
    try {
      const [today, upcoming] = await Promise.all([
        listReminders(activePetId, 'today'),
        listReminders(activePetId, 'upcoming'),
      ]);
      setReminderOptions([...today, ...upcoming]);
    } catch {
      setReminderOptions([]);
    } finally {
      setLoadingReminders(false);
    }
  }, [activePetId]);

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

      await addNote(activePetId, targetRecordId, {
        text: note.trim(),
        photo_url: photoUrl,
        linked_reminder_id: linkedReminder?.id ?? undefined,
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

            {linkedReminder ? (
              <TouchableOpacity
                style={styles.reminderRow}
                activeOpacity={0.8}
                onPress={() => setLinkedReminder(null)}
              >
                <Text style={styles.reminderLabel}>{t('health.reminder_label')}</Text>
                <Text style={styles.reminderValue}>
                  {' '}
                  {linkedReminder.title} • {formatDisplayDate(linkedReminder.date)} {linkedReminder.time}
                </Text>
                <Ionicons name="close-circle" size={16} color={Colors.secondaryText} style={styles.reminderRemove} />
              </TouchableOpacity>
            ) : null}

            <View style={styles.iconRow}>
              <TouchableOpacity style={styles.iconButton} onPress={pickImage}>
                <Ionicons name="image-outline" size={24} color={Colors.secondaryText} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton} onPress={openReminderModal}>
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

      <Modal visible={reminderModalVisible} transparent animationType="slide" onRequestClose={() => setReminderModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setReminderModalVisible(false)} />
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>{t('health.link_reminder')}</Text>
            {loadingReminders ? (
              <ActivityIndicator color={Colors.primaryText} style={{ marginVertical: Spacing.lg }} />
            ) : reminderOptions.length === 0 ? (
              <Text style={styles.modalEmpty}>{t('health.no_reminders')}</Text>
            ) : (
              <ScrollView style={styles.modalList}>
                {reminderOptions.map((reminder) => (
                  <TouchableOpacity
                    key={reminder.id}
                    style={styles.modalRow}
                    onPress={() => {
                      setLinkedReminder(reminder);
                      setReminderModalVisible(false);
                    }}
                  >
                    <Text style={styles.modalRowTitle}>{reminder.title}</Text>
                    <Text style={styles.modalRowMeta}>
                      {formatDisplayDate(reminder.date)} {reminder.time}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
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
  reminderRemove: {
    marginLeft: Spacing.xs,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: Spacing.lg,
    maxHeight: '70%',
  },
  modalTitle: {
    fontFamily: 'Rubik-Medium',
    fontSize: 18,
    color: Colors.primaryText,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  modalEmpty: {
    fontFamily: 'Rubik-Regular',
    fontSize: 15,
    color: Colors.secondaryText,
    textAlign: 'center',
    marginVertical: Spacing.lg,
  },
  modalList: {
    marginBottom: Spacing.md,
  },
  modalRow: {
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalRowTitle: {
    fontFamily: 'Rubik-Medium',
    fontSize: 16,
    color: Colors.primaryText,
  },
  modalRowMeta: {
    fontFamily: 'Rubik-Regular',
    fontSize: 13,
    color: Colors.secondaryText,
    marginTop: 2,
  },
});
