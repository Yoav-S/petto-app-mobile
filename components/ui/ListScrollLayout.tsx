import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import {
  SafeAreaView,
  type Edge,
} from 'react-native-safe-area-context';
import {
  LIST_CONTENT_TOP_NUDGE,
  LIST_SCROLL_END_CLEARANCE,
  LIST_TABS_CONTENT_GAP,
} from '@/constants/layout';
import { type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/context/ThemeContext';
import ScrollEdgeFades from '@/components/ui/ScrollEdgeFades';
import { useListScrollFadeLayout } from '@/components/ui/scrollFadeLayout';
import {
  ScrollFadeMetricsProvider,
  useScrollFadeMetricsState,
} from '@/components/ui/scrollFadeMetrics';
import {
  readScrollFadeMemory,
  writeScrollFadeMemory,
} from '@/components/ui/scrollFadeMemory';

export interface ListScrollInsets {
  /** Inset so first row clears floating chrome (includes solid gap below tabs). */
  paddingTop: number;
  /** Bottom padding — clears the fade's solid tail + home indicator. */
  paddingBottom: number;
  /** Height of the opaque strip at the viewport bottom (solid tail + home inset). */
  bottomFadeInset: number;
  scrollMetricsProps: {
    onLayout: (e: import('react-native').LayoutChangeEvent) => void;
    onContentSizeChange: (w: number, h: number) => void;
    /**
     * Static (non-scrolling) view is showing — hides fades.
     * Pass `transient` for spinners so the remembered fade state survives the reload.
     */
    markNonScrollable: (options?: { transient?: boolean }) => void;
    /** Call when a scrollable list mounts (e.g. tab switch away from empty). */
    markScrollable: () => void;
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
  /** Override the top fade band height (defaults to the list/document preset). */
  topFadeHeight?: number;
  /** Start content at the end of the top fade band so nothing is dimmed at rest. */
  clearTopFade?: boolean;
  /**
   * Stable id (include the active tab) so fades can paint on the first frame
   * when coming back to a list that was already known to scroll.
   */
  fadeKey?: string;
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
  topFadeHeight: topFadeHeightOverride,
  clearTopFade = false,
  fadeKey,
}: ListScrollLayoutProps) {
  const styles = useThemedStyles(makeStyles);
  const surface = backgroundColor;
  const remembered = readScrollFadeMemory(fadeKey);
  const rememberedRef = useRef(remembered);
  const [chromeContentHeight, setChromeContentHeight] = useState(
    rememberedRef.current?.chromeHeight ?? 0,
  );
  const [isStaticView, setIsStaticView] = useState(false);
  const overflowLatch = useRef(false);
  /** Loading placeholders should not erase what we know about this list. */
  const transientStatic = useRef(false);
  const {
    topFadeHeight: presetTopFadeHeight,
    bottomFadeHeight,
    bottomSolidAt,
    bottomInset,
    bottomPadding,
    topSolidAt,
  } = useListScrollFadeLayout(documentFade);
  const topFadeHeight = topFadeHeightOverride ?? presetTopFadeHeight;
  const { metrics, reportViewport, reportContent, reportPinnedFooterOverflow } =
    useScrollFadeMetricsState();

  const hasDocumentOverflow =
    documentFade &&
    metrics.viewportHeight > 0 &&
    metrics.contentHeight > metrics.viewportHeight + 1;

  const scrollActive = metrics.viewportHeight > 0;
  /**
   * Documents pin the header in flow so the first line can never sit under it.
   * Lists keep overlay chrome so rows scroll through the tabs.
   */
  const pinChrome = documentFade;
  /**
   * 16pt gap under the tabs. The top fade is taller than that gap so rows
   * dissolve as they scroll, but the first row starts in the clear part of
   * the ramp and is not covered at rest.
   */
  const contentOffset = pinChrome
    ? contentGap
    : clearTopFade
      ? topFadeHeight
      : contentGap + LIST_CONTENT_TOP_NUDGE;
  const paddingTop = pinChrome
    ? contentOffset
    : chrome != null
      ? chromeContentHeight + contentOffset
      : contentOffset;
  /**
   * Documents fill to the screen bottom; extra padding is only the opaque
   * fade tail so the last line can scroll into the open part of the ramp.
   */
  const paddingBottom = documentFade
    ? bottomPadding()
    : LIST_SCROLL_END_CLEARANCE;
  /** Home indicator only — rows scroll through the fade to the screen bottom. */
  const bottomFadeInset = bottomInset;
  /** Overlay lists: fade starts at chrome bottom. In-flow documents: scroll slot top. */
  const fadeTop = pinChrome ? 0 : chrome != null ? chromeContentHeight : 0;

  /**
   * Rows against the height rows can actually use: the chrome inset and the
   * fade clearance are not viewport. Comparing rows to the whole viewport
   * kept the fades off until a list was a full screen taller than it scrolled.
   */
  const itemScrollHeight = metrics.contentHeight - paddingTop - paddingBottom;
  const itemViewportHeight = metrics.viewportHeight - paddingTop - paddingBottom;
  const hasItemOverflow =
    scrollActive &&
    itemViewportHeight > 0 &&
    itemScrollHeight > itemViewportHeight + 1;

  /** True once this list has reported real metrics — before that we trust memory. */
  const isMeasured = scrollActive && metrics.contentHeight > 0;
  const measuredOverflow = documentFade ? hasDocumentOverflow : hasItemOverflow;

  useEffect(() => {
    if (measuredOverflow) {
      overflowLatch.current = true;
      return;
    }
    if (isMeasured) {
      overflowLatch.current = false;
    }
  }, [isMeasured, measuredOverflow]);

  useEffect(() => {
    writeScrollFadeMemory(fadeKey, { chromeHeight: chromeContentHeight });
  }, [fadeKey, chromeContentHeight]);

  useEffect(() => {
    if (isStaticView) {
      if (!transientStatic.current) writeScrollFadeMemory(fadeKey, { scrollable: false });
      return;
    }
    if (isMeasured) {
      writeScrollFadeMemory(fadeKey, { scrollable: measuredOverflow });
    }
  }, [fadeKey, isMeasured, isStaticView, measuredOverflow]);

  const showFades = isStaticView
    ? false
    : isMeasured
      ? measuredOverflow
      : overflowLatch.current ||
        (remembered?.scrollable ?? rememberedRef.current?.scrollable ?? false);

  const showTopFade =
    topFade &&
    !isStaticView &&
    (pinChrome || chrome == null || chromeContentHeight > 0);
  /** Paint both edges on list screens — do not wait for overflow math. */
  const showBottomFade = bottomFade && !isStaticView;
  /** Mounted before metrics arrive so a remembered-scrollable list fades in on frame one. */
  const mountFades =
    !isStaticView &&
    (pinChrome || chrome == null || chromeContentHeight > 0) &&
    (topFade || bottomFade);

  const markNonScrollable = useCallback(
    (options?: { transient?: boolean }) => {
      overflowLatch.current = false;
      transientStatic.current = options?.transient === true;
      setIsStaticView(true);
      reportContent(0);
    },
    [reportContent],
  );

  const markScrollable = useCallback(() => {
    transientStatic.current = false;
    setIsStaticView(false);
  }, []);

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
        if (h > 0) setIsStaticView(false);
      },
      markNonScrollable,
      markScrollable,
    }),
    [markNonScrollable, markScrollable, reportViewport, reportContent],
  );

  const fadeOverlay = mountFades ? (
    <ScrollEdgeFades
      scrollTop={fadeTop}
      color={fadeColor}
      showTop={showTopFade}
      showBottom={showBottomFade}
      topHeight={topFadeHeight}
      bottomHeight={bottomFadeHeight}
      bottomSolidAt={bottomSolidAt}
      topSolidAt={topSolidAt}
      ramp="linear"
      topRamp={documentFade ? 'documentTop' : undefined}
      visible
    />
  ) : null;

  return (
    <SafeAreaView
      style={[styles.safeArea, surface ? { backgroundColor: surface } : null, style]}
      edges={edges}
    >
      <ScrollFadeMetricsProvider value={fadeContext}>
        <View style={styles.body}>
          {pinChrome && chrome != null ? (
            <View
              style={[styles.chromePinned, surface ? { backgroundColor: surface } : null]}
              onLayout={(e) => setChromeContentHeight(e.nativeEvent.layout.height)}
            >
              {chrome}
            </View>
          ) : null}
          <View style={styles.scrollSlot}>
            {children({ paddingTop, paddingBottom, bottomFadeInset, scrollMetricsProps })}
            {pinChrome ? fadeOverlay : null}
          </View>
          {pinChrome ? null : fadeOverlay}
          {!pinChrome && chrome != null ? (
            <View
              style={styles.chrome}
              onLayout={(e) => setChromeContentHeight(e.nativeEvent.layout.height)}
              pointerEvents="box-none"
            >
              {chrome}
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
      position: 'relative',
    },
    chrome: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 4,
      backgroundColor: c.background,
    },
    chromePinned: {
      zIndex: 4,
      backgroundColor: c.background,
    },
  });
