import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HeaderScrollLayout from '@/components/ui/HeaderScrollLayout';
import { useFocusEffect } from '@react-navigation/native';
import { Spacing, type ThemeColors } from '@/constants/theme';
import { useColors, useThemedStyles } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';
import ScreenHeader from '@/components/ui/ScreenHeader';
import HeaderIconButton, { HEADER_ICON_BTN } from '@/components/ui/HeaderIconButton';
import EmptyState from '@/components/ui/EmptyState';
import ConfirmModal from '@/components/ui/ConfirmModal';
import ListLoadMoreFooter from '@/components/ui/ListLoadMoreFooter';
import ListFetchBlocker from '@/components/ui/ListFetchBlocker';
import TopicActionsSheet from '@/components/topics/TopicActionsSheet';
import { LIST_PAGE_SIZE, LIST_SCROLL_END_GAP } from '@/constants/pagination';
import { PRIMARY_BUTTON } from '@/constants/buttons';
import { PAGE_HORIZONTAL_PADDING } from '@/constants/layout';
import { t } from '@/i18n';
import { useActivePet } from '@/store/petStore';
import {
  getRecord,
  listRecordNotes,
  resolveRecord,
  reopenRecord,
  deleteRecord,
} from '@/services/health';
import { getErrorMessage } from '@/services/errors';
import HealthReminderLine from '@/components/health/HealthReminderLine';
import { normalizeRouteParam } from '@/utils/routeParams';
import {
  formatNoteSectionDateLabel,
  getNoteLocalDateKey,
  truncatePreviewText,
} from '@/utils/calendar';
import type { MedicalRecordDetail, HealthNote } from '@/types/api';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';

const DESIGN_FOOTER_PAD_TOP = 12;
const DESIGN_FOOTER_PAD_H = 20;
const DESIGN_FOOTER_RADIUS = 24;
const DESIGN_SAVE_BUTTON_HEIGHT = 48;
const DESIGN_RESOLVED_TEXT_HEIGHT = 20;
const DESIGN_FOOTER_MIN_BOTTOM = 10;
const DESIGN_FOOTER_SAFE_GAP = 8;
const NOTE_PREVIEW_CHARS = 25;

/** Figma note card: 335×auto, r12, 14/16/20/16 padding, 12px inner gap, 160px image. */
const NOTE_CARD = {
  radius: 12,
  padTop: 14,
  padH: 16,
  padBottom: 20,
  innerGap: 12,
  imageHeight: 160,
  imageRadius: 12,
} as const;

type NoteListItem =
  | { type: 'header'; key: string; label: string; isFirst: boolean }
  | { type: 'note'; note: HealthNote };

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
    () => {
      const padBottom =
        Math.max(insets.bottom, DESIGN_FOOTER_MIN_BOTTOM) + DESIGN_FOOTER_SAFE_GAP;
      return {
        padH: DESIGN_FOOTER_PAD_H,
        padTop: DESIGN_FOOTER_PAD_TOP,
        padBottom,
        buttonWidth: contentWidth,
        buttonHeight: DESIGN_SAVE_BUTTON_HEIGHT,
        buttonRadius: 12,
        footerRadius: DESIGN_FOOTER_RADIUS,
        resolvedTextHeight: DESIGN_RESOLVED_TEXT_HEIGHT,
      };
    },
    [contentWidth, insets.bottom],
  );

  const [record, setRecord] = useState<MedicalRecordDetail | null>(null);
  const [notes, setNotes] = useState<HealthNote[]>([]);
  const [notesHasMore, setNotesHasMore] = useState(false);
  const [notesLoadingMore, setNotesLoadingMore] = useState(false);
  const notesCursorRef = useRef<string | null>(null);
  const notesRef = useRef<HealthNote[]>([]);
  const notesLoadingMoreRef = useRef(false);
  const notesGenRef = useRef(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [failedPhotoIds, setFailedPhotoIds] = useState<Record<string, true>>({});
  const [menuVisible, setMenuVisible] = useState(false);
  const [resolveVisible, setResolveVisible] = useState(false);
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [reopening, setReopening] = useState(false);
  const recordRef = useRef<MedicalRecordDetail | null>(null);
  recordRef.current = record;

  const applyNotesPage = useCallback((page: HealthNote[], append: boolean) => {
    const prev = append ? notesRef.current : [];
    const seen = new Set(prev.map((note) => note.id));
    const extra = append ? page.filter((note) => !seen.has(note.id)) : page;
    if (append && extra.length === 0) {
      setNotesHasMore(false);
      return;
    }
    const next = append ? [...prev, ...extra] : extra;
    notesRef.current = next;
    setNotes(next);
    notesCursorRef.current = next.length > 0 ? next[next.length - 1].id : null;
    setNotesHasMore(page.length === LIST_PAGE_SIZE);
  }, []);

  const loadMoreNotes = useCallback(async () => {
    if (!activePetId || !recordId || notesLoadingMoreRef.current || !notesHasMore) return;
    if (!notesCursorRef.current) return;
    const gen = notesGenRef.current;
    notesLoadingMoreRef.current = true;
    setNotesLoadingMore(true);
    try {
      const page = await listRecordNotes(activePetId, recordId, {
        limit: LIST_PAGE_SIZE,
        cursor: notesCursorRef.current,
      });
      if (gen !== notesGenRef.current) return;
      applyNotesPage(page, true);
    } catch (err) {
      if (gen !== notesGenRef.current) return;
      toast.showError(getErrorMessage(err));
    } finally {
      if (gen !== notesGenRef.current) return;
      notesLoadingMoreRef.current = false;
      setNotesLoadingMore(false);
    }
  }, [activePetId, applyNotesPage, notesHasMore, recordId, toast]);

  useFocusEffect(
    useCallback(() => {
      const gen = ++notesGenRef.current;
      notesLoadingMoreRef.current = false;
      setNotesLoadingMore(false);

      (async () => {
        if (!activePetId || !recordId) {
          if (gen === notesGenRef.current) {
            setError(t('topics.not_found_subtitle'));
            setLoading(false);
          }
          return;
        }

        const showFullLoader = recordRef.current == null;
        if (showFullLoader && gen === notesGenRef.current) setLoading(true);

        try {
          if (gen === notesGenRef.current) setError(null);
          const detail = await getRecord(activePetId, recordId, {
            notes_limit: LIST_PAGE_SIZE,
          });
          if (gen !== notesGenRef.current) return;
          setRecord(detail);
          applyNotesPage(detail.notes ?? [], false);
        } catch (err) {
          if (gen !== notesGenRef.current) return;
          setError(getErrorMessage(err));
        } finally {
          if (gen !== notesGenRef.current) return;
          setLoading(false);
        }
      })();

      return () => {
        notesGenRef.current += 1;
        notesLoadingMoreRef.current = false;
      };
    }, [activePetId, applyNotesPage, recordId]),
  );

  const handleResolve = useCallback(async () => {
    if (!activePetId || !recordId || resolving) return;
    setResolving(true);
    try {
      await resolveRecord(activePetId, recordId);
      const detail = await getRecord(activePetId, recordId, { notes_limit: LIST_PAGE_SIZE });
      setRecord(detail);
      applyNotesPage(detail.notes ?? [], false);
      setResolveVisible(false);
    } catch (err) {
      toast.showError(getErrorMessage(err));
    } finally {
      setResolving(false);
    }
  }, [activePetId, applyNotesPage, recordId, resolving, toast]);

  const handleReopen = useCallback(async () => {
    if (!activePetId || !recordId || reopening) return;
    setReopening(true);
    try {
      await reopenRecord(activePetId, recordId);
      const detail = await getRecord(activePetId, recordId, { notes_limit: LIST_PAGE_SIZE });
      setRecord(detail);
      applyNotesPage(detail.notes ?? [], false);
    } catch (err) {
      toast.showError(getErrorMessage(err));
    } finally {
      setReopening(false);
    }
  }, [activePetId, applyNotesPage, recordId, reopening, toast]);

  const handleDeleteRecord = useCallback(() => {
    if (!activePetId || !recordId) return;
    setDeleteVisible(false);
    toast.showUndo({
      message: t('topics.record_deleted'),
      onUndo: () => {},
      onCommit: async () => {
        try {
          await deleteRecord(activePetId, recordId);
          router.replace('/topics' as never);
        } catch (err) {
          toast.showError(getErrorMessage(err));
        }
      },
    });
  }, [activePetId, recordId, router, toast]);

  const openNote = useCallback(
    (noteId: string, open?: 'photo' | 'reminder' | 'focus') => {
      router.push({
        pathname: '/topics/edit-note',
        params: {
          recordId: recordId!,
          noteId,
          ...(open ? { open } : {}),
        },
      } as never);
    },
    [recordId, router],
  );

  const noteListItems = useMemo((): NoteListItem[] => {
    const items: NoteListItem[] = [];
    let lastDateKey = '';

    for (const note of notes) {
      const dateKey = getNoteLocalDateKey(note.created_at);
      if (dateKey && dateKey !== lastDateKey) {
        items.push({
          type: 'header',
          key: `header-${dateKey}`,
          label: formatNoteSectionDateLabel(note.created_at, {
            today: t('common.today'),
            yesterday: t('common.yesterday'),
          }),
          isFirst: items.length === 0,
        });
        lastDateKey = dateKey;
      }
      items.push({ type: 'note', note });
    }

    return items;
  }, [notes]);

  const listBlocked = notesLoadingMore || resolving || reopening;

  const renderNoteItem = useCallback(
    ({ item }: { item: NoteListItem }) => {
      if (item.type === 'header') {
        return (
          <Text
            style={[
              styles.dateHeader,
              item.isFirst ? styles.dateHeaderFirst : null,
            ]}
          >
            {item.label}
          </Text>
        );
      }

      const note = item.note;
      return (
        <TouchableOpacity
          style={styles.noteCard}
          activeOpacity={0.85}
          onPress={() => openNote(note.id)}
        >
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
          <Text style={styles.noteText} numberOfLines={1}>
            {truncatePreviewText(note.text, NOTE_PREVIEW_CHARS)}
          </Text>
          {note.linked_reminder_date || note.linked_reminder_time ? (
            <View style={styles.reminderRow}>
              <HealthReminderLine
                date={note.linked_reminder_date}
                time={note.linked_reminder_time}
              />
            </View>
          ) : null}
        </TouchableOpacity>
      );
    },
    [failedPhotoIds, openNote, styles],
  );

  if (loading) {
    return (
      <HeaderScrollLayout header={<ScreenHeader title={t('topics.title')} />} edges={['left', 'right']}>
        {({ paddingTop }) => (
          <View style={[styles.centered, { paddingTop }]}>
            <ActivityIndicator color={colors.primaryText} />
          </View>
        )}
      </HeaderScrollLayout>
    );
  }

  if (error || !record) {
    return (
      <HeaderScrollLayout header={<ScreenHeader title={t('topics.title')} />} edges={['left', 'right']}>
        {({ paddingTop }) => (
          <View style={[styles.centered, { paddingTop }]}>
            <EmptyState
              title={t('topics.not_found_title')}
              subtitle={error ?? t('topics.not_found_subtitle')}
              actionTitle={t('reminders.back')}
              onAction={() => router.back()}
            />
          </View>
        )}
      </HeaderScrollLayout>
    );
  }

  const isActive = record.status === 'active';

  const menuButton = (
    <HeaderIconButton
      onPress={() => setMenuVisible(true)}
      accessibilityLabel={t('topics.topic_actions')}
    >
      <Ionicons name="ellipsis-horizontal" size={HEADER_ICON_BTN.iconSize} color={colors.primaryText} />
    </HeaderIconButton>
  );

  return (
    <>
      <HeaderScrollLayout
        header={<ScreenHeader title={record.title} right={menuButton} />}
        edges={['left', 'right']}
        topFade
        fadeMode="list"
        fadeAboveFooter
      >
        {({ paddingTop, fadeBottomInset, scrollMetricsProps }) => (
          <FlatList
            data={noteListItems}
            keyExtractor={(item) => (item.type === 'header' ? item.key : item.note.id)}
            renderItem={renderNoteItem}
            style={styles.scrollView}
            contentContainerStyle={[
              styles.content,
              { paddingTop },
              noteListItems.length === 0 ? styles.contentEmpty : null,
              { paddingBottom: LIST_SCROLL_END_GAP + fadeBottomInset },
            ]}
            showsVerticalScrollIndicator={false}
            onLayout={scrollMetricsProps.onLayout}
            onContentSizeChange={scrollMetricsProps.onContentSizeChange}
            onEndReached={() => {
              void loadMoreNotes();
            }}
            onEndReachedThreshold={0.35}
            ListEmptyComponent={
              !loading ? (
                <Text style={styles.emptyNotes}>
                  {isActive ? t('topics.no_notes_yet') : t('topics.no_notes_resolved')}
                </Text>
              ) : null
            }
            ListFooterComponent={
              <ListLoadMoreFooter loading={notesLoadingMore} hasMore={notesHasMore} />
            }
          />
        )}
      </HeaderScrollLayout>

      {isActive ? (
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
      ) : (
        <View
          style={[
            styles.resolvedFooter,
            {
              paddingTop: footerLayout.padTop,
              paddingHorizontal: footerLayout.padH,
              paddingBottom: footerLayout.padBottom,
              borderTopLeftRadius: footerLayout.footerRadius,
              borderTopRightRadius: footerLayout.footerRadius,
            },
          ]}
        >
          <Text
            style={[
              styles.resolvedText,
              { minHeight: footerLayout.resolvedTextHeight },
            ]}
          >
            {t('topics.resolved_banner')}
          </Text>
        </View>
      )}

      <TopicActionsSheet
        visible={menuVisible}
        isResolved={!isActive}
        onClose={() => setMenuVisible(false)}
        onMarkResolved={() => setResolveVisible(true)}
        onReopen={() => {
          void handleReopen();
        }}
        onEditTopic={() =>
          router.push({ pathname: '/topics/add', params: { id: record.id } } as never)
        }
        onRemoveTopic={() => setDeleteVisible(true)}
      />

      <ConfirmModal
        visible={resolveVisible}
        title={t('topics.resolve_confirm_title')}
        message={t('topics.resolve_confirm_body')}
        confirmText={t('topics.tab_resolved')}
        cancelText={t('common.cancel')}
        variant="primary"
        onCancel={() => {
          if (!resolving) setResolveVisible(false);
        }}
        onConfirm={() => {
          void handleResolve();
        }}
      />

      <ConfirmModal
        visible={deleteVisible}
        title={t('topics.delete_record_confirm_title')}
        message={t('topics.delete_record_confirm_body')}
        confirmText={t('common.delete')}
        onConfirm={handleDeleteRecord}
        onCancel={() => setDeleteVisible(false)}
      />

      <ListFetchBlocker visible={listBlocked} />
    </>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: PAGE_HORIZONTAL_PADDING,
  },
  contentEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  dateHeader: {
    fontFamily: 'Rubik-Regular',
    fontSize: 14,
    lineHeight: 20,
    color: c.secondaryText,
    marginTop: 16,
    marginBottom: 10,
  },
  dateHeaderFirst: {
    marginTop: 10,
  },
  emptyNotes: {
    fontFamily: 'Rubik-Regular',
    fontSize: 15,
    lineHeight: 22,
    color: c.secondaryText,
    textAlign: 'center',
    alignSelf: 'center',
    maxWidth: 300,
  },
  noteCard: {
    backgroundColor: c.surface,
    borderRadius: NOTE_CARD.radius,
    paddingTop: NOTE_CARD.padTop,
    paddingHorizontal: NOTE_CARD.padH,
    paddingBottom: NOTE_CARD.padBottom,
    marginBottom: Spacing.md,
    gap: NOTE_CARD.innerGap,
    shadowColor: '#2D2D2A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 3,
  },
  noteImageWrap: {
    width: '100%',
    height: NOTE_CARD.imageHeight,
    borderRadius: NOTE_CARD.imageRadius,
    overflow: 'hidden',
    backgroundColor: c.background,
  },
  noteImage: {
    width: '100%',
    height: '100%',
  },
  noteText: {
    fontFamily: 'Rubik-Regular',
    fontSize: 14,
    lineHeight: 20,
    color: c.primaryText,
  },
  reminderRow: {
    width: '100%',
    minHeight: 20,
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
    ...PRIMARY_BUTTON,
    backgroundColor: c.brand,
    flexDirection: 'row',
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
  resolvedFooter: {
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
  resolvedText: {
    width: '100%',
    fontFamily: 'Rubik-Regular',
    fontSize: 14,
    lineHeight: 20,
    color: c.primaryText,
    textAlign: 'center',
    textAlignVertical: 'center',
  },
});
