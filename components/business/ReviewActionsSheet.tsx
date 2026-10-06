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
import { t } from '@/i18n';
import type { ReviewReportReason } from '@/services/places';

const REPORT_REASONS: { reason: ReviewReportReason; label: string }[] = [
  { reason: 'spam', label: 'business.report_spam' },
  { reason: 'offensive', label: 'business.report_offensive' },
  { reason: 'fake', label: 'business.report_fake' },
  { reason: 'irrelevant', label: 'business.report_irrelevant' },
];

interface ReviewActionsSheetProps {
  visible: boolean;
  isMine: boolean;
  onClose: () => void;
  onEdit: () => void;
  onRemove: () => void;
  onReport: (reason: ReviewReportReason) => void;
}

function ReportReasonPanel({
  onCancel,
  onSelect,
}: {
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
          <Text style={styles.title}>{t('business.report_review')}</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onCancel}
            accessibilityRole="button"
            accessibilityLabel={t('common.close')}
          >
            <Ionicons name="close" size={20} color={colors.primaryText} />
          </TouchableOpacity>
        </View>
        <View style={styles.menuContainer}>
          {REPORT_REASONS.map((item, index) => (
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
  onClose,
  onEdit,
  onRemove,
  onReport,
}: ReviewActionsSheetProps) {
  const styles = useThemedStyles(makeStyles);
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [reportOpen, setReportOpen] = useState(false);
  const onReportRef = useRef(onReport);
  onReportRef.current = onReport;

  useEffect(() => {
    if (!visible) setReportOpen(false);
  }, [visible]);

  useEffect(() => {
    if (!visible || !reportOpen) {
      setActiveSheetOverlay(null);
      return;
    }
    setActiveSheetOverlay(
      <ReportReasonPanel
        onCancel={() => setReportOpen(false)}
        onSelect={(reason) => {
          setReportOpen(false);
          onReportRef.current(reason);
        }}
      />,
    );
    return () => setActiveSheetOverlay(null);
  }, [visible, reportOpen]);

  const requestClose = () => {
    if (reportOpen) {
      setReportOpen(false);
      return;
    }
    onClose();
  };

  const runAfterClose = (action: () => void) => {
    onClose();
    void waitForBottomSheetsToSettle().then(action);
  };

  return (
    <BottomSheetModal visible={visible} onClose={requestClose}>
      <View style={[styles.sheet, isMine ? styles.sheetMine : null, { paddingBottom: insets.bottom + Spacing.lg }]}>
        <View style={styles.header}>
          <View style={styles.headerSpacer} />
          <Text style={styles.title}>{t('business.review_actions')}</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={requestClose}
            accessibilityRole="button"
            accessibilityLabel={t('common.close')}
          >
            <Ionicons name="close" size={20} color={colors.primaryText} />
          </TouchableOpacity>
        </View>

        <View style={[styles.menuContainer, isMine ? styles.menuMine : styles.menuOther]}>
          {isMine ? (
            <>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => runAfterClose(onEdit)}
                accessibilityRole="button"
              >
                <Text style={styles.menuItemText}>{t('business.edit_review')}</Text>
              </TouchableOpacity>
              <View style={styles.divider} />
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => runAfterClose(onRemove)}
                accessibilityRole="button"
              >
                <Text style={[styles.menuItemText, styles.removeText]}>
                  {t('business.remove_review')}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => setReportOpen(true)}
              accessibilityRole="button"
            >
              <Text style={styles.menuItemText}>{t('business.report_review')}</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity style={styles.cancelButton} onPress={requestClose} activeOpacity={0.8}>
          <Text style={styles.cancelText}>{t('common.cancel')}</Text>
        </TouchableOpacity>
      </View>
    </BottomSheetModal>
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
      elevation: 12,
    },
    sheetMine: {
      minHeight: 328,
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
    closeButton: {
      width: 32,
      height: 32,
      padding: 4,
      backgroundColor: c.surface,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#2D2D2A',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 20,
      elevation: 3,
    },
    menuContainer: {
      backgroundColor: c.surface,
      borderRadius: Radius.lg,
      marginBottom: 16,
      shadowColor: '#1F1F1F',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 2,
    },
    menuMine: {
      minHeight: 136,
    },
    menuOther: {
      minHeight: 72,
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
      elevation: 3,
    },
    cancelText: {
      fontFamily: 'Rubik-Medium',
      fontSize: 16,
      color: c.primaryText,
    },
  });
