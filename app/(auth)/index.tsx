import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WelcomePhotoMarquee } from '@/components/auth/WelcomePhotoMarquee';
import { setTermsAccepted } from '@/services/onboarding';
import { t } from '@/i18n';
import { type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/context/ThemeContext';

/** Figma welcome frame (360-wide collage + floating card). */
const DESIGN_WIDTH = 360;
const CARD = {
  width: 335,
  top: 434,
  left: 20,
  radius: 38,
  paddingV: 38,
  paddingH: 20,
  gap: 32,
} as const;

export default function OnboardingWelcomeScreen() {
  const router = useRouter();
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const sx = width / DESIGN_WIDTH;
  const sy = height / 812;

  const openTerms = () => {
    router.push('/(auth)/terms' as never);
  };

  const handleContinue = () => {
    void setTermsAccepted();
    router.push('/(auth)/email' as never);
  };

  const cardTop = Math.min(CARD.top * sy, height - 360 * sy - insets.bottom);

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <WelcomePhotoMarquee />

      <View
        style={[
          styles.card,
          {
            top: cardTop,
            left: CARD.left * sx,
            width: CARD.width * sx,
            borderRadius: CARD.radius * sx,
            paddingTop: CARD.paddingV * sy,
            paddingBottom: CARD.paddingV * sy,
            paddingHorizontal: CARD.paddingH * sx,
            gap: CARD.gap * sy,
          },
        ]}
      >
        <View style={[styles.copyBlock, { gap: 16 * sy }]}>
          <Text
            style={[
              styles.brand,
              {
                fontSize: 48 * sx,
                lineHeight: 52 * sy,
              },
            ]}
          >
            Peto
          </Text>
          <View style={{ gap: 8 * sy, alignItems: 'center' }}>
            <Text
              style={[
                styles.title,
                {
                  fontSize: 24 * sx,
                  lineHeight: 28 * sy,
                },
              ]}
            >
              {t('onboarding.title')}
            </Text>
            <Text
              style={[
                styles.subtitle,
                {
                  fontSize: 14 * sx,
                  lineHeight: 20 * sy,
                },
              ]}
            >
              {t('onboarding.subtitle')}
            </Text>
          </View>
        </View>

        <View style={[styles.actions, { gap: 16 * sy }]}>
          <Pressable
            style={[
              styles.button,
              {
                height: 48 * sy,
                borderRadius: 12 * sx,
              },
            ]}
            onPress={handleContinue}
            accessibilityRole="button"
          >
            <Text style={[styles.buttonText, { fontSize: 16 * sx, lineHeight: 24 * sy }]}>
              {t('onboarding.continue')}
            </Text>
          </Pressable>

          <Pressable
            onPress={openTerms}
            hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel={t('onboarding.terms_link_a11y')}
          >
            <Text style={[styles.legal, { fontSize: 10 * sx, lineHeight: 16 * sy }]}>
              {t('onboarding.legal_prefix')}{' '}
              <Text style={styles.legalLink}>{t('onboarding.terms')}</Text>
              {' '}
              {t('onboarding.legal_and')}{' '}
              <Text style={styles.legalLink}>{t('onboarding.privacy')}</Text>
              .
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const makeStyles = (_c: ThemeColors) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: '#F3EDE8',
    },
    card: {
      position: 'absolute',
      zIndex: 2,
      backgroundColor: '#FFFFFF',
      alignItems: 'center',
      shadowColor: '#D1A796',
      shadowOffset: { width: 0, height: -3 },
      shadowOpacity: 0.1,
      shadowRadius: 27,
      elevation: 8,
    },
    copyBlock: {
      alignItems: 'center',
      width: '100%',
    },
    brand: {
      fontFamily: 'Rubik-Regular',
      fontWeight: '400',
      color: '#004741',
      textAlign: 'center',
      letterSpacing: 0,
    },
    title: {
      fontFamily: 'Rubik-Regular',
      fontWeight: '400',
      color: '#1F2937',
      textAlign: 'center',
      letterSpacing: 0,
    },
    subtitle: {
      fontFamily: 'Rubik-Regular',
      fontWeight: '400',
      color: '#6B7280',
      textAlign: 'center',
      letterSpacing: 0,
      maxWidth: 233,
    },
    actions: {
      width: '100%',
      alignItems: 'center',
    },
    button: {
      width: '100%',
      backgroundColor: '#004741',
      alignItems: 'center',
      justifyContent: 'center',
    },
    buttonText: {
      fontFamily: 'Rubik-Medium',
      fontWeight: '500',
      color: '#FFFFFF',
    },
    legal: {
      fontFamily: 'Rubik-Regular',
      fontWeight: '400',
      color: '#6B7280',
      textAlign: 'center',
      letterSpacing: 0,
    },
    legalLink: {
      fontFamily: 'Rubik-Medium',
      fontWeight: '500',
      color: '#6B7280',
    },
  });
