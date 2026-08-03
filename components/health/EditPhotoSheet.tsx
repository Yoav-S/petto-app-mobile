import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import BottomSheetModal from '@/components/ui/BottomSheetModal';
import { Ionicons } from '@expo/vector-icons';
import { Radius, Spacing, type ThemeColors } from '@/constants/theme';
import { useColors, useThemedStyles } from '@/context/ThemeContext';
import { t } from '@/i18n';

interface EditPhotoSheetProps {
  visible: boolean;
  onClose: () => void;
  onTake: () => void;
  onChoose: () => void;
  /** When set, shows a remove action (e.g. clear a newly picked photo). */
  onRemove?: () => void;
}

export default function EditPhotoSheet({
  visible,
  onClose,
  onTake,
  onChoose,
  onRemove,
}: EditPhotoSheetProps) {
  const styles = useThemedStyles(makeStyles);
  const colors = useColors();
  return (
    <BottomSheetModal visible={visible} onClose={onClose}>
        <View style={styles.sheet}>
          <View style={styles.dragHandle} />
          
          <View style={styles.header}>
            <View style={styles.headerSpacer} />
            <Text style={styles.title}>{t('petOnboarding.photo_sheet_title')}</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={20} color={colors.primaryText} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.menuContainer}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                onClose();
                onTake();
              }}
            >
              <Text style={styles.menuItemText}>{t('petOnboarding.photo_take')}</Text>
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                onClose();
                onChoose();
              }}
            >
              <Text style={styles.menuItemText}>{t('petOnboarding.photo_choose_library')}</Text>
            </TouchableOpacity>
            {onRemove ? (
              <>
                <View style={styles.divider} />
                <TouchableOpacity style={styles.menuItem} onPress={onRemove}>
                  <Text style={[styles.menuItemText, styles.removeText]}>
                    {t('petOnboarding.photo_remove')}
                  </Text>
                </TouchableOpacity>
              </>
            ) : null}
          </View>

          <TouchableOpacity style={styles.cancelButton} onPress={onClose} activeOpacity={0.8}>
            <Text style={styles.cancelText}>{t('petOnboarding.photo_cancel')}</Text>
          </TouchableOpacity>
        </View>
    </BottomSheetModal>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)', // Dimmed background to simulate blur for mockup
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    backgroundColor: c.surface,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl * 2, // Extra padding for safe area
    paddingTop: Spacing.md,
  },
  dragHandle: {
    width: 36,
    height: 4,
    backgroundColor: c.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  headerSpacer: {
    width: 32,
  },
  title: {
    fontFamily: 'Rubik-Medium',
    fontSize: 18,
    color: c.primaryText,
  },
  closeButton: {
    width: 32,
    height: 32,
    backgroundColor: c.background,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuContainer: {
    backgroundColor: c.background,
    borderRadius: Radius.lg,
    marginBottom: Spacing.lg,
  },
  menuItem: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  menuItemText: {
    fontFamily: 'Rubik-Regular',
    fontSize: 16,
    color: c.primaryText,
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
    backgroundColor: c.background,
    borderRadius: Radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelText: {
    fontFamily: 'Rubik-Medium',
    fontSize: 16,
    color: c.primaryText,
  },
});
