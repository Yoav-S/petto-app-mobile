import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/context/ThemeContext';
import { t } from '@/i18n';
import type { Pet } from '@/types/api';

const EMPTY_VALUE = '\u2014';

interface PetProfilePanelProps {
  pet: Pet | null;
}

function formatBirthDate(iso?: string | null): string {
  if (!iso) return EMPTY_VALUE;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return EMPTY_VALUE;
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

function formatSex(sex?: string | null): string {
  if (!sex) return EMPTY_VALUE;
  const key = sex.toLowerCase();
  if (key === 'male' || key === 'female') return t(`profile.sex_${key}`);
  return sex;
}

function formatWeight(weight?: number | null): string {
  if (weight == null) return EMPTY_VALUE;
  return `${weight} ${t('profile.weight_unit')}`;
}

function formatNeutered(value?: boolean | null): string {
  if (value == null) return EMPTY_VALUE;
  return value ? t('common.yes') : t('common.no');
}

function DetailCard({
  label,
  value,
  flex,
}: {
  label: string;
  value: string;
  flex: number;
}) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={[styles.card, { flex }]}>
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
      <Text style={styles.value} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

export default function PetProfilePanel({ pet }: PetProfilePanelProps) {
  const styles = useThemedStyles(makeStyles);

  return (
    <View style={styles.grid}>
      <View style={styles.row}>
        <DetailCard label={t('profile.sex')} value={formatSex(pet?.sex)} flex={164} />
        <DetailCard label={t('profile.birth_date')} value={formatBirthDate(pet?.birth_date)} flex={163} />
      </View>
      <View style={styles.row}>
        <DetailCard label={t('profile.color')} value={pet?.color || EMPTY_VALUE} flex={229} />
        <DetailCard label={t('profile.weight')} value={formatWeight(pet?.weight)} flex={98} />
      </View>
      <View style={styles.row}>
        <DetailCard label={t('profile.neutered')} value={formatNeutered(pet?.is_neutered)} flex={98} />
        <DetailCard label={t('profile.chip_id')} value={pet?.chip_id || EMPTY_VALUE} flex={229} />
      </View>
    </View>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  grid: {
    width: '100%',
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 8,
  },
  card: {
    height: 100,
    borderRadius: 20,
    backgroundColor: c.background,
    paddingTop: 16,
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 8,
    overflow: 'hidden',
  },
  label: {
    fontFamily: 'Rubik-Medium',
    fontSize: 14,
    lineHeight: 20,
    color: '#101623',
  },
  value: {
    fontFamily: 'Rubik-Medium',
    fontSize: 20,
    lineHeight: 24,
    color: '#1F2937',
  },
});
