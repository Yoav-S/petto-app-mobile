import React, { useMemo, useState } from 'react';
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
  HEADER_CHROME_BOTTOM_RADIUS,
  HEADER_CONTENT_GAP,
  HEADER_SCROLL_GAP,
  SCROLL_BOTTOM_FADE_GRADIENT,
  SCROLL_DOCUMENT_BOTTOM_FADE_GRADIENT,
  SCROLL_DOCUMENT_TOP_FADE_GRADIENT,
  SCROLL_TOP_FADE_GRADIENT,
} from '@/constants/layout';
import { type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/context/ThemeContext';
import { useKeyboardOpen } from '@/components/ui/keyboardUtils';
import ScrollEdgeFades from '@/components/ui/ScrollEdgeFades';
import {
  ScrollFadeMetricsProvider,
  hasActiveScrollOverflow,
  useScrollFadeMetricsState,
} from '@/components/ui/scrollFadeMetrics';

export interface HeaderScrollInsets {
  paddingTop: number;
  paddingBottom: number;
  fadeBottomInset: number;
  scrollMetricsProps: {
    onLayout: (e: import('react-native').LayoutChangeEvent) => void;
    onContentSizeChange: (w: number, h: number) => void;
  };
}

interface HeaderScrollLayoutProps {
  header: React.ReactNode;
  children: (insets: HeaderScrollInsets) => React.ReactNode;
  edges?: Edge[];
  style?: StyleProp<ViewStyle>;
  /** Only enable on ScrollView-based screens. */
  topFade?: boolean;
  bottomFade?: boolean;
  fadeColor?: string;
  fadeMode?: 'document' | 'form' | 'scroll';
}

export default function HeaderScrollLayout({
  header,
  children,
  edges = ['left', 'right'],
  style,
  topFade = false,
  bottomFade = false,
  fadeColor,
  fadeMode = 'form',
}: HeaderScrollLayoutProps) {
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const keyboardOpen = useKeyboardOpen();
  const [chromeHeight, setChromeHeight] = useState(0);
  const { metrics, reportViewport, reportContent, reportPinnedFooterOverflow } =
    useScrollFadeMetricsState();

  const hasOverflow = hasActiveScrollOverflow(metrics);
  const scrollActive = metrics.viewportHeight > 0;
  const showTopFade = topFade && chromeHeight > 0 && scrollActive && hasOverflow;
  const showBottomFade =
    bottomFade &&
    scrollActive &&
    hasOverflow &&
    !keyboardOpen &&
    (fadeMode === 'document' || fadeMode === 'scroll' || fadeMode === 'form');

  const paddingTop = chromeHeight + HEADER_CONTENT_GAP;
  const paddingBottom = Math.max(insets.bottom, 8);
  const fadeBottomInset =
    fadeMode === 'document' && bottomFade ? SCROLL_BOTTOM_FADE_GRADIENT : 0;

  const fadeContext = useMemo(
    () => ({ reportViewport, reportContent, reportPinnedFooterOverflow }),
    [reportViewport, reportContent, reportPinnedFooterOverflow],
  );

  const scrollMetricsProps = useMemo(
    () => ({
      onLayout: (e: import('react-native').LayoutChangeEvent) => {
        reportViewport(e.nativeEvent.layout.height);
      },
      onContentSizeChange: (_w: number, h: number) => {
        reportContent(h);
      },
    }),
    [reportViewport, reportContent],
  );

  return (
    <SafeAreaView style={[styles.safeArea, style]} edges={edges}>
      <ScrollFadeMetricsProvider value={fadeContext}>
        <View style={styles.body}>
          <View style={styles.scrollSlot}>
            {children({
              paddingTop,
              paddingBottom,
              fadeBottomInset,
              scrollMetricsProps,
            })}
          </View>
          {showTopFade || showBottomFade ? (
            <ScrollEdgeFades
              scrollTop={chromeHeight}
              color={fadeColor}
              showTop={showTopFade}
              showBottom={showBottomFade}
              topHeight={
                fadeMode === 'document'
                  ? SCROLL_DOCUMENT_TOP_FADE_GRADIENT
                  : SCROLL_TOP_FADE_GRADIENT
              }
              bottomHeight={
                fadeMode === 'document'
                  ? SCROLL_DOCUMENT_BOTTOM_FADE_GRADIENT
                  : SCROLL_BOTTOM_FADE_GRADIENT
              }
            />
          ) : null}
          <View
            style={styles.chrome}
            onLayout={(e) => setChromeHeight(e.nativeEvent.layout.height)}
            pointerEvents="box-none"
          >
            {header}
          </View>
        </View>
      </ScrollFadeMetricsProvider>
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
  fadeColor?: string;
  fadeMode?: 'document' | 'form' | 'scroll';
}

export function HeaderScrollScreen({
  header,
  children,
  contentContainerStyle,
  edges = ['left', 'right'],
  topFade = true,
  bottomFade = true,
  fadeColor,
  fadeMode = 'scroll',
}: HeaderScrollScreenProps) {
  return (
    <HeaderScrollLayout
      header={header}
      edges={edges}
      topFade={topFade}
      bottomFade={bottomFade}
      fadeColor={fadeColor}
      fadeMode={fadeMode}
    >
      {({ paddingTop, paddingBottom, fadeBottomInset, scrollMetricsProps }) => (
        <ScrollView
          style={stylesScroll.scroll}
          contentContainerStyle={[
            {
              paddingTop,
              paddingBottom: paddingBottom + 16 + fadeBottomInset,
            },
            contentContainerStyle,
          ]}
          showsVerticalScrollIndicator={false}
          onLayout={scrollMetricsProps.onLayout}
          onContentSizeChange={scrollMetricsProps.onContentSizeChange}
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
    scrollSlot: {
      flex: 1,
      minHeight: 0,
    },
    chrome: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 4,
      backgroundColor: c.background,
      paddingBottom: HEADER_SCROLL_GAP,
      borderBottomLeftRadius: HEADER_CHROME_BOTTOM_RADIUS,
      borderBottomRightRadius: HEADER_CHROME_BOTTOM_RADIUS,
      overflow: 'hidden',
      shadowColor: '#1E1E1E',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 10,
      elevation: 4,
    },
  });

export { useScrollFadeReporter } from '@/components/ui/scrollFadeMetrics';
