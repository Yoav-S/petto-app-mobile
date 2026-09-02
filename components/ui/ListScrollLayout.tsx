import React, { useCallback, useMemo, useState } from 'react';
import { View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import {
  SafeAreaView,
  type Edge,
} from 'react-native-safe-area-context';
import { LIST_TABS_CONTENT_GAP } from '@/constants/layout';
import { type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/context/ThemeContext';
import ScrollEdgeFades from '@/components/ui/ScrollEdgeFades';
import { useListScrollFadeLayout } from '@/components/ui/scrollFadeLayout';
import {
  ScrollFadeMetricsProvider,
  hasActiveScrollOverflow,
  useScrollFadeMetricsState,
} from '@/components/ui/scrollFadeMetrics';

export interface ListScrollInsets {
  /** Inset so first row clears floating chrome (includes solid gap below tabs). */
  paddingTop: number;
  /** Bottom padding — clears fade + home indicator + FAB when fabOverlay is true. */
  paddingBottom: number;
  scrollMetricsProps: {
    onLayout: (e: import('react-native').LayoutChangeEvent) => void;
    onContentSizeChange: (w: number, h: number) => void;
    markNonScrollable: () => void;
  };
}

interface ListScrollLayoutProps {
  chrome?: React.ReactNode;
  children: (insets: ListScrollInsets) => React.ReactNode;
  edges?: Edge[];
  style?: StyleProp<ViewStyle>;
  backgroundColor?: string;
  topFade?: boolean;
  bottomFade?: boolean;
  fadeColor?: string;
  /** Solid strip below tabs before list content. */
  contentGap?: number;
  documentFade?: boolean;
  /** When true, bottom padding also clears the speed-dial FAB. */
  fabOverlay?: boolean;
}

export default function ListScrollLayout({
  chrome,
  children,
  edges = ['left', 'right'],
  style,
  backgroundColor,
  topFade = true,
  bottomFade = true,
  fadeColor,
  contentGap = LIST_TABS_CONTENT_GAP,
  documentFade = false,
  fabOverlay = false,
}: ListScrollLayoutProps) {
  const styles = useThemedStyles(makeStyles);
  const surface = backgroundColor;
  const [chromeBlockHeight, setChromeBlockHeight] = useState(0);
  const { topFadeHeight, bottomFadeHeight, bottomPadding } =
    useListScrollFadeLayout(documentFade);
  const { metrics, reportViewport, reportContent, reportPinnedFooterOverflow } =
    useScrollFadeMetricsState();

  const hasOverflow = documentFade
    ? metrics.viewportHeight > 0 && metrics.contentHeight > metrics.viewportHeight + 1
    : hasActiveScrollOverflow(metrics);

  const scrollActive = metrics.viewportHeight > 0;
  const listTop = chrome != null ? chromeBlockHeight : contentGap;
  const paddingTop = listTop;
  /**
   * Top fade overlaps upward under tabs; its bottom edge (transparent) sits on
   * the first row so the item at rest stays fully readable.
   */
  const fadeTop = Math.max(0, listTop - topFadeHeight);

  const showTopFade =
    topFade && scrollActive && hasOverflow && (chrome != null ? chromeBlockHeight > 0 : true);
  const showBottomFade = bottomFade && scrollActive && hasOverflow;
  const paddingBottom = bottomPadding(fabOverlay);

  const markNonScrollable = useCallback(() => {
    reportContent(0);
  }, [reportContent]);

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
      markNonScrollable,
    }),
    [markNonScrollable, reportViewport, reportContent],
  );

  return (
    <SafeAreaView
      style={[styles.safeArea, surface ? { backgroundColor: surface } : null, style]}
      edges={edges}
    >
      <ScrollFadeMetricsProvider value={fadeContext}>
        <View style={styles.body}>
          <View style={styles.scrollSlot}>
            {children({ paddingTop, paddingBottom, scrollMetricsProps })}
          </View>
          {showTopFade || showBottomFade ? (
            <ScrollEdgeFades
              scrollTop={fadeTop}
              color={fadeColor}
              showTop={showTopFade}
              showBottom={showBottomFade}
              topHeight={topFadeHeight}
              bottomHeight={bottomFadeHeight}
            />
          ) : null}
          {chrome != null ? (
            <View
              style={[
                styles.chrome,
                surface ? { backgroundColor: surface } : null,
              ]}
              pointerEvents="box-none"
            >
              <View
                onLayout={(e) => setChromeBlockHeight(e.nativeEvent.layout.height)}
              >
                {chrome}
                <View
                  style={[
                    styles.contentGap,
                    { height: contentGap },
                    surface ? { backgroundColor: surface } : null,
                  ]}
                />
              </View>
            </View>
          ) : null}
        </View>
      </ScrollFadeMetricsProvider>
    </SafeAreaView>
  );
}

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
    },
    contentGap: {
      backgroundColor: c.background,
    },
  });
