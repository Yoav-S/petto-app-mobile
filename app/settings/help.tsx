import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/context/ThemeContext';
import { t } from '@/i18n';
import SettingsHeader from '@/components/settings/SettingsHeader';

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
    // Do not gate on canOpenURL — Android often returns false for mailto even when a mail app works.
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
    <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
      <SettingsHeader title={t('settings.support_title')} />

      <View style={styles.content}>
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
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: c.background,
    },
    content: {
      paddingHorizontal: 20,
      paddingTop: 22,
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
