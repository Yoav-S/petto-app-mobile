import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/context/ThemeContext';
import { t, currentLocale } from '@/i18n';
import SettingsHeader from '@/components/settings/SettingsHeader';
import HeaderScrollLayout from '@/components/ui/HeaderScrollLayout';
import { PAGE_HORIZONTAL_PADDING } from '@/constants/layout';

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

function TextBlock({
  text,
  gap = 3,
  style,
}: {
  text: string;
  gap?: number;
  style: object;
}) {
  const lines = text.split('\n');
  return (
    <View style={{ gap }}>
      {lines.map((line, index) => (
        <Text key={index} style={style}>
          {line}
        </Text>
      ))}
    </View>
  );
}

export default function LegalScreen({ title, lastUpdatedISO, blocks }: LegalScreenProps) {
  const styles = useThemedStyles(makeStyles);

  return (
    <HeaderScrollLayout header={<SettingsHeader title={title} />} bottomFade>
      {({ paddingTop, paddingBottom }) => (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop,
              paddingBottom: paddingBottom + 30,
            },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
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
              return (
                <TextBlock
                  key={index}
                  text={block.text}
                  gap={block.gap}
                  style={styles.paragraph}
                />
              );
            })}
          </View>
        </ScrollView>
      )}
    </HeaderScrollLayout>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: PAGE_HORIZONTAL_PADDING,
    },
    card: {
      backgroundColor: c.surface,
      borderRadius: 12,
      padding: 16,
      gap: 12,
      shadowColor: '#2D2D2A',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.04,
      shadowRadius: 20,
      elevation: 2,
    },
    docTitle: {
      fontFamily: 'Rubik-Medium',
      fontSize: 16,
      lineHeight: 20,
      letterSpacing: 0,
      color: c.primaryText,
    },
    updated: {
      fontFamily: 'Rubik-Regular',
      fontSize: 14,
      lineHeight: 20,
      letterSpacing: 0,
      color: c.secondaryText,
    },
    heading: {
      fontFamily: 'Rubik-Medium',
      fontSize: 16,
      lineHeight: 20,
      letterSpacing: 0,
      color: c.primaryText,
    },
    paragraph: {
      fontFamily: 'Rubik-Regular',
      fontSize: 16,
      lineHeight: 24,
      letterSpacing: 0,
      color: c.primaryText,
    },
  });
