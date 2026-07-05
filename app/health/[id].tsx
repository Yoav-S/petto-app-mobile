import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing } from '@/constants/theme';
import ScreenHeader from '@/components/ui/ScreenHeader';
import EmptyState from '@/components/ui/EmptyState';
import { t } from '@/i18n';
import { useActivePet } from '@/store/petStore';
import { getRecord, resolveRecord } from '@/services/health';
import { getErrorMessage } from '@/services/errors';
import { formatDisplayDate } from '@/utils/calendar';
import type { MedicalRecordDetail } from '@/types/api';

export default function HealthDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { activePetId } = useActivePet();

  const [record, setRecord] = useState<MedicalRecordDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!activePetId || !id) {
      setError(t('health.not_found_subtitle'));
      setLoading(false);
      return;
    }
    try {
      setError(null);
      const detail = await getRecord(activePetId, id);
      setRecord(detail);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [activePetId, id]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchData();
    }, [fetchData]),
  );

  const handleResolve = () => {
    if (!activePetId || !id) return;
    Alert.alert(t('health.resolve_confirm_title'), t('health.resolve_confirm_body'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('health.mark_resolved'),
        onPress: async () => {
          try {
            await resolveRecord(activePetId, id);
            router.back();
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
        <ScreenHeader title={t('health.title')} />
        <View style={styles.centered}>
          <ActivityIndicator color={Colors.primaryText} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !record) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScreenHeader title={t('health.title')} />
        <View style={styles.centered}>
          <EmptyState
            title={t('health.not_found_title')}
            subtitle={error ?? t('health.not_found_subtitle')}
            actionTitle={t('reminders.back')}
            onAction={() => router.back()}
          />
        </View>
      </SafeAreaView>
    );
  }

  const isActive = record.status === 'active';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader title={record.title} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {record.notes.length === 0 ? (
          <Text style={styles.emptyNotes}>{t('health.no_notes_yet')}</Text>
        ) : (
          record.notes.map((note) => (
            <TouchableOpacity
              key={note.id}
              style={styles.noteCard}
              activeOpacity={0.7}
              onPress={() =>
                router.push({
                  pathname: '/health/edit-note',
                  params: { recordId: record.id, noteId: note.id },
                } as never)
              }
            >
              {note.photo_url ? (
                <Image source={{ uri: note.photo_url }} style={styles.noteImage} contentFit="cover" />
              ) : null}
              <Text style={styles.noteText}>{note.text}</Text>
              {note.linked_reminder_time ? (
                <View style={styles.reminderRow}>
                  <Ionicons name="notifications-outline" size={16} color={Colors.secondaryText} />
                  <Text style={styles.reminderText}>
                    {[formatDisplayDate(note.linked_reminder_date), note.linked_reminder_time]
                      .filter(Boolean)
                      .join(' • ')}
                  </Text>
                </View>
              ) : null}
              <Text style={styles.noteDate}>{formatDisplayDate(note.created_at)}</Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <View style={styles.footer}>
        {isActive ? (
          <TouchableOpacity style={styles.resolveButton} onPress={handleResolve} activeOpacity={0.7}>
            <Text style={styles.resolveText}>{t('health.mark_resolved')}</Text>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity
          style={styles.addButton}
          activeOpacity={0.85}
          onPress={() =>
            router.push({ pathname: '/health/add-note', params: { recordId: record.id } } as never)
          }
        >
          <Text style={styles.addText}>{t('health.add_note')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centered: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  emptyNotes: {
    fontFamily: 'Rubik-Regular',
    fontSize: 15,
    color: Colors.secondaryText,
    textAlign: 'center',
    marginTop: Spacing.xl,
  },
  noteCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  noteImage: {
    width: '100%',
    height: 180,
    borderRadius: Radius.md,
    marginBottom: Spacing.md,
  },
  noteText: {
    fontFamily: 'Rubik-Regular',
    fontSize: 16,
    color: Colors.primaryText,
    lineHeight: 22,
  },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: Spacing.sm,
  },
  reminderText: {
    fontFamily: 'Rubik-Regular',
    fontSize: 14,
    color: Colors.secondaryText,
  },
  noteDate: {
    fontFamily: 'Rubik-Regular',
    fontSize: 12,
    color: Colors.secondaryText,
    marginTop: Spacing.sm,
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  resolveButton: {
    borderRadius: Radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  resolveText: {
    fontFamily: 'Rubik-Medium',
    fontSize: 16,
    color: Colors.primaryText,
  },
  addButton: {
    backgroundColor: Colors.primaryText,
    borderRadius: Radius.md,
    paddingVertical: 16,
    alignItems: 'center',
  },
  addText: {
    fontFamily: 'Rubik-Medium',
    fontSize: 16,
    color: Colors.surface,
  },
});
