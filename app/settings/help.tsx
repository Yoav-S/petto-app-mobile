import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Alert } from 'react-native';
import { type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/context/ThemeContext';
import { t } from '@/i18n';
import SettingsHeader from '@/components/settings/SettingsHeader';
import { HeaderScrollScreen } from '@/components/ui/HeaderScrollLayout';
import { PAGE_HORIZONTAL_PADDING } from '@/constants/layout';

/** Users write here; Cloudflare forwards to pettoservices@gmail.com. */
const SUPPORT_EMAIL = 'support@ragly.cloud';

function buildSupportMailto(): string {
  const subject = encodeURIComponent(t('settings.support_email_subject'));
  const body = encodeURIComponent(t('settings.support_email_body'));
  return `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
}

export default function HelpSettingsScreen() {
  const styles = useThemedStyles(makeStyles);

  const handleEmailPress = async () => {
    try {
      await Linking.openURL(buildSupportMailto());
    } catch {
      Alert.alert(
        t('settings.contact_support'),
        `${t('settings.support_email_fallback')}\n${SUPPORT_EMAIL}`,
      );
    }
  };

  return (
    <HeaderScrollScreen
      header={<SettingsHeader title={t('settings.support_title')} />}
      contentContainerStyle={styles.content}
    >
      <TouchableOpacity
        style={styles.card}
        onPress={handleEmailPress}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={t('settings.contact_support')}
      >
        <View style={styles.emailSection}>
          <Text style={styles.label}>{t('settings.contact_support')}</Text>
          <Text style={styles.email}>{SUPPORT_EMAIL}</Text>
          <Text style={styles.hint}>{t('settings.support_tap_hint')}</Text>
        </View>
      </TouchableOpacity>
    </HeaderScrollScreen>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    content: {
      paddingHorizontal: PAGE_HORIZONTAL_PADDING,
    },
    card: {
      backgroundColor: c.surface,
      borderRadius: 12,
      padding: 16,
      shadowColor: '#2D2D2A',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.04,
      shadowRadius: 20,
      elevation: 2,
    },
    emailSection: {
      gap: 6,
    },
    label: {
      fontFamily: 'Rubik-Regular',
      fontSize: 14,
      lineHeight: 20,
      color: c.secondaryText,
    },
    email: {
      fontFamily: 'Rubik-Regular',
      fontSize: 16,
      lineHeight: 24,
      color: c.primaryText,
    },
    hint: {
      fontFamily: 'Rubik-Regular',
      fontSize: 13,
      lineHeight: 18,
      color: c.secondaryText,
      marginTop: 4,
    },
  });
