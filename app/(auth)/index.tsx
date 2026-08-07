import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WelcomePhotoMarquee } from '@/components/auth/WelcomePhotoMarquee';
import { setTermsAccepted } from '@/services/onboarding';
import { t } from '@/i18n';
import { type ThemeColors } from '@/constants/theme';
import { useThemedStyles, useTheme } from '@/context/ThemeContext';

/** Figma welcome frame (360×812). */
const DESIGN_WIDTH = 360;
const DESIGN_HEIGHT = 812;
/** Wordmark asset intrinsic size (peto-wordmark.png). */
const LOGO = { w: 146, h: 52 } as const;
const CARD = {
  width: 335,
  top: 434,
  /** Equal side inset in the design (was left:20 / right:5 — looked shifted right). */
  sidePad: 12.5,
  radius: 38,
  paddingV: 38,
  paddingH: 20,
  gap: 32,
} as const;

export default function OnboardingWelcomeScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const sx = width / DESIGN_WIDTH;
  const sy = height / DESIGN_HEIGHT;

  const layout = useMemo(() => {
    const sidePad = Math.max(CARD.sidePad * sx, insets.left, insets.right, 16);
    const cardWidth = Math.min(CARD.width * sx, width - sidePad * 2);
    const cardTop = Math.min(
      CARD.top * sy,
      height - 320 * sy - Math.max(insets.bottom, 16),
    );
    const logoH = 48 * sx;
    const logoW = logoH * (LOGO.w / LOGO.h);
    return {
      sidePad,
      cardWidth,
      cardTop,
      radius: CARD.radius * sx,
      paddingV: CARD.paddingV * sy,
      paddingH: CARD.paddingH * sx,
      gap: CARD.gap * sy,
      logoW,
      logoH,
      titleSize: 24 * sx,
      titleLine: 28 * sy,
      subtitleSize: 14 * sx,
      subtitleLine: 20 * sy,
      subtitleMaxW: Math.min(233 * sx, cardWidth - CARD.paddingH * sx * 2),
      buttonH: 48 * sy,
      buttonRadius: 12 * sx,
      buttonFont: 16 * sx,
      buttonLine: 24 * sy,
      legalFont: 10 * sx,
      legalLine: 16 * sy,
      copyGap: 16 * sy,
      actionsGap: 16 * sy,
      textGap: 8 * sy,
    };
  }, [width, height, sx, sy, insets.left, insets.right, insets.bottom]);

  const openTerms = () => {
    router.push('/(auth)/terms' as never);
  };

  const handleContinue = () => {
    void setTermsAccepted();
    router.push('/(auth)/email' as never);
  };

  return (
    <View style={styles.root}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <WelcomePhotoMarquee />

      {/* Full-width dock centers the card on every device / notch / RTL. */}
      <View
        style={[
          styles.cardDock,
          {
            top: layout.cardTop,
            paddingHorizontal: layout.sidePad,
            paddingBottom: Math.max(insets.bottom, 8),
          },
        ]}
      >
        <View
          style={[
            styles.card,
            {
              width: layout.cardWidth,
              borderRadius: layout.radius,
              paddingTop: layout.paddingV,
              paddingBottom: layout.paddingV,
              paddingHorizontal: layout.paddingH,
              gap: layout.gap,
            },
          ]}
        >
          <View style={[styles.copyBlock, { gap: layout.copyGap }]}>
            <Image
              source={require('@/assets/images/peto-wordmark.png')}
              style={{ width: layout.logoW, height: layout.logoH }}
              contentFit="contain"
              accessibilityLabel="Ragly"
            />
            <View style={{ gap: layout.textGap, alignItems: 'center', width: '100%' }}>
              <Text
                style={[
                  styles.title,
                  {
                    fontSize: layout.titleSize,
                    lineHeight: layout.titleLine,
                  },
                ]}
              >
                {t('onboarding.title')}
              </Text>
              <Text
                style={[
                  styles.subtitle,
                  {
                    fontSize: layout.subtitleSize,
                    lineHeight: layout.subtitleLine,
                    maxWidth: layout.subtitleMaxW,
                  },
                ]}
              >
                {t('onboarding.subtitle')}
              </Text>
            </View>
          </View>

          <View style={[styles.actions, { gap: layout.actionsGap }]}>
            <Pressable
              style={[
                styles.button,
                {
                  height: layout.buttonH,
                  borderRadius: layout.buttonRadius,
                },
              ]}
              onPress={handleContinue}
              accessibilityRole="button"
            >
              <Text
                style={[
                  styles.buttonText,
                  { fontSize: layout.buttonFont, lineHeight: layout.buttonLine },
                ]}
              >
                {t('onboarding.continue')}
              </Text>
            </Pressable>

            <Pressable
              onPress={openTerms}
              hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel={t('onboarding.terms_link_a11y')}
            >
              <Text
                style={[
                  styles.legal,
                  { fontSize: layout.legalFont, lineHeight: layout.legalLine },
                ]}
              >
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
    </View>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: c.background,
    },
    cardDock: {
      position: 'absolute',
      left: 0,
      right: 0,
      zIndex: 2,
      alignItems: 'center',
    },
    card: {
      backgroundColor: c.surface,
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
    title: {
      fontFamily: 'Rubik-Regular',
      fontWeight: '400',
      color: c.primaryText,
      textAlign: 'center',
      letterSpacing: 0,
      width: '100%',
    },
    subtitle: {
      fontFamily: 'Rubik-Regular',
      fontWeight: '400',
      color: c.secondaryText,
      textAlign: 'center',
      letterSpacing: 0,
    },
    actions: {
      width: '100%',
      alignItems: 'center',
    },
    button: {
      width: '100%',
      backgroundColor: c.button.primaryBg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    buttonText: {
      fontFamily: 'Rubik-Medium',
      fontWeight: '500',
      color: c.button.primaryText,
    },
    legal: {
      fontFamily: 'Rubik-Regular',
      fontWeight: '400',
      color: c.secondaryText,
      textAlign: 'center',
      letterSpacing: 0,
    },
    legalLink: {
      fontFamily: 'Rubik-Medium',
      fontWeight: '500',
      color: c.secondaryText,
    },
  });
