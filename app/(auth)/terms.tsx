import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { t, currentLocale } from '@/i18n';
import { Spacing, type ThemeColors } from '@/constants/theme';
import {
  LIST_HEADER_CONTENT_GAP,
  LIST_HEADER_TABS_GAP,
  PAGE_HORIZONTAL_PADDING,
} from '@/constants/layout';
import { useColors, useThemedStyles } from '@/context/ThemeContext';
import {
  LEGAL_LAST_UPDATED_ISO,
  privacyPolicyBlocks,
  termsOfServiceBlocks,
} from '@/constants/legalContent';
import type { LegalBlock } from '@/components/settings/LegalScreen';
import ListScrollLayout from '@/components/ui/ListScrollLayout';

type Tab = 'terms' | 'privacy';

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
  const [tab, setTab] = useState<Tab>('terms');

  const blocks = useMemo(
    () => (tab === 'terms' ? termsOfServiceBlocks() : privacyPolicyBlocks()),
    [tab],
  );

  return (
    <ListScrollLayout
      fadeKey={`auth-legal:${tab}`}
      backgroundColor={colors.surface}
      fadeColor={colors.surface}
      contentGap={LIST_HEADER_CONTENT_GAP}
      documentFade
      chrome={
        <>
          <View style={styles.headerRow}>
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
        </>
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
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: PAGE_HORIZONTAL_PADDING,
      paddingVertical: Spacing.sm,
      backgroundColor: c.surface,
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
      paddingHorizontal: PAGE_HORIZONTAL_PADDING,
      marginTop: LIST_HEADER_TABS_GAP,
      gap: 8,
      backgroundColor: c.surface,
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
