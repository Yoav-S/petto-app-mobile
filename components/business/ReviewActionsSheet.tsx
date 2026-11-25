import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import BottomSheetModal, {
  setActiveSheetOverlay,
  waitForBottomSheetsToSettle,
} from '@/components/ui/BottomSheetModal';
import { Radius, Spacing, type ThemeColors } from '@/constants/theme';
import { PRIMARY_BUTTON } from '@/constants/buttons';
import { useColors, useThemedStyles } from '@/context/ThemeContext';
import HeaderIconButton from '@/components/ui/HeaderIconButton';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { useToast } from '@/context/ToastContext';
import { t } from '@/i18n';
import { getErrorMessage } from '@/services/errors';
import { blockReviewAuthor, type ReviewReportReason } from '@/services/places';

type ReasonItem = { reason: ReviewReportReason; label: string };

const REVIEW_REASONS: ReasonItem[] = [
  { reason: 'spam', label: 'business.report_spam' },
  { reason: 'offensive', label: 'business.report_offensive' },
  { reason: 'fake', label: 'business.report_fake' },
  { reason: 'irrelevant', label: 'business.report_irrelevant' },
];

const USER_REASONS: ReasonItem[] = [
  { reason: 'harassment', label: 'business.report_harassment' },
  { reason: 'impersonation', label: 'business.report_impersonation' },
  { reason: 'offensive', label: 'business.report_offensive' },
];

type ReportMode = 'review' | 'user';

interface ReviewActionsSheetProps {
  visible: boolean;
  isMine: boolean;
  /** Needed to block the author; blocking is hidden without them. */
  businessId?: string;
  reviewId?: string;
  onClose: () => void;
  onEdit: () => void;
  onRemove: () => void;
  onReport: (reason: ReviewReportReason) => void;
  /** The author's review is now hidden for this user. */
  onBlocked?: (reviewId: string) => void;
}

function ReportReasonPanel({
  title,
  reasons,
  onCancel,
  onSelect,
}: {
  title: string;
  reasons: ReasonItem[];
  onCancel: () => void;
  onSelect: (reason: ReviewReportReason) => void;
}) {
  const styles = useThemedStyles(makeStyles);
  const colors = useColors();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.reportHost}>
      <Pressable style={styles.reportBackdrop} onPress={onCancel} />
      <View style={[styles.sheet, styles.reportSheet, { paddingBottom: insets.bottom + Spacing.lg }]}>
        <View style={styles.header}>
          <View style={styles.headerSpacer} />
          <Text style={styles.title}>{title}</Text>
          <HeaderIconButton onPress={onCancel} accessibilityLabel={t('common.close')}>
            <Ionicons name="close" size={24} color={colors.primaryText} />
          </HeaderIconButton>
        </View>
        <View style={styles.menuContainer}>
          {reasons.map((item, index) => (
            <React.Fragment key={item.reason}>
              {index > 0 ? <View style={styles.divider} /> : null}
              <TouchableOpacity
                style={styles.reasonItem}
                onPress={() => onSelect(item.reason)}
                accessibilityRole="button"
              >
                <Text style={styles.menuItemText}>{t(item.label)}</Text>
              </TouchableOpacity>
            </React.Fragment>
          ))}
        </View>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel} activeOpacity={0.8}>
          <Text style={styles.cancelText}>{t('common.cancel')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function ReviewActionsSheet({
  visible,
  isMine,
  businessId,
  reviewId,
  onClose,
  onEdit,
  onRemove,
  onReport,
  onBlocked,
}: ReviewActionsSheetProps) {
  const styles = useThemedStyles(makeStyles);
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const [reportMode, setReportMode] = useState<ReportMode | null>(null);
  const [blockTarget, setBlockTarget] = useState<{ businessId: string; reviewId: string } | null>(
    null,
  );
  const onReportRef = useRef(onReport);
  onReportRef.current = onReport;
  const canBlock = Boolean(businessId && reviewId && onBlocked);

  useEffect(() => {
    if (!visible) setReportMode(null);
  }, [visible]);

  useEffect(() => {
    if (!visible || !reportMode) {
      setActiveSheetOverlay(null);
      return;
    }
    setActiveSheetOverlay(
      <ReportReasonPanel
        title={t(reportMode === 'user' ? 'business.report_user' : 'business.report_review')}
        reasons={reportMode === 'user' ? USER_REASONS : REVIEW_REASONS}
        onCancel={() => setReportMode(null)}
        onSelect={(reason) => {
          setReportMode(null);
          onReportRef.current(reason);
        }}
      />,
    );
    return () => setActiveSheetOverlay(null);
  }, [visible, reportMode]);

  const requestClose = () => {
    if (reportMode) {
      setReportMode(null);
      return;
    }
    onClose();
  };

  const confirmBlock = async () => {
    const target = blockTarget;
    setBlockTarget(null);
    if (!target) return;
    try {
      await blockReviewAuthor(target.businessId, target.reviewId);
      onBlocked?.(target.reviewId);
      toast.show({ message: t('business.user_blocked') });
    } catch (err) {
      toast.showError(getErrorMessage(err));
    }
  };

  const runAfterClose = (action: () => void) => {
    onClose();
    void waitForBottomSheetsToSettle().then(action);
  };

  return (
    <>
    <BottomSheetModal visible={visible} onClose={requestClose}>
      <View style={[styles.sheet, isMine ? styles.sheetMine : null, { paddingBottom: insets.bottom + Spacing.lg }]}>
        <View style={styles.header}>
          <View style={styles.headerSpacer} />
          <Text style={styles.title}>{t('business.review_actions')}</Text>
          <HeaderIconButton onPress={requestClose} accessibilityLabel={t('common.close')}>
            <Ionicons name="close" size={24} color={colors.primaryText} />
          </HeaderIconButton>
        </View>

        <View style={[styles.menuContainer, isMine ? styles.menuMine : styles.menuOther]}>
          {isMine ? (
            <>
              <TouchableOpacity
                style={styles.mineItem}
                onPress={() => runAfterClose(onEdit)}
                accessibilityRole="button"
              >
                <Text style={styles.menuItemText}>{t('business.edit_review')}</Text>
              </TouchableOpacity>
              <View style={styles.mineDivider} />
              <TouchableOpacity
                style={styles.mineItem}
                onPress={() => runAfterClose(onRemove)}
                accessibilityRole="button"
              >
                <Text style={[styles.menuItemText, styles.removeText]}>
                  {t('business.remove_review')}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={styles.otherItem}
                onPress={() => setReportMode('review')}
                accessibilityRole="button"
              >
                <Text style={styles.menuItemText}>{t('business.report_review')}</Text>
              </TouchableOpacity>
              <View style={styles.divider} />
              <TouchableOpacity
                style={styles.otherItem}
                onPress={() => setReportMode('user')}
                accessibilityRole="button"
              >
                <Text style={styles.menuItemText}>{t('business.report_user')}</Text>
              </TouchableOpacity>
              {canBlock ? (
                <>
                  <View style={styles.divider} />
                  <TouchableOpacity
                    style={styles.otherItem}
                    onPress={() => {
                      const target = { businessId: businessId!, reviewId: reviewId! };
                      runAfterClose(() => setBlockTarget(target));
                    }}
                    accessibilityRole="button"
                  >
                    <Text style={[styles.menuItemText, styles.removeText]}>
                      {t('business.block_user')}
                    </Text>
                  </TouchableOpacity>
                </>
              ) : null}
            </>
          )}
        </View>

        <TouchableOpacity style={styles.cancelButton} onPress={requestClose} activeOpacity={0.8}>
          <Text style={styles.cancelText}>{t('common.cancel')}</Text>
        </TouchableOpacity>
      </View>
    </BottomSheetModal>
    <ConfirmModal
      visible={blockTarget !== null}
      title={t('business.block_user_title')}
      message={t('business.block_user_body')}
      confirmText={t('business.block_user')}
      variant="danger"
      onCancel={() => setBlockTarget(null)}
      onConfirm={() => {
        void confirmBlock();
      }}
    />
    </>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    sheet: {
      minHeight: 280,
      backgroundColor: c.panel,
      borderTopLeftRadius: Radius.xl,
      borderTopRightRadius: Radius.xl,
      paddingHorizontal: Spacing.lg,
      paddingTop: 24,
      shadowColor: '#1E1E1E',
      shadowOffset: { width: 0, height: -3 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      boxShadow: '0px -3px 8px rgba(30, 30, 30, 0.080)',
      elevation: 12,
    },
    sheetMine: {
      minHeight: 288,
    },
    reportSheet: {
      minHeight: 0,
    },
    reportHost: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    reportBackdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: c.overlay,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    headerSpacer: {
      width: 32,
    },
    title: {
      flex: 1,
      fontFamily: 'Rubik-Medium',
      fontSize: 20,
      lineHeight: 24,
      color: c.primaryText,
      textAlign: 'center',
    },
    menuContainer: {
      backgroundColor: c.surface,
      borderRadius: Radius.lg,
      marginBottom: 16,
      shadowColor: '#1F1F1F',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      boxShadow: '0px 3px 8px rgba(31, 31, 31, 0.060)',
      elevation: 2,
    },
    menuMine: {
      padding: 16,
      gap: 8,
      borderRadius: 12,
    },
    mineItem: {
      height: 24,
      alignItems: 'center',
      justifyContent: 'center',
    },
    mineDivider: {
      height: 0,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    menuOther: {
      minHeight: 72,
    },
    otherItem: {
      height: 56,
      alignItems: 'center',
      justifyContent: 'center',
    },
    menuItem: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    reasonItem: {
      height: 48,
      alignItems: 'center',
      justifyContent: 'center',
    },
    menuItemText: {
      fontFamily: 'Rubik-Regular',
      fontSize: 16,
      color: c.primaryText,
      textAlign: 'center',
    },
    removeText: {
      color: c.error,
    },
    divider: {
      height: 1,
      backgroundColor: c.border,
      marginHorizontal: Spacing.lg,
    },
    cancelButton: {
      ...PRIMARY_BUTTON,
      backgroundColor: c.surface,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#2D2D2A',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 20,
      boxShadow: '0px 4px 20px rgba(45, 45, 42, 0.080)',
      elevation: 3,
    },
    cancelText: {
      fontFamily: 'Rubik-Medium',
      fontSize: 16,
      color: c.primaryText,
    },
  });
