import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import BottomSheetModal from '@/components/ui/BottomSheetModal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { type ThemeColors } from '@/constants/theme';
import { useColors, useThemedStyles } from '@/context/ThemeContext';
import { t } from '@/i18n';
import type { Pet } from '@/types/api';
import { AddPetRow, PetSwitcherRow } from '@/components/home/PetSwitcherRows';
import HeaderIconButton, { HEADER_ICON_BTN } from '@/components/ui/HeaderIconButton';

interface PetSwitcherSheetProps {
  visible: boolean;
  pets: Pet[];
  activePetId: string | null;
  onClose: () => void;
  onSelectPet: (petId: string) => void;
  onAddPet: () => void;
}

export default function PetSwitcherSheet({
  visible,
  pets,
  activePetId,
  onClose,
  onSelectPet,
  onAddPet,
}: PetSwitcherSheetProps) {
  const styles = useThemedStyles(makeStyles);
  const colors = useColors();
  const insets = useSafeAreaInsets();

  return (
    <BottomSheetModal visible={visible} onClose={onClose}>
      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('home.pets_title')}</Text>
          <HeaderIconButton
            style={styles.closeBtn}
            onPress={onClose}
            accessibilityLabel={t('common.cancel')}
          >
            <Ionicons name="close" size={HEADER_ICON_BTN.iconSize} color={colors.primaryText} />
          </HeaderIconButton>
        </View>

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
    </BottomSheetModal>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    sheet: {
      // Light: #F6F7F9 (panel). Dark twin: #111315.
      backgroundColor: c.panel,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      minHeight: 366,
      maxHeight: '78%',
      paddingTop: 32,
      paddingHorizontal: 20,
      // 0px -3px 8px #1E1E1E14
      shadowColor: '#1E1E1E',
      shadowOffset: { width: 0, height: -3 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 8,
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
      fontSize: 20,
      lineHeight: 24,
      color: c.primaryText,
      textAlign: 'center',
    },
    closeBtn: {
      position: 'absolute',
      right: 0,
      // Light close: #FFFFFF + 0px 4px 20px #2D2D2A14 (surface + soft shadow).
      backgroundColor: c.surface,
      shadowColor: '#2D2D2A',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 20,
      elevation: 3,
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
      maxWidth: '100%',
      height: 1,
      backgroundColor: c.border,
      alignSelf: 'center',
    },
  });
