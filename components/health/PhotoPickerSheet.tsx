import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import BottomSheetModal from '@/components/ui/BottomSheetModal';
import { Ionicons } from '@expo/vector-icons';
import { Spacing, type ThemeColors } from '@/constants/theme';
import { PRIMARY_BUTTON } from '@/constants/buttons';
import { useColors, useThemedStyles } from '@/context/ThemeContext';
import { t } from '@/i18n';
import HeaderIconButton from '@/components/ui/HeaderIconButton';

interface PhotoPickerSheetProps {
  visible: boolean;
  onClose: () => void;
  onAdd: () => void;
}

export default function PhotoPickerSheet({ visible, onClose, onAdd }: PhotoPickerSheetProps) {
  const styles = useThemedStyles(makeStyles);
  const colors = useColors();
  const photos: string[] = [];

  return (
    <BottomSheetModal visible={visible} onClose={onClose}>
        <View style={styles.sheet}>
          <View style={styles.dragHandle} />
          
          <View style={styles.header}>
            <View style={styles.headerSpacer} />
            <Text style={styles.title}>Change photo</Text>
            <HeaderIconButton onPress={onClose} accessibilityLabel={t('common.close')}>
              <Ionicons name="close" size={24} color={colors.primaryText} />
            </HeaderIconButton>
          </View>
          
          <View style={styles.gridContainer}>
            {photos.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="images-outline" size={40} color={colors.secondaryText} />
                <Text style={styles.emptyText}>No photos yet</Text>
              </View>
            ) : (
              <FlatList
                data={photos}
                keyExtractor={(_, idx) => idx.toString()}
                numColumns={3}
                showsVerticalScrollIndicator={false}
                renderItem={() => null}
              />
            )}
          </View>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.addButton} onPress={onAdd} activeOpacity={0.8}>
              <Text style={styles.addButtonText}>Add photo</Text>
            </TouchableOpacity>
          </View>
        </View>
    </BottomSheetModal>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    backgroundColor: c.panel,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: Spacing.md,
    height: '85%',
    shadowColor: '#1E1E1E',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    boxShadow: '0px -3px 8px rgba(30, 30, 30, 0.080)',
    elevation: 12,
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
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  headerSpacer: {
    width: 32,
  },
  title: {
    fontFamily: 'Rubik-Medium',
    fontSize: 18,
    color: c.primaryText,
  },
  gridContainer: {
    flex: 1,
    paddingHorizontal: Spacing.sm,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 80,
  },
  emptyText: {
    fontFamily: 'Rubik-Regular',
    fontSize: 16,
    color: c.secondaryText,
    marginTop: Spacing.md,
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    paddingBottom: Spacing.xl * 2,
    borderTopWidth: 1,
    borderTopColor: c.border,
    backgroundColor: c.surface,
  },
  addButton: {
    ...PRIMARY_BUTTON,
    backgroundColor: c.brand,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    fontFamily: 'Rubik-Medium',
    fontSize: 16,
    color: '#FFFFFF',
  },
});
