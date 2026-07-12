import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
import { normalizeRouteParam } from '@/utils/routeParams';
import type { MedicalRecordDetail } from '@/types/api';

const DESIGN_WIDTH = 375;
const DESIGN_HEIGHT = 812;

export default function HealthDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const recordId = normalizeRouteParam(id);
  const { activePetId } = useActivePet();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const sx = width / DESIGN_WIDTH;
  const sy = height / DESIGN_HEIGHT;

  const footerLayout = useMemo(
    () => ({
      padH: 20 * sx,
      padBottom: Math.max(insets.bottom, 10 * sy),
      gap: 8 * sx,
      rowHeight: 48 * sy,
      addWidth: 220 * sx,
      resolveWidth: 107 * sx,
      buttonHeight: 48 * sy,
      buttonRadius: 12 * sx,
      buttonPadV: 12 * sy,
      buttonPadH: 16 * sx,
    }),
    [sx, sy, insets.bottom],
  );

  const [record, setRecord] = useState<MedicalRecordDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const recordRef = useRef<MedicalRecordDetail | null>(null);
  recordRef.current = record;

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      (async () => {
        if (!activePetId || !recordId) {
          if (!cancelled) {
            setError(t('health.not_found_subtitle'));
            setLoading(false);
          }
          return;
        }

        const showFullLoader = recordRef.current == null;
        if (showFullLoader && !cancelled) setLoading(true);

        try {
          if (!cancelled) setError(null);
          const detail = await getRecord(activePetId, recordId);
          if (!cancelled) setRecord(detail);
        } catch (err) {
          if (!cancelled) setError(getErrorMessage(err));
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();

      return () => {
        cancelled = true;
      };
    }, [activePetId, recordId]),
  );

  const handleResolve = () => {
    if (!activePetId || !recordId) return;
    Alert.alert(t('health.resolve_confirm_title'), t('health.resolve_confirm_body'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('health.mark_resolved'),
        onPress: async () => {
          try {
            await resolveRecord(activePetId, recordId);
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
        {(record.notes ?? []).length === 0 ? (
          <Text style={styles.emptyNotes}>{t('health.no_notes_yet')}</Text>
        ) : (
          (record.notes ?? []).map((note) => (
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

      <View
        style={[
          styles.footer,
          {
            paddingHorizontal: footerLayout.padH,
            paddingBottom: footerLayout.padBottom,
            gap: footerLayout.gap,
            minHeight: footerLayout.rowHeight,
            justifyContent: isActive ? 'flex-start' : 'flex-end',
          },
        ]}
      >
        {isActive ? (
          <TouchableOpacity
            style={[
              styles.resolveButton,
              {
                width: footerLayout.resolveWidth,
                height: footerLayout.buttonHeight,
                borderRadius: footerLayout.buttonRadius,
                paddingVertical: footerLayout.buttonPadV,
                paddingHorizontal: footerLayout.buttonPadH,
              },
            ]}
            onPress={handleResolve}
            activeOpacity={0.7}
          >
            <Text style={styles.resolveText} numberOfLines={1}>
              {t('health.mark_resolved')}
            </Text>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity
          style={[
            styles.addButton,
            {
              width: footerLayout.addWidth,
              height: footerLayout.buttonHeight,
              borderRadius: footerLayout.buttonRadius,
              paddingVertical: footerLayout.buttonPadV,
              paddingHorizontal: footerLayout.buttonPadH,
            },
          ]}
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
    paddingBottom: 80,
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Spacing.sm,
    width: '100%',
  },
  resolveButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  resolveText: {
    fontFamily: 'Rubik-Medium',
    fontSize: 14,
    lineHeight: 18,
    color: Colors.primaryText,
    textAlign: 'center',
  },
  addButton: {
    backgroundColor: Colors.primaryText,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addText: {
    fontFamily: 'Rubik-Medium',
    fontSize: 14,
    lineHeight: 18,
    color: Colors.surface,
    textAlign: 'center',
  },
});
