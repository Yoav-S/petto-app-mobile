import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { t } from '@/i18n';

interface VaccinePhotoSourceSheetProps {
  visible: boolean;
  onClose: () => void;
  onTakePhoto: () => void;
  onChooseLibrary: () => void;
}

export default function VaccinePhotoSourceSheet({
  visible,
  onClose,
  onTakePhoto,
  onChooseLibrary,
}: VaccinePhotoSourceSheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + Spacing.lg }]}>
          <View style={styles.dragHandle} />

          <View style={styles.header}>
            <View style={styles.headerSpacer} />
            <Text style={styles.title}>{t('vaccines.photo_sheet_title')}</Text>
            <Pressable style={styles.closeButton} onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={20} color={Colors.primaryText} />
            </Pressable>
          </View>

          <View style={styles.options}>
            <Pressable style={styles.optionRow} onPress={onTakePhoto}>
              <Text style={styles.optionText}>{t('petOnboarding.photo_take')}</Text>
            </Pressable>
            <View style={styles.divider} />
            <Pressable style={styles.optionRow} onPress={onChooseLibrary}>
              <Text style={styles.optionText}>{t('petOnboarding.photo_choose_library')}</Text>
            </Pressable>
          </View>

          <Pressable style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelText}>{t('petOnboarding.photo_cancel')}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  headerSpacer: {
    width: 32,
  },
  title: {
    fontFamily: 'Rubik-Regular',
    fontSize: 16,
    color: Colors.primaryText,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  options: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  optionRow: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  optionText: {
    fontFamily: 'Rubik-Regular',
    fontSize: 16,
    color: Colors.primaryText,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.lg,
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  cancelText: {
    fontFamily: 'Rubik-Medium',
    fontSize: 16,
    color: Colors.primaryText,
  },
});
