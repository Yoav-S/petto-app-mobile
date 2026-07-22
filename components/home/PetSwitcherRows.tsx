import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { type ThemeColors } from '@/constants/theme';
import { useColors, useThemedStyles } from '@/context/ThemeContext';
import { t } from '@/i18n';
import type { Pet } from '@/types/api';

const PLACEHOLDER = require('@/assets/images/onboarding-cover.png');

export function petTypeLabel(type: string): string {
  const key = `petOnboarding.${type.toLowerCase()}`;
  const label = t(key);
  return label === key ? type : label;
}

interface PetSwitcherRowProps {
  pet: Pet;
  selected: boolean;
  onPress: () => void;
}

export function PetSwitcherRow({ pet, selected, onPress }: PetSwitcherRowProps) {
  const styles = useThemedStyles(makeStyles);
  const colors = useColors();

  return (
    <Pressable
      style={styles.row}
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
    >
      <View style={styles.left}>
        <Image
          source={pet.photo_url ? { uri: pet.photo_url } : PLACEHOLDER}
          style={styles.avatar}
          contentFit="cover"
        />
        <View style={styles.copy}>
          <Text style={styles.name} numberOfLines={1}>
            {pet.name}
          </Text>
          <Text style={styles.type} numberOfLines={1}>
            {petTypeLabel(pet.type)}
          </Text>
        </View>
      </View>
      <View style={[styles.checkbox, selected && styles.checkboxChecked]}>
        {selected ? (
          <Ionicons name="checkmark" size={16} color={colors.button.primaryText} />
        ) : null}
      </View>
    </Pressable>
  );
}

interface AddPetRowProps {
  onPress: () => void;
}

export function AddPetRow({ onPress }: AddPetRowProps) {
  const styles = useThemedStyles(makeStyles);

  return (
    <Pressable
      style={styles.addRow}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={t('home.add_pet')}
    >
      <View style={styles.addIconOuter}>
        <View style={styles.addIconInner}>
          <View style={[styles.plusBar, styles.plusVertical]} />
          <View style={[styles.plusBar, styles.plusHorizontal]} />
        </View>
      </View>
      <Text style={styles.addLabel}>{t('home.add_pet')}</Text>
    </Pressable>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    row: {
      width: '100%',
      maxWidth: 335,
      height: 56,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    left: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
      marginRight: 12,
    },
    avatar: {
      width: 56,
      height: 56,
      borderRadius: 16,
      backgroundColor: c.panel,
    },
    copy: {
      flex: 1,
      gap: 4,
      justifyContent: 'center',
    },
    name: {
      fontFamily: 'Rubik-Medium',
      fontSize: 16,
      lineHeight: 20,
      color: c.primaryText,
    },
    type: {
      fontFamily: 'Rubik-Regular',
      fontSize: 12,
      lineHeight: 16,
      color: c.secondaryText,
    },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: 999,
      borderWidth: 2,
      borderColor: c.border,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    checkboxChecked: {
      backgroundColor: c.brand,
      borderColor: c.brand,
    },
    addRow: {
      width: '100%',
      maxWidth: 335,
      height: 60,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    },
    addIconOuter: {
      width: 60,
      height: 60,
      alignItems: 'center',
      justifyContent: 'center',
    },
    addIconInner: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    plusBar: {
      position: 'absolute',
      backgroundColor: c.primaryText,
      borderRadius: 2,
    },
    plusVertical: {
      width: 3.33,
      height: 26.67,
    },
    plusHorizontal: {
      width: 26.67,
      height: 3.33,
    },
    addLabel: {
      fontFamily: 'Rubik-Medium',
      fontSize: 16,
      lineHeight: 20,
      color: c.primaryText,
    },
  });
