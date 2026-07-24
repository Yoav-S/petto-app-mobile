import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import BottomSheetModal from '@/components/ui/BottomSheetModal';
import { Ionicons } from '@expo/vector-icons';
import { Radius, Spacing, type ThemeColors } from '@/constants/theme';
import { useColors, useThemedStyles } from '@/context/ThemeContext';

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
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={20} color={colors.primaryText} />
            </TouchableOpacity>
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
    backgroundColor: c.surface,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingTop: Spacing.md,
    height: '85%',
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
  closeButton: {
    width: 32,
    height: 32,
    backgroundColor: c.background,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
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
    backgroundColor: c.brand,
    borderRadius: Radius.md,
    paddingVertical: 16,
    alignItems: 'center',
  },
  addButtonText: {
    fontFamily: 'Rubik-Medium',
    fontSize: 16,
    color: '#FFFFFF',
  },
});
