import React, { useMemo } from 'react';
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
import RaglyWordmark, { RAGLY_WORDMARK } from '@/components/brand/RaglyWordmark';
import { setTermsAccepted } from '@/services/onboarding';
import { t } from '@/i18n';
import { type ThemeColors } from '@/constants/theme';
import { useColors, useThemedStyles, useTheme } from '@/context/ThemeContext';

/** Figma welcome frame (360×812). */
const DESIGN_WIDTH = 360;
const DESIGN_HEIGHT = 812;
const LOGO = RAGLY_WORDMARK;
const CARD = {
  width: 335,
  /** Equal side inset so the card doesn’t kiss the screen edges. */
  sidePad: 12.5,
  radius: 38,
  paddingV: 38,
  paddingH: 20,
  gap: 32,
} as const;

export default function OnboardingWelcomeScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const sx = width / DESIGN_WIDTH;
  const sy = height / DESIGN_HEIGHT;

  const layout = useMemo(() => {
    // Keep side breathing room on notched / narrow phones.
    const sidePad = Math.max(CARD.sidePad * sx, insets.left, insets.right, 16);
    const bottomPad = Math.max(insets.bottom, 16);
    const cardWidth = Math.min(CARD.width * sx, width - sidePad * 2);
    const paddingH = Math.max(CARD.paddingH * sx, 16);
    // Full content width so subtitle stays ~2 lines (old 233px cap forced 3 on iPhone).
    const copyWidth = Math.max(cardWidth - paddingH * 2, 0);
    const compact = height < 740;
    const logoH = (compact ? 40 : 48) * sx;
    const logoW = logoH * (LOGO.width / LOGO.height);
    return {
      sidePad,
      bottomPad,
      cardWidth,
      radius: CARD.radius * sx,
      paddingV: (compact ? 28 : CARD.paddingV) * sy,
      paddingH,
      gap: (compact ? 24 : CARD.gap) * sy,
      logoW,
      logoH,
      copyWidth,
      titleSize: 24 * sx,
      titleLine: 28 * sx,
      subtitleSize: 14 * sx,
      subtitleLine: 20 * sx,
      buttonH: Math.max(48 * sy, 48),
      buttonRadius: 12 * sx,
      buttonFont: 16 * sx,
      buttonLine: 24 * sx,
      legalFont: Math.max(10 * sx, 10),
      legalLine: Math.max(14 * sx, 14),
      copyGap: (compact ? 12 : 16) * sy,
      actionsGap: (compact ? 12 : 16) * sy,
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

      {/* Bottom-docked so the card floats above the home indicator on every phone. */}
      <View
        style={[
          styles.cardDock,
          {
            paddingHorizontal: layout.sidePad,
            paddingBottom: layout.bottomPad,
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
          <View style={[styles.copyBlock, { gap: layout.copyGap, width: layout.copyWidth }]}>
            <RaglyWordmark
              width={layout.logoW}
              height={layout.logoH}
              color={colors.brandDark}
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
                    width: '100%',
                  },
                ]}
              >
                {t('onboarding.subtitle')}
              </Text>
            </View>
          </View>

          <View style={[styles.actions, { gap: layout.actionsGap, width: layout.copyWidth }]}>
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
              style={styles.legalPress}
            >
              <Text
                style={[
                  styles.legal,
                  { fontSize: layout.legalFont, lineHeight: layout.legalLine },
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.82}
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
      bottom: 0,
      zIndex: 2,
      alignItems: 'center',
    },
    card: {
      backgroundColor: c.surface,
      alignItems: 'center',
      overflow: 'hidden',
      shadowColor: '#D1A796',
      shadowOffset: { width: 0, height: -3 },
      shadowOpacity: 0.1,
      shadowRadius: 27,
      elevation: 8,
    },
    copyBlock: {
      alignItems: 'center',
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
    legalPress: {
      width: '100%',
      alignItems: 'center',
    },
    legal: {
      fontFamily: 'Rubik-Regular',
      fontWeight: '400',
      color: c.secondaryText,
      textAlign: 'center',
      letterSpacing: 0,
      width: '100%',
    },
    legalLink: {
      fontFamily: 'Rubik-Medium',
      fontWeight: '500',
      color: c.secondaryText,
    },
  });
