import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
  type Edge,
} from 'react-native-safe-area-context';
import {
  HEADER_CONTENT_GAP,
  HEADER_SCROLL_GAP,
  SCROLL_FADE_BAND,
} from '@/constants/layout';
import { type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/context/ThemeContext';
import ScrollBottomFade from '@/components/ui/ScrollBottomFade';
import ScrollTopFade from '@/components/ui/ScrollTopFade';

export interface HeaderScrollInsets {
  /** Padding for scroll content below the floating title row. */
  paddingTop: number;
  paddingBottom: number;
}

interface HeaderScrollLayoutProps {
  header: React.ReactNode;
  children: (insets: HeaderScrollInsets) => React.ReactNode;
  edges?: Edge[];
  style?: StyleProp<ViewStyle>;
  /** Soft fade under the title row (content scrolls beneath). */
  topFade?: boolean;
  /** Soft fade over the bottom safe-area / gesture bar. */
  bottomFade?: boolean;
}

/**
 * Floating title row + scroll content underneath — no opaque header chrome.
 * Optional top/bottom fades mask content at the edges (see legal / edit profile).
 */
export default function HeaderScrollLayout({
  header,
  children,
  edges = ['left', 'right'],
  style,
  topFade = true,
  bottomFade = true,
}: HeaderScrollLayoutProps) {
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const [chromeHeight, setChromeHeight] = useState(0);

  const paddingTop = chromeHeight + HEADER_CONTENT_GAP;
  const paddingBottom =
    Math.max(insets.bottom, 8) + (bottomFade ? SCROLL_FADE_BAND : 0);

  return (
    <SafeAreaView style={[styles.safeArea, style]} edges={edges}>
      <View style={styles.body}>
        {children({ paddingTop, paddingBottom })}
        {topFade && chromeHeight > 0 ? (
          <ScrollTopFade height={chromeHeight + SCROLL_FADE_BAND} />
        ) : null}
        {bottomFade ? <ScrollBottomFade /> : null}
        <View
          style={styles.chrome}
          onLayout={(e) => setChromeHeight(e.nativeEvent.layout.height)}
          pointerEvents="box-none"
        >
          {header}
        </View>
      </View>
    </SafeAreaView>
  );
}

interface HeaderScrollScreenProps {
  header: React.ReactNode;
  children: React.ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
  edges?: Edge[];
  topFade?: boolean;
  bottomFade?: boolean;
}

/** Convenience wrapper: header + vertical ScrollView with standard insets. */
export function HeaderScrollScreen({
  header,
  children,
  contentContainerStyle,
  edges = ['left', 'right'],
  topFade = true,
  bottomFade = true,
}: HeaderScrollScreenProps) {
  return (
    <HeaderScrollLayout
      header={header}
      edges={edges}
      topFade={topFade}
      bottomFade={bottomFade}
    >
      {({ paddingTop, paddingBottom }) => (
        <ScrollView
          style={stylesScroll.scroll}
          contentContainerStyle={[
            { paddingTop, paddingBottom: paddingBottom + 16 },
            contentContainerStyle,
          ]}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      )}
    </HeaderScrollLayout>
  );
}

const stylesScroll = StyleSheet.create({
  scroll: {
    flex: 1,
  },
});

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: c.background,
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
      zIndex: 4,
      paddingBottom: HEADER_SCROLL_GAP,
    },
  });
