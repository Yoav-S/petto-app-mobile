import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { type ThemeColors } from '@/constants/theme';
import { useColors, useThemedStyles } from '@/context/ThemeContext';
import { t } from '@/i18n';
import SettingsHeader from '@/components/settings/SettingsHeader';
import { HeaderScrollScreen } from '@/components/ui/HeaderScrollLayout';

/** Users write here; Cloudflare forwards to pettoservices@gmail.com. */
const SUPPORT_EMAIL = 'support@ragly.cloud';

function buildSupportMailto(): string {
  const subject = encodeURIComponent(t('settings.support_email_subject'));
  const body = encodeURIComponent(t('settings.support_email_body'));
  return `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
}

export default function HelpSettingsScreen() {
  const colors = useColors();
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
      header={<SettingsHeader title={t('settings.support_title')} rounded />}
      contentGap={4}
      chromePaddingBottom={0}
      contentContainerStyle={styles.content}
    >
      <View style={styles.card}>
        <View style={styles.block}>
          <Text style={styles.label}>{t('settings.contact_support')}</Text>
          <TouchableOpacity
            style={styles.emailRow}
            onPress={handleEmailPress}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={t('settings.contact_support')}
          >
            <Ionicons name="mail-outline" size={24} color={colors.primaryText} />
            <Text style={styles.email} numberOfLines={1}>
              {SUPPORT_EMAIL}
            </Text>
          </TouchableOpacity>
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
    },
    block: {
      gap: 6,
    },
    label: {
      fontFamily: 'Rubik-Regular',
      fontSize: 14,
      lineHeight: 20,
      color: c.secondaryText,
    },
    emailRow: {
      height: 56,
      boxSizing: 'border-box',
      borderRadius: 16,
      padding: 16,
      backgroundColor: c.background,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    email: {
      flexShrink: 1,
      fontFamily: 'Rubik-Regular',
      fontSize: 16,
      lineHeight: 24,
      color: c.primaryText,
    },
  });
