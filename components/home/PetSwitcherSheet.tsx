import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { type ThemeColors } from '@/constants/theme';
import { useColors, useThemedStyles } from '@/context/ThemeContext';
import { t } from '@/i18n';
import type { Pet } from '@/types/api';
import { AddPetRow, PetSwitcherRow } from '@/components/home/PetSwitcherRows';

interface PetSwitcherSheetProps {
  visible: boolean;
  pets: Pet[];
  activePetId: string | null;
  onClose: () => void;
  onSelectPet: (petId: string) => void;
  onAddPet: () => void;
  onViewAll: () => void;
}

export default function PetSwitcherSheet({
  visible,
  pets,
  activePetId,
  onClose,
  onSelectPet,
  onAddPet,
  onViewAll,
}: PetSwitcherSheetProps) {
  const styles = useThemedStyles(makeStyles);
  const colors = useColors();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel={t('common.cancel')} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.header}>
            <Text style={styles.title}>{t('home.switch_title')}</Text>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel={t('common.cancel')}
            >
              <Ionicons name="close" size={20} color={colors.primaryText} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={onViewAll} style={styles.viewAllBtn} activeOpacity={0.7}>
            <Text style={styles.viewAllText}>{t('home.view_all_pets')}</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.secondaryText} />
          </TouchableOpacity>

          <View style={styles.listBlock}>
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={pets.length > 3}
              bounces={pets.length > 3}
            >
              {pets.map((pet) => (
                <PetSwitcherRow
                  key={pet.id}
                  pet={pet}
                  selected={pet.id === activePetId}
                  onPress={() => onSelectPet(pet.id)}
                />
              ))}
            </ScrollView>

            <View style={styles.divider} />
            <AddPetRow onPress={onAddPet} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: c.overlay,
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: c.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      minHeight: 366,
      maxHeight: '78%',
      paddingTop: 32,
      paddingHorizontal: 20,
    },
    header: {
      height: 32,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
    },
    title: {
      fontFamily: 'Rubik-Medium',
      fontSize: 18,
      lineHeight: 24,
      color: c.primaryText,
      textAlign: 'center',
    },
    closeBtn: {
      position: 'absolute',
      right: 0,
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
    },
    viewAllBtn: {
      alignSelf: 'center',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginBottom: 16,
      paddingVertical: 4,
    },
    viewAllText: {
      fontFamily: 'Rubik-Regular',
      fontSize: 14,
      lineHeight: 18,
      color: c.secondaryText,
    },
    listBlock: {
      gap: 16,
      maxHeight: 230,
    },
    scroll: {
      flexGrow: 0,
      maxHeight: 153,
    },
    scrollContent: {
      gap: 16,
      paddingBottom: 4,
    },
    divider: {
      width: '100%',
      maxWidth: 335,
      height: 1,
      backgroundColor: c.border,
      alignSelf: 'center',
    },
  });
