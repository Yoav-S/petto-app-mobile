import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ActionSheetIOS,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Radius, Spacing, type ThemeColors } from '@/constants/theme';
import { useColors, useThemedStyles } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';
import ScreenHeader from '@/components/ui/ScreenHeader';
import EmptyState from '@/components/ui/EmptyState';
import { t } from '@/i18n';
import { useActivePet } from '@/store/petStore';
import { getRecord, resolveRecord } from '@/services/health';
import { getErrorMessage } from '@/services/errors';
import HealthReminderLine from '@/components/health/HealthReminderLine';
import HealthNoteIconRow from '@/components/health/HealthNoteIconRow';
import { normalizeRouteParam } from '@/utils/routeParams';
import { useHeaderLayout } from '@/utils/headerLayout';
import type { MedicalRecordDetail } from '@/types/api';

const DESIGN_WIDTH = 375;
const DESIGN_HEIGHT = 812;
const DESIGN_FOOTER_BAR_HEIGHT = 104;
const DESIGN_FOOTER_SAFE_EXTRA = 50;

export default function HealthDetailsScreen() {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const toast = useToast();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const recordId = normalizeRouteParam(id);
  const { activePetId } = useActivePet();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const headerLayout = useHeaderLayout();
  const sx = width / DESIGN_WIDTH;
  const sy = height / DESIGN_HEIGHT;

  const footerLayout = useMemo(
    () => ({
      padH: 20 * sx,
      padTop: 12 * sy,
      padBottomClosed: (DESIGN_FOOTER_BAR_HEIGHT + DESIGN_FOOTER_SAFE_EXTRA - 12 - 48) * sy,
      heightClosed: (DESIGN_FOOTER_BAR_HEIGHT + DESIGN_FOOTER_SAFE_EXTRA) * sy,
      buttonWidth: 335 * sx,
      buttonHeight: 48 * sx,
      buttonRadius: 12 * sx,
      footerRadius: 24 * sx,
      menuSize: 40 * headerLayout.sx,
      menuRadius: 12 * headerLayout.sx,
    }),
    [sx, sy, headerLayout.sx],
  );

  const [record, setRecord] = useState<MedicalRecordDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [failedPhotoIds, setFailedPhotoIds] = useState<Record<string, true>>({});
  const recordRef = useRef<MedicalRecordDetail | null>(null);
  recordRef.current = record;

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      (async () => {
        if (!activePetId || !recordId) {
          if (!cancelled) {
            setError(t('topics.not_found_subtitle'));
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

  const confirmResolve = useCallback(() => {
    if (!activePetId || !recordId) return;
    Alert.alert(t('topics.resolve_confirm_title'), t('topics.resolve_confirm_body'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('topics.mark_resolved'),
        onPress: async () => {
          try {
            await resolveRecord(activePetId, recordId);
            router.back();
          } catch (err) {
            toast.showError(getErrorMessage(err));
          }
        },
      },
    ]);
  }, [activePetId, recordId, router, toast]);

  const openOverflowMenu = useCallback(() => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [t('common.cancel'), t('topics.mark_resolved')],
          cancelButtonIndex: 0,
        },
        (index) => {
          if (index === 1) confirmResolve();
        },
      );
      return;
    }

    Alert.alert(recordRef.current?.title ?? t('topics.title'), undefined, [
      { text: t('topics.mark_resolved'), onPress: confirmResolve },
      { text: t('common.cancel'), style: 'cancel' },
    ]);
  }, [confirmResolve]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
        <ScreenHeader title={t('topics.title')} />
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primaryText} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !record) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
        <ScreenHeader title={t('topics.title')} />
        <View style={styles.centered}>
          <EmptyState
            title={t('topics.not_found_title')}
            subtitle={error ?? t('topics.not_found_subtitle')}
            actionTitle={t('reminders.back')}
            onAction={() => router.back()}
          />
        </View>
      </SafeAreaView>
    );
  }

  const isActive = record.status === 'active';
  const menuButton = isActive ? (
    <TouchableOpacity
      style={[
        styles.menuButton,
        {
          width: footerLayout.menuSize,
          height: footerLayout.menuSize,
          borderRadius: footerLayout.menuRadius,
        },
      ]}
      onPress={openOverflowMenu}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      accessibilityRole="button"
      accessibilityLabel={t('topics.mark_resolved')}
    >
      <Ionicons name="ellipsis-vertical" size={20} color={colors.primaryText} />
    </TouchableOpacity>
  ) : undefined;

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
      <ScreenHeader title={record.title} right={menuButton} />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: footerLayout.heightClosed + 16 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {(record.notes ?? []).length === 0 ? (
          <Text style={styles.emptyNotes}>{t('topics.no_notes_yet')}</Text>
        ) : (
          (record.notes ?? []).map((note) => (
            <View key={note.id} style={styles.noteCard}>
              {note.photo_url && !failedPhotoIds[note.id] ? (
                <View style={styles.noteImageWrap}>
                  <Image
                    source={{ uri: note.photo_url }}
                    style={styles.noteImage}
                    contentFit="cover"
                    cachePolicy="memory-disk"
                    recyclingKey={note.id}
                    onError={() =>
                      setFailedPhotoIds((prev) => ({ ...prev, [note.id]: true }))
                    }
                  />
                </View>
              ) : null}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() =>
                  router.push({
                    pathname: '/topics/edit-note',
                    params: { recordId: record.id, noteId: note.id },
                  } as never)
                }
              >
                <Text style={styles.noteText}>{note.text}</Text>
              </TouchableOpacity>
              {note.linked_reminder_date || note.linked_reminder_time ? (
                <View style={styles.reminderRow}>
                  <HealthReminderLine
                    date={note.linked_reminder_date}
                    time={note.linked_reminder_time}
                  />
                </View>
              ) : null}
              <HealthNoteIconRow
                onPhotoPress={() =>
                  router.push({
                    pathname: '/topics/edit-note',
                    params: { recordId: record.id, noteId: note.id, open: 'photo' },
                  } as never)
                }
                onReminderPress={() =>
                  router.push({
                    pathname: '/topics/edit-note',
                    params: { recordId: record.id, noteId: note.id, open: 'reminder' },
                  } as never)
                }
              />
            </View>
          ))
        )}
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            height: footerLayout.heightClosed,
            paddingTop: footerLayout.padTop,
            paddingHorizontal: footerLayout.padH,
            paddingBottom: Math.max(footerLayout.padBottomClosed, insets.bottom),
            borderTopLeftRadius: footerLayout.footerRadius,
            borderTopRightRadius: footerLayout.footerRadius,
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.addButton,
            {
              width: footerLayout.buttonWidth,
              height: footerLayout.buttonHeight,
              borderRadius: footerLayout.buttonRadius,
            },
          ]}
          activeOpacity={0.85}
          onPress={() =>
            router.push({ pathname: '/topics/add-note', params: { recordId: record.id } } as never)
          }
        >
          <Text style={styles.addText}>{t('topics.add_note')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: c.background,
  },
  centered: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  emptyNotes: {
    fontFamily: 'Rubik-Regular',
    fontSize: 15,
    color: c.secondaryText,
    textAlign: 'center',
    marginTop: Spacing.xl,
  },
  noteCard: {
    backgroundColor: c.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  noteImageWrap: {
    width: '100%',
    height: 180,
    borderRadius: Radius.md,
    marginBottom: Spacing.md,
    overflow: 'hidden',
    backgroundColor: c.background,
  },
  noteImage: {
    width: '100%',
    height: '100%',
  },
  noteText: {
    fontFamily: 'Rubik-Regular',
    fontSize: 16,
    color: c.primaryText,
    lineHeight: 22,
  },
  reminderRow: {
    marginTop: Spacing.sm,
  },
  menuButton: {
    backgroundColor: c.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  footer: {
    width: '100%',
    backgroundColor: c.surface,
    alignItems: 'center',
    justifyContent: 'flex-start',
    shadowColor: '#2D2D2A',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 8,
  },
  addButton: {
    backgroundColor: c.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addText: {
    fontFamily: 'Rubik-Medium',
    fontSize: 16,
    lineHeight: 24,
    color: c.surface,
    textAlign: 'center',
  },
});
