import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/context/ThemeContext';
import { t } from '@/i18n';
import SettingsHeader from '@/components/settings/SettingsHeader';
import Toggle from '@/components/settings/Toggle';
import { HeaderScrollScreen } from '@/components/ui/HeaderScrollLayout';
import {
  hydratePetSoundsPref,
  petSoundsEnabled,
  setPetSoundsEnabled,
} from '@/services/petSound';

export default function SoundSettingsScreen() {
  const styles = useThemedStyles(makeStyles);
  const [on, setOn] = useState(petSoundsEnabled);

  useEffect(() => {
    void hydratePetSoundsPref().then(setOn);
  }, []);

  return (
    <HeaderScrollScreen
      header={<SettingsHeader title={t('settings.sound')} rounded />}
      contentGap={4}
      chromePaddingBottom={0}
      contentContainerStyle={styles.content}
    >
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.rowTitle}>{t('settings.sound')}</Text>
          <Toggle
            value={on}
            onValueChange={(next) => {
              setOn(next);
              void setPetSoundsEnabled(next);
            }}
          />
        </View>
      </View>
    </HeaderScrollScreen>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    content: {
      flexGrow: 1,
    },
    card: {
      backgroundColor: c.surface,
      borderRadius: 24,
      paddingTop: 22,
      paddingRight: 20,
      paddingBottom: 22,
      paddingLeft: 20,
      gap: 4,
    },
    row: {
      minHeight: 56,
      boxSizing: 'border-box',
      borderRadius: 16,
      padding: 16,
      backgroundColor: c.background,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 6,
    },
    rowTitle: {
      flexShrink: 1,
      fontFamily: 'Rubik-Medium',
      fontSize: 16,
      lineHeight: 20,
      color: c.primaryText,
    },
  });
