import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { t, currentLocale } from '@/i18n';
import { type ThemeColors } from '@/constants/theme';
import {
  LEGAL_TAB_BAR,
  LEGAL_TABS_TOP_FADE_GRADIENT,
  PAGE_HORIZONTAL_PADDING,
} from '@/constants/layout';
import HeaderIconButton, { HEADER_ICON_BTN } from '@/components/ui/HeaderIconButton';
import { useColors, useThemedStyles } from '@/context/ThemeContext';
import { useThemedStatusBar } from '@/context/SystemBarsContext';
import {
  LEGAL_LAST_UPDATED_ISO,
  privacyPolicyBlocks,
  termsOfServiceBlocks,
} from '@/constants/legalContent';
import type { LegalBlock } from '@/components/settings/LegalScreen';
import ListScrollLayout from '@/components/ui/ListScrollLayout';

type Tab = 'terms' | 'privacy';

const TABS: { key: Tab; labelKey: string }[] = [
  { key: 'terms', labelKey: 'onboarding.tab_terms' },
  { key: 'privacy', labelKey: 'onboarding.tab_privacy' },
];

function formatUpdated(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  try {
    return date.toLocaleDateString(currentLocale, {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

function Blocks({ blocks, styles }: { blocks: LegalBlock[]; styles: ReturnType<typeof makeStyles> }) {
  return (
    <>
      {blocks.map((block, index) => {
        if (block.type === 'heading') {
          return (
            <Text key={index} style={styles.heading}>
              {block.text}
            </Text>
          );
        }
        const lines = block.text.split('\n');
        return (
          <View key={index} style={{ gap: block.gap ?? 3, marginBottom: 12 }}>
            {lines.map((line, lineIndex) => (
              <Text key={lineIndex} style={styles.paragraph}>
                {line}
              </Text>
            ))}
          </View>
        );
      })}
    </>
  );
}

export default function TermsScreen() {
  const router = useRouter();
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  useThemedStatusBar();
  const [tab, setTab] = useState<Tab>('terms');

  const blocks = useMemo(
    () => (tab === 'terms' ? termsOfServiceBlocks() : privacyPolicyBlocks()),
    [tab],
  );

  /** Header swallows the status bar before the back chip starts. */
  const headerTopPad = Math.max(insets.top, LEGAL_TAB_BAR.statusCover);

  return (
    <ListScrollLayout
      fadeKey={`auth-legal:${tab}`}
      backgroundColor={colors.surface}
      fadeColor={colors.surface}
      topFadeHeight={LEGAL_TABS_TOP_FADE_GRADIENT}
      clearTopFade
      documentFade
      chrome={
        <View style={[styles.header, { paddingTop: headerTopPad }]}>
          <View style={styles.backRow}>
            <HeaderIconButton
              onPress={() => router.back()}
              accessibilityLabel={t('petOnboarding.back')}
            >
              <Ionicons
                name="chevron-back"
                size={HEADER_ICON_BTN.iconSize}
                color={colors.primaryText}
              />
            </HeaderIconButton>
          </View>

          <View style={styles.tabBar}>
            {TABS.map(({ key, labelKey }) => {
              const active = tab === key;
              return (
                <Pressable
                  key={key}
                  style={[styles.tab, active && styles.tabActive]}
                  onPress={() => setTab(key)}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active }}
                >
                  <Text
                    style={[styles.tabText, active && styles.tabTextActive]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.8}
                  >
                    {t(labelKey)}
                  </Text>
                  {active ? <View style={styles.tabIndicator} /> : null}
                </Pressable>
              );
            })}
          </View>
        </View>
      }
    >
      {({ paddingTop, paddingBottom, scrollMetricsProps }) => (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingTop, paddingBottom }]}
          showsVerticalScrollIndicator={false}
          onLayout={scrollMetricsProps.onLayout}
          onContentSizeChange={scrollMetricsProps.onContentSizeChange}
        >
          <Text style={styles.updated}>
            {t('settings.last_updated')}: {formatUpdated(LEGAL_LAST_UPDATED_ISO)}
          </Text>
          <Blocks blocks={blocks} styles={styles} />
        </ScrollView>
      )}
    </ListScrollLayout>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    /** Flush with the top edge; its fill is also the inactive tab's fill. */
    header: {
      backgroundColor: c.background,
      borderTopLeftRadius: LEGAL_TAB_BAR.radius,
      borderTopRightRadius: LEGAL_TAB_BAR.radius,
    },
    /** `flex-start` follows the reading direction, so the chip flips in RTL. */
    backRow: {
      alignItems: 'flex-start',
      paddingHorizontal: PAGE_HORIZONTAL_PADDING,
      paddingBottom: LEGAL_TAB_BAR.backRowGap,
    },
    tabBar: {
      flexDirection: 'row',
    },
    tab: {
      flex: 1,
      height: LEGAL_TAB_BAR.rowHeight,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 12,
    },
    /** Active half matches the page so it reads as the open tab. */
    tabActive: {
      backgroundColor: c.surface,
    },
    tabText: {
      fontFamily: 'Rubik-Medium',
      fontSize: 14,
      lineHeight: 18,
      color: c.tabInactiveText,
    },
    tabTextActive: {
      color: c.primaryText,
    },
    tabIndicator: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      height: 2,
      backgroundColor: c.brand,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: PAGE_HORIZONTAL_PADDING,
      gap: 8,
    },
    updated: {
      fontFamily: 'Rubik-Regular',
      fontSize: 14,
      lineHeight: 20,
      color: c.secondaryText,
      marginBottom: 8,
    },
    heading: {
      fontFamily: 'Rubik-Medium',
      fontSize: 16,
      lineHeight: 20,
      color: c.primaryText,
      marginTop: 8,
      marginBottom: 4,
    },
    paragraph: {
      fontFamily: 'Rubik-Regular',
      fontSize: 14,
      lineHeight: 22,
      color: c.primaryText,
    },
  });
