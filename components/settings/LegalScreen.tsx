import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { type ThemeColors } from '@/constants/theme';
import { useColors, useThemedStyles } from '@/context/ThemeContext';
import { t, currentLocale } from '@/i18n';
import SettingsHeader from '@/components/settings/SettingsHeader';
import ListScrollLayout from '@/components/ui/ListScrollLayout';
import { LIST_HEADER_CONTENT_GAP, PAGE_HORIZONTAL_PADDING } from '@/constants/layout';

export type LegalBlock =
  | { type: 'intro'; text: string; gap?: number }
  | { type: 'heading'; text: string }
  | { type: 'body'; text: string; gap?: number };

interface LegalScreenProps {
  title: string;
  /** ISO date of the last content update — rendered localized (month + year). */
  lastUpdatedISO: string;
  blocks: LegalBlock[];
}

function formatUpdated(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  try {
    return date.toLocaleDateString(currentLocale, { month: 'long', year: 'numeric' });
  } catch {
    return date.toISOString().slice(0, 7);
  }
}

export default function LegalScreen({ title, lastUpdatedISO, blocks }: LegalScreenProps) {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);

  return (
    <ListScrollLayout
      fadeKey={`legal:${title}`}
      edges={[]}
      backgroundColor={colors.surface}
      fadeColor={colors.surface}
      chrome={<SettingsHeader title={title} backgroundColor={colors.surface} />}
      documentFade
      topFade
      bottomFade
      contentGap={LIST_HEADER_CONTENT_GAP}
    >
      {({ paddingTop, paddingBottom, scrollMetricsProps }) => (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingTop, paddingBottom }]}
          showsVerticalScrollIndicator={false}
          contentInsetAdjustmentBehavior="never"
          automaticallyAdjustContentInsets={false}
          automaticallyAdjustsScrollIndicatorInsets={false}
          onLayout={scrollMetricsProps.onLayout}
          onContentSizeChange={scrollMetricsProps.onContentSizeChange}
        >
          <Text style={styles.docTitle}>{title}</Text>
          <Text style={styles.updated}>
            {t('settings.last_updated')}: {formatUpdated(lastUpdatedISO)}
          </Text>
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
              <View key={index} style={styles.block}>
                {lines.map((line, lineIndex) => (
                  <Text key={lineIndex} style={styles.paragraph}>
                    {line}
                  </Text>
                ))}
              </View>
            );
          })}
        </ScrollView>
      )}
    </ListScrollLayout>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: PAGE_HORIZONTAL_PADDING,
      gap: 8,
    },
    docTitle: {
      fontFamily: 'Rubik-Medium',
      fontSize: 16,
      lineHeight: 20,
      color: c.primaryText,
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
    block: {
      gap: 3,
      marginBottom: 12,
    },
    paragraph: {
      fontFamily: 'Rubik-Regular',
      fontSize: 14,
      lineHeight: 22,
      color: c.primaryText,
    },
  });
