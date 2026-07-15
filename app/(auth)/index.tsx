import React from 'react';
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
import { setTermsAccepted } from '@/services/onboarding';
import { t } from '@/i18n';
import { Colors } from '@/constants/theme';
import {
  ONBOARDING_DESIGN_WIDTH,
  ONBOARDING_COVER_TOP,
  ONBOARDING_PANEL_HEIGHT,
  ONBOARDING_PANEL_RADIUS,
  ONBOARDING_LOGO,
  ONBOARDING_TITLE,
  ONBOARDING_COPY,
  ONBOARDING_BUTTON,
  ONBOARDING_LEGAL,
} from '@/constants/onboarding';

const coverImage = require('@/assets/images/onboarding-cover.png');

export default function OnboardingWelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const sx = width / ONBOARDING_DESIGN_WIDTH;
  const sy = height / 812;

  const coverHeight = ONBOARDING_COVER_TOP * sy;
  const panelHeight = ONBOARDING_PANEL_HEIGHT * sy;
  const panelRadius = ONBOARDING_PANEL_RADIUS * sx;
  const panelTop = coverHeight - panelRadius;
  const buttonTop =
    (ONBOARDING_BUTTON.top - ONBOARDING_COPY.blockTop - ONBOARDING_COPY.blockHeight) * sy;

  const openTerms = () => {
    router.push('/(auth)/terms' as never);
  };

  const handleContinue = () => {
    void setTermsAccepted();
    router.push('/(auth)/email' as never);
  };

  const legalSize = ONBOARDING_LEGAL.size * sx;
  const legalLine = ONBOARDING_LEGAL.line * sy;

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {/* Cover sits behind the sheet — extra height so photo fills the overlap zone */}
      <View style={[styles.cover, { height: coverHeight + panelRadius }]}>
        <Image source={coverImage} style={StyleSheet.absoluteFill} contentFit="cover" />
        <Text
          style={[
            styles.logo,
            {
              top: ONBOARDING_LOGO.top * sy,
              fontSize: ONBOARDING_LOGO.fontSize * sx,
              lineHeight: ONBOARDING_LOGO.lineHeight * sy,
              color: '#1F2937',
            },
          ]}
        >
          petto
        </Text>
      </View>

      {/* White sheet — absolute so rounded corners reveal the cover underneath */}
      <View
        style={[
          styles.panel,
          {
            top: panelTop,
            minHeight: panelHeight,
            borderTopLeftRadius: panelRadius,
            borderTopRightRadius: panelRadius,
            paddingTop: ONBOARDING_COPY.blockTop * sy,
            paddingHorizontal: ONBOARDING_BUTTON.left * sx,
            paddingBottom: Math.max(24 * sy, insets.bottom + 8),
          },
        ]}
      >
        <View
          style={[
            styles.copyBlock,
            {
              width: ONBOARDING_COPY.blockWidth * sx,
              gap: ONBOARDING_COPY.gap * sy,
            },
          ]}
        >
          <Text
            style={[
              styles.panelTitle,
              {
                fontSize: ONBOARDING_COPY.titleSize * sx,
                lineHeight: ONBOARDING_COPY.titleLine * sy,
              },
            ]}
          >
            {t('onboarding.title')}
          </Text>
          <Text
            style={[
              styles.subtitle,
              {
                fontSize: 12 * sx,
                lineHeight: 16 * sy,
              },
            ]}
          >
            {t('onboarding.subtitle')}
          </Text>
        </View>

        <Pressable
          style={[
            styles.button,
            {
              marginTop: buttonTop,
              width: ONBOARDING_BUTTON.width * sx,
              height: ONBOARDING_BUTTON.height * sy,
              borderRadius: ONBOARDING_BUTTON.radius * sx,
            },
          ]}
          onPress={handleContinue}
          accessibilityRole="button"
        >
          <Text style={[styles.buttonText, { fontSize: 16 * sx }]}>{t('onboarding.continue')}</Text>
        </Pressable>

        <View style={styles.legalSpacer} />

        <Pressable
          onPress={openTerms}
          hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel={t('onboarding.terms_link_a11y')}
          style={styles.legalPressable}
        >
          <Text style={[styles.legal, { fontSize: legalSize, lineHeight: legalLine }]}>
            {t('onboarding.legal_prefix')}{' '}
            <Text style={styles.legalBold}>{t('onboarding.terms')}</Text>
            {' '}
            {t('onboarding.legal_and')}{' '}
            <Text style={styles.legalBold}>{t('onboarding.privacy')}</Text>
            .
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  cover: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
    zIndex: 0,
  },
  logo: {
    position: 'absolute',
    alignSelf: 'center',
    width: '100%',
    fontFamily: 'Rubik-Regular',
    fontWeight: '400',
    textAlign: 'center',
    letterSpacing: 0,
  },
  panel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    alignItems: 'center',
  },
  copyBlock: {
    alignItems: 'center',
  },
  panelTitle: {
    fontFamily: 'Rubik-Regular',
    fontWeight: '400',
    textAlign: 'center',
    letterSpacing: 0,
    color: '#1F2937',
  },
  subtitle: {
    fontFamily: 'Rubik-Regular',
    fontWeight: '400',
    color: Colors.secondaryText,
    textAlign: 'center',
    letterSpacing: 0,
  },
  button: {
    backgroundColor: ONBOARDING_BUTTON.bg,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  buttonText: {
    fontFamily: 'Rubik-Medium',
    color: '#FFFFFF',
  },
  legalSpacer: {
    flex: 1,
    minHeight: 8,
  },
  legalPressable: {
    width: '100%',
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  legal: {
    fontFamily: 'Rubik-Regular',
    fontWeight: '400',
    color: ONBOARDING_LEGAL.color,
    textAlign: 'center',
    letterSpacing: 0,
  },
  legalBold: {
    fontFamily: 'Rubik-Medium',
    fontWeight: '700',
    color: ONBOARDING_LEGAL.boldColor,
  },
});
