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
  type Edge,
} from 'react-native-safe-area-context';
import { HEADER_SCROLL_GAP } from '@/constants/layout';
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
  topFade?: boolean;
  bottomFade?: boolean;
  fadeColor?: string;
  /**
   * document — always show fades (legal / terms).
   * form — hide bottom fade unless content overflows (delete/save screens).
   */
  fadeMode?: 'document' | 'form';
}

export default function HeaderScrollLayout({
  header,
  children,
  edges = ['left', 'right'],
  style,
  topFade = true,
  bottomFade = true,
  fadeColor,
  fadeMode = 'form',
}: HeaderScrollLayoutProps) {
  const styles = useThemedStyles(makeStyles);
  const keyboardOpen = useKeyboardOpen();
  const [chromeHeight, setChromeHeight] = useState(0);
  const { metrics, reportViewport, reportContent, reportPinnedFooterOverflow } =
    useScrollFadeMetricsState();

  const hasOverflow = hasActiveScrollOverflow(metrics);
  const showTopFade = topFade && chromeHeight > 0;
  const showBottomFade =
    bottomFade &&
    !keyboardOpen &&
    (fadeMode === 'document' || hasOverflow);

  const paddingTop = chromeHeight;

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
          {children({ paddingTop, scrollMetricsProps })}
          <ScrollEdgeFades
            scrollTop={chromeHeight}
            color={fadeColor}
            showTop={showTopFade}
            showBottom={showBottomFade}
          />
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
  fadeMode?: 'document' | 'form';
}

export function HeaderScrollScreen({
  header,
  children,
  contentContainerStyle,
  edges = ['left', 'right'],
  topFade = true,
  bottomFade = true,
  fadeColor,
  fadeMode = 'form',
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
      {({ paddingTop, scrollMetricsProps }) => (
        <ScrollView
          style={stylesScroll.scroll}
          contentContainerStyle={[{ paddingTop }, contentContainerStyle]}
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
  scroll: { flex: 1 },
});

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: c.background },
    body: { flex: 1, position: 'relative' },
    chrome: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 4,
      backgroundColor: c.background,
      paddingBottom: HEADER_SCROLL_GAP,
    },
  });

export { useScrollFadeReporter } from '@/components/ui/scrollFadeMetrics';
