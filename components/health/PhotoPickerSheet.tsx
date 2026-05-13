import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing } from '@/constants/theme';

interface PhotoPickerSheetProps {
  visible: boolean;
  onClose: () => void;
  onAdd: () => void;
}

// Mock URLs for the gallery
const MOCK_PHOTOS = [
  'https://images.unsplash.com/photo-1506744626753-1fa7604d5093?q=80&w=200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1517404215738-15263e9f9178?q=80&w=200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1494548162494-384bba4ab999?q=80&w=200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1534081333815-ae5019106622?q=80&w=200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1584697964400-2af6a2f6204c?q=80&w=200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1542204165-65bf26472b9b?q=80&w=200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?q=80&w=200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1534081333815-ae5019106622?q=80&w=200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1584697964400-2af6a2f6204c?q=80&w=200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1542204165-65bf26472b9b?q=80&w=200&auto=format&fit=crop',
];

export default function PhotoPickerSheet({ visible, onClose, onAdd }: PhotoPickerSheetProps) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />
        
        <View style={styles.sheet}>
          <View style={styles.dragHandle} />
          
          <View style={styles.header}>
            <View style={styles.headerSpacer} />
            <Text style={styles.title}>Change photo</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={20} color={Colors.primaryText} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.gridContainer}>
            <FlatList
              data={MOCK_PHOTOS}
              keyExtractor={(_, idx) => idx.toString()}
              numColumns={3}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.photoWrapper} activeOpacity={0.8}>
                  <Image source={{ uri: item }} style={styles.photo} contentFit="cover" />
                </TouchableOpacity>
              )}
            />
          </View>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.addButton} onPress={onAdd} activeOpacity={0.8}>
              <Text style={styles.addButtonText}>Add photo</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingTop: Spacing.md,
    height: '85%', // Make it take up most of the screen
  },
  dragHandle: {
    width: 36,
    height: 4,
    backgroundColor: Colors.border,
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
    color: Colors.primaryText,
  },
  closeButton: {
    width: 32,
    height: 32,
    backgroundColor: Colors.background,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridContainer: {
    flex: 1,
    paddingHorizontal: Spacing.sm,
  },
  photoWrapper: {
    flex: 1,
    aspectRatio: 1,
    padding: 4,
  },
  photo: {
    flex: 1,
    borderRadius: Radius.md,
    backgroundColor: Colors.border,
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    paddingBottom: Spacing.xl * 2, // safe area padding
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  addButton: {
    backgroundColor: Colors.primaryText,
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
