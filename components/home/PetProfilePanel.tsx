import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Spacing, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/context/ThemeContext';
import { t } from '@/i18n';
import type { Pet } from '@/types/api';

type ProfileTab = 'general' | 'details';

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

function ProfileRow({ label, value, height }: { label: string; value: string; height: number }) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={[styles.row, { minHeight: height }]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={1} ellipsizeMode="tail">
        {value}
      </Text>
    </View>
  );
}

export default function PetProfilePanel({ pet }: PetProfilePanelProps) {
  const styles = useThemedStyles(makeStyles);
  const [tab, setTab] = useState<ProfileTab>('general');

  return (
    <View style={styles.wrapper}>
      <View style={styles.switcher}>
        {(['general', 'details'] as const).map((key) => {
          const active = tab === key;
          return (
            <TouchableOpacity
              key={key}
              style={[styles.segment, active && styles.segmentActive]}
              onPress={() => setTab(key)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                {t(`profile.tab_${key}`)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.container}>
        {tab === 'general' ? (
          <>
            <ProfileRow label={t('profile.sex')} value={formatSex(pet?.sex)} height={48} />
            <ProfileRow label={t('profile.birth_date')} value={formatBirthDate(pet?.birth_date)} height={48} />
            <ProfileRow label={t('profile.weight')} value={formatWeight(pet?.weight)} height={50} />
            <ProfileRow label={t('profile.color')} value={pet?.color || EMPTY_VALUE} height={50} />
          </>
        ) : (
          <>
            <ProfileRow label={t('profile.neutered')} value={formatNeutered(pet?.is_neutered)} height={50} />
            <ProfileRow label={t('profile.serial')} value={pet?.passport_number || EMPTY_VALUE} height={50} />
            <ProfileRow label={t('profile.chip_id')} value={pet?.chip_id || EMPTY_VALUE} height={50} />
          </>
        )}
      </View>
    </View>
  );
}

const cardShadow = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 10,
  elevation: 2,
};

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  wrapper: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.lg,
  },
  switcher: {
    alignSelf: 'center',
    flexDirection: 'row',
    width: 220,
    height: 36,
    borderRadius: 10,
    backgroundColor: c.border,
    paddingVertical: 2,
    paddingHorizontal: 4,
    gap: 4,
  },
  segment: {
    flex: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentActive: {
    backgroundColor: c.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    fontFamily: 'Rubik-Medium',
    fontSize: 14,
    color: c.secondaryText,
  },
  segmentTextActive: {
    color: c.primaryText,
  },
  container: {
    backgroundColor: c.surface,
    borderRadius: 16,
    padding: Spacing.lg,
    gap: Spacing.lg,
    ...cardShadow,
  },
  row: {
    gap: Spacing.xs,
    justifyContent: 'center',
  },
  rowLabel: {
    fontFamily: 'Rubik-Regular',
    fontSize: 12,
    color: c.secondaryText,
  },
  rowValue: {
    fontFamily: 'Rubik-Medium',
    fontSize: 16,
    color: c.primaryText,
  },
});
