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
  hasPhoto?: boolean;
}

export default function EditPhotoSheet({
  visible,
  onClose,
  onTake,
  onChoose,
  onRemove,
  hasPhoto = false,
}: EditPhotoSheetProps) {
  const styles = useThemedStyles(makeStyles);
  const colors = useColors();
  return (
    <BottomSheetModal visible={visible} onClose={onClose}>
        <View style={[styles.sheet, onRemove ? styles.sheetWithRemove : null]}>
          <View style={styles.header}>
            <View style={styles.headerSpacer} />
            <Text style={styles.title}>
              {hasPhoto ? t('profile.edit.change_photo') : t('petOnboarding.photo_sheet_title')}
            </Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={20} color={colors.primaryText} />
            </TouchableOpacity>
          </View>
          
          <View style={[styles.menuContainer, onRemove ? styles.menuWithRemove : null]}>
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
    minHeight: 328,
    backgroundColor: c.panel,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingHorizontal: Spacing.lg,
    paddingTop: 24,
    paddingBottom: 24,
    shadowColor: '#1E1E1E',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 12,
  },
  sheetWithRemove: {
    minHeight: 376,
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
    fontFamily: 'Rubik-Medium',
    fontSize: 20,
    lineHeight: 24,
    color: c.primaryText,
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
    minHeight: 136,
    backgroundColor: c.surface,
    borderRadius: Radius.lg,
    marginBottom: 16,
    shadowColor: '#1F1F1F',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  menuWithRemove: {
    minHeight: 184,
  },
  menuItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
    height: 48,
    backgroundColor: c.surface,
    borderRadius: Radius.lg,
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
