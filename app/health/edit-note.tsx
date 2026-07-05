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
  Modal,
  Pressable,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing } from '@/constants/theme';
import ScreenHeader from '@/components/ui/ScreenHeader';
import EmptyState from '@/components/ui/EmptyState';
import { t } from '@/i18n';
import { useActivePet } from '@/store/petStore';
import { getRecord, updateNote, deleteNote } from '@/services/health';
import { listReminders } from '@/services/reminders';
import { uploadImage } from '@/services/storage';
import { getErrorMessage } from '@/services/errors';
import { formatDisplayDate } from '@/utils/calendar';
import type { Reminder } from '@/types/api';

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
  const [linkedReminderLabel, setLinkedReminderLabel] = useState('');

  const [reminderModalVisible, setReminderModalVisible] = useState(false);
  const [reminderOptions, setReminderOptions] = useState<Reminder[]>([]);
  const [loadingReminders, setLoadingReminders] = useState(false);

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
      setLinkedReminderLabel(
        note.linked_reminder_date
          ? `${formatDisplayDate(note.linked_reminder_date)} ${note.linked_reminder_time ?? ''}`.trim()
          : '',
      );
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
    if (!activePetId || !recordId || !noteId || !noteText.trim()) return;
    try {
      setSaving(true);
      let photoUrl: string | null | undefined;
      if (photoChanged) {
        photoUrl = photoUri ? await uploadImage(photoUri, 'notes') : null;
      }
      await updateNote(activePetId, recordId, noteId, {
        text: noteText.trim(),
        photo_url: photoUrl,
        linked_reminder_id: linkedReminderId,
      });
      router.back();
    } catch (err) {
      Alert.alert(t('common.error'), getErrorMessage(err));
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!activePetId || !recordId || !noteId) return;
    Alert.alert(t('health.delete_note_confirm_title'), t('health.delete_note_confirm_body'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteNote(activePetId, recordId, noteId);
            router.replace({ pathname: '/health', params: { deletedNote: 'true' } } as never);
          } catch (err) {
            Alert.alert(t('common.error'), getErrorMessage(err));
          }
        },
      },
    ]);
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

            {linkedReminderId ? (
              <TouchableOpacity
                style={styles.reminderRow}
                activeOpacity={0.8}
                onPress={() => {
                  setLinkedReminderId(null);
                  setLinkedReminderLabel('');
                }}
              >
                <Text style={styles.reminderLabel}>{t('health.reminder_label')}</Text>
                <Text style={styles.reminderValue}> {linkedReminderLabel}</Text>
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

          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete} activeOpacity={0.7}>
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
                      setLinkedReminderId(reminder.id);
                      setLinkedReminderLabel(`${formatDisplayDate(reminder.date)} ${reminder.time}`);
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
