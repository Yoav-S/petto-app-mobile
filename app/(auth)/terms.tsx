import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { t, currentLocale } from '@/i18n';
import { Spacing, type ThemeColors } from '@/constants/theme';
import { useColors, useThemedStyles } from '@/context/ThemeContext';
import {
  LEGAL_LAST_UPDATED_ISO,
  privacyPolicyBlocks,
  termsOfServiceBlocks,
} from '@/constants/legalContent';
import type { LegalBlock } from '@/components/settings/LegalScreen';

type Tab = 'terms' | 'privacy';

const TOP_CHROME_RADIUS = 16;
/** Space between tab chrome and scroll content so text slips under the bg, not the buttons. */
const SCROLL_UNDER_MARGIN = 8;

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
  const [tab, setTab] = useState<Tab>('terms');
  const [chromeHeight, setChromeHeight] = useState(0);

  const blocks = useMemo(
    () => (tab === 'terms' ? termsOfServiceBlocks() : privacyPolicyBlocks()),
    [tab],
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.body}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: chromeHeight + SCROLL_UNDER_MARGIN,
              paddingBottom: Math.max(insets.bottom, Spacing.xl) + Spacing.xl,
            },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.updated}>
            {t('settings.last_updated')}: {formatUpdated(LEGAL_LAST_UPDATED_ISO)}
          </Text>
          <Blocks blocks={blocks} styles={styles} />
        </ScrollView>

        <View
          style={styles.chrome}
          onLayout={(e) => setChromeHeight(e.nativeEvent.layout.height)}
          pointerEvents="box-none"
        >
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={24} color={colors.primaryText} />
            </Pressable>
            <Text style={styles.headerTitle}>{t('onboarding.terms_screen_title')}</Text>
            <View style={styles.backBtn} />
          </View>

          <View style={styles.tabs}>
            <Pressable
              style={[styles.tab, tab === 'terms' && styles.tabActive]}
              onPress={() => setTab('terms')}
            >
              <Text style={[styles.tabText, tab === 'terms' && styles.tabTextActive]}>
                {t('settings.terms')}
              </Text>
            </Pressable>
            <Pressable
              style={[styles.tab, tab === 'privacy' && styles.tabActive]}
              onPress={() => setTab('privacy')}
            >
              <Text style={[styles.tabText, tab === 'privacy' && styles.tabTextActive]}>
                {t('settings.privacy')}
              </Text>
            </Pressable>
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
      backgroundColor: c.surface,
    },
    body: {
      flex: 1,
      position: 'relative',
    },
    chrome: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 2,
      backgroundColor: c.surface,
      borderBottomLeftRadius: TOP_CHROME_RADIUS,
      borderBottomRightRadius: TOP_CHROME_RADIUS,
      paddingBottom: Spacing.sm,
      // Soft lift so scrolling text disappears under the chrome, not into the tabs.
      shadowColor: '#1E1E1E',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 10,
      elevation: 4,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
    },
    backBtn: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      fontFamily: 'Rubik-Medium',
      fontSize: 16,
      color: c.primaryText,
    },
    tabs: {
      flexDirection: 'row',
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.xs,
      gap: 8,
    },
    tab: {
      flex: 1,
      height: 40,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.inactiveControl,
    },
    tabActive: {
      backgroundColor: c.brand,
    },
    tabText: {
      fontFamily: 'Rubik-Medium',
      fontSize: 14,
      color: c.primaryText,
    },
    tabTextActive: {
      color: c.button.primaryText,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: Spacing.xl,
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
