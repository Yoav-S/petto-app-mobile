import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/context/ThemeContext';
import { t } from '@/i18n';
import SettingsHeader from '@/components/settings/SettingsHeader';

// Sent from this domain today; swap here if the support inbox changes.
const SUPPORT_EMAIL = 'support@peto.casa';

export default function HelpSettingsScreen() {
  const styles = useThemedStyles(makeStyles);

  const handleEmailPress = async () => {
    const url = `mailto:${SUPPORT_EMAIL}`;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert(t('settings.contact_support'), SUPPORT_EMAIL);
      }
    } catch {
      Alert.alert(t('settings.contact_support'), SUPPORT_EMAIL);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <SettingsHeader title={t('settings.support_title')} />

      <View style={styles.content}>
        <View style={styles.card}>
          <View style={styles.emailSection}>
            <Text style={styles.label}>{t('settings.contact_support')}</Text>
            <TouchableOpacity onPress={handleEmailPress} activeOpacity={0.7} accessibilityRole="link">
              <Text style={styles.email}>{SUPPORT_EMAIL}</Text>
            </TouchableOpacity>
          </View>
        </View>
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
  });
