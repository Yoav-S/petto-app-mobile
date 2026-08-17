import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
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
import HeaderIconButton, { HEADER_ICON_BTN } from '@/components/ui/HeaderIconButton';
import EmptyState from '@/components/ui/EmptyState';
import ConfirmModal from '@/components/ui/ConfirmModal';
import TopicActionsSheet from '@/components/topics/TopicActionsSheet';
import { t } from '@/i18n';
import { useActivePet } from '@/store/petStore';
import { getRecord, resolveRecord } from '@/services/health';
import { getErrorMessage } from '@/services/errors';
import HealthReminderLine from '@/components/health/HealthReminderLine';
import HealthNoteIconRow from '@/components/health/HealthNoteIconRow';
import { normalizeRouteParam } from '@/utils/routeParams';
import type { MedicalRecordDetail } from '@/types/api';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';

const DESIGN_FOOTER_PAD_TOP = 12;
const DESIGN_FOOTER_PAD_H = 20;
const DESIGN_FOOTER_RADIUS = 24;
const DESIGN_SAVE_BUTTON_WIDTH = 335;
const DESIGN_SAVE_BUTTON_HEIGHT = 48;
const DESIGN_FOOTER_MIN_BOTTOM = 10;
const DESIGN_FOOTER_SAFE_GAP = 8;

export default function HealthDetailsScreen() {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const toast = useToast();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const recordId = normalizeRouteParam(id);
  const { activePetId } = useActivePet();
  const insets = useSafeAreaInsets();
  const { contentWidth } = useResponsiveLayout();

  const footerLayout = useMemo(
    () => ({
      padH: DESIGN_FOOTER_PAD_H,
      padTop: DESIGN_FOOTER_PAD_TOP,
      padBottom:
        Math.max(insets.bottom, DESIGN_FOOTER_MIN_BOTTOM) + DESIGN_FOOTER_SAFE_GAP,
      buttonWidth: Math.min(contentWidth, DESIGN_SAVE_BUTTON_WIDTH),
      buttonHeight: DESIGN_SAVE_BUTTON_HEIGHT,
      buttonRadius: 12,
      footerRadius: DESIGN_FOOTER_RADIUS,
      scrollPadBottom:
        DESIGN_FOOTER_PAD_TOP + DESIGN_SAVE_BUTTON_HEIGHT +
        Math.max(insets.bottom, DESIGN_FOOTER_MIN_BOTTOM) +
        DESIGN_FOOTER_SAFE_GAP +
        16,
    }),
    [contentWidth, insets.bottom],
  );

  const [record, setRecord] = useState<MedicalRecordDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [failedPhotoIds, setFailedPhotoIds] = useState<Record<string, true>>({});
  const [menuVisible, setMenuVisible] = useState(false);
  const [resolveVisible, setResolveVisible] = useState(false);
  const [resolving, setResolving] = useState(false);
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

  const handleResolve = useCallback(async () => {
    if (!activePetId || !recordId || resolving) return;
    setResolving(true);
    try {
      await resolveRecord(activePetId, recordId);
      setResolveVisible(false);
      router.back();
    } catch (err) {
      toast.showError(getErrorMessage(err));
      setResolving(false);
    }
  }, [activePetId, recordId, resolving, router, toast]);

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
    <HeaderIconButton
      onPress={() => setMenuVisible(true)}
      accessibilityLabel={t('topics.mark_resolved')}
    >
      <Ionicons name="ellipsis-vertical" size={HEADER_ICON_BTN.iconSize} color={colors.primaryText} />
    </HeaderIconButton>
  ) : undefined;

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
      <ScreenHeader title={record.title} right={menuButton} />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: footerLayout.scrollPadBottom },
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
            paddingTop: footerLayout.padTop,
            paddingHorizontal: footerLayout.padH,
            paddingBottom: footerLayout.padBottom,
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

      <TopicActionsSheet
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        onMarkResolved={() => setResolveVisible(true)}
      />

      <ConfirmModal
        visible={resolveVisible}
        title={t('topics.resolve_confirm_title')}
        message={t('topics.resolve_confirm_body')}
        confirmText={t('topics.mark_resolved')}
        cancelText={t('common.cancel')}
        variant="primary"
        onCancel={() => {
          if (!resolving) setResolveVisible(false);
        }}
        onConfirm={() => {
          void handleResolve();
        }}
      />
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
    alignItems: 'center',
    justifyContent: 'center',
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
  footer: {
    width: '100%',
    backgroundColor: c.panel,
    alignItems: 'center',
    justifyContent: 'flex-start',
    shadowColor: '#1E1E1E',
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 6,
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
