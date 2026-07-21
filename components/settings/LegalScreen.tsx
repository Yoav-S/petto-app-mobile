import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { type ThemeColors } from '@/constants/theme';
import { useColors, useThemedStyles } from '@/context/ThemeContext';
import { t, currentLocale } from '@/i18n';
import SettingsHeader from '@/components/settings/SettingsHeader';

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

/**
 * Dissolves the bottom of the white card into the outer screen background.
 * Taller overlay so the fade starts earlier while scrolling.
 */
function BottomFade() {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  // Earlier, smoother ramp into the page background.
  const stops = [0, 0.12, 0.28, 0.48, 0.7, 0.88, 1];

  return (
    <View style={styles.fade} pointerEvents="none">
      {stops.map((stop, index) => {
        const nextStop = stops[index + 1] ?? 1;
        return (
          <View
            key={stop}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: `${stop * 100}%`,
              height: `${(nextStop - stop) * 100}%`,
              backgroundColor: colors.background,
              opacity: stop,
            }}
          />
        );
      })}
    </View>
  );
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
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <SettingsHeader title={title} />

      <View style={[styles.content, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        <View style={styles.card}>
          <ScrollView
            contentContainerStyle={styles.inner}
            showsVerticalScrollIndicator={false}
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
              return (
                <TextBlock
                  key={index}
                  text={block.text}
                  gap={block.gap}
                  style={styles.paragraph}
                />
              );
            })}
          </ScrollView>

          <BottomFade />
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
      flex: 1,
      paddingHorizontal: 20,
      paddingTop: 22,
    },
    card: {
      flex: 1,
      backgroundColor: c.surface,
      borderRadius: 12,
      padding: 16,
      overflow: 'hidden',
      // box-shadow: 0px 4px 20px 0px #2D2D2A0A
      shadowColor: '#2D2D2A',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.04,
      shadowRadius: 20,
      elevation: 2,
    },
    inner: {
      gap: 12,
      // Keep last lines near the fade / bottom edge.
      paddingBottom: 28,
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
    fade: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      // Start fading earlier while scrolling.
      height: 160,
    },
  });
