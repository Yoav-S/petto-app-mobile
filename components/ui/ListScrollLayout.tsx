import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import {
  SafeAreaView,
  type Edge,
} from 'react-native-safe-area-context';
import {
  DOCUMENT_BOTTOM_SOLID,
  DOCUMENT_CONTENT_TOP_NUDGE,
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
  /** False when the rows fit — no scroll, no edge fades. */
  scrollable: boolean;
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
  const fadeKeyRef = useRef(fadeKey);
  /** Content-size reports are tagged with the fadeKey they belong to. */
  const measuredFadeKeyRef = useRef<string | undefined>(undefined);
  const [chromeContentHeight, setChromeContentHeight] = useState(
    rememberedRef.current?.chromeHeight ?? 0,
  );
  const [isStaticView, setIsStaticView] = useState(false);
  const overflowLatch = useRef(Boolean(remembered?.scrollable));
  /**
   * Bottom padding that was actually applied last render. Overflow math has to
   * ignore this extra (it is only there so the last row can clear the fade).
   */
  const listBottomPadRef = useRef(
    remembered?.scrollable ? LIST_SCROLL_END_CLEARANCE : 0,
  );
  /** Loading placeholders should not erase what we know about this list. */
  const transientStatic = useRef(false);

  /** Apply the new tab's memory in this render — a post-paint effect is a frame too late and jumps. */
  const tabChanged = fadeKeyRef.current !== fadeKey;
  if (tabChanged) {
    fadeKeyRef.current = fadeKey;
    const mem = readScrollFadeMemory(fadeKey);
    rememberedRef.current = mem;
    overflowLatch.current = Boolean(mem?.scrollable);
    listBottomPadRef.current = mem?.scrollable ? LIST_SCROLL_END_CLEARANCE : 0;
    if (isStaticView) setIsStaticView(false);
  }
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
   * Ignore list end-clearance when deciding whether rows actually overflow.
   * That padding exists only so a scrolling list can park the last row above
   * the fade — it must not make a short list look scrollable.
   */
  const hasItemOverflow =
    !documentFade &&
    scrollActive &&
    metrics.contentHeight - listBottomPadRef.current > metrics.viewportHeight + 1;

  /** True once THIS tab's list has reported real metrics — before that we trust memory. */
  const isMeasured =
    scrollActive &&
    metrics.contentHeight > 0 &&
    measuredFadeKeyRef.current === fadeKey;
  const measuredOverflow = documentFade ? hasDocumentOverflow : hasItemOverflow;

  const listScrollable =
    isStaticView && !tabChanged
      ? false
      : isMeasured
        ? measuredOverflow
        : overflowLatch.current ||
          (remembered?.scrollable ?? rememberedRef.current?.scrollable ?? false);

  /**
   * Top gap is stable across tabs so switching Active ↔ Resolved does not
   * shove the first row when the fade appears. Extra bottom clearance still
   * follows overflow so a short list cannot scroll through empty padding.
   */
  const contentOffset = pinChrome
    ? contentGap + (documentFade ? DOCUMENT_CONTENT_TOP_NUDGE : 0)
    : clearTopFade
      ? topFadeHeight
      : contentGap + LIST_CONTENT_TOP_NUDGE;
  const paddingTop = pinChrome
    ? contentOffset
    : chrome != null
      ? chromeContentHeight + contentOffset
      : contentOffset;
  const paddingBottom = documentFade
    ? bottomPadding()
    : listScrollable
      ? LIST_SCROLL_END_CLEARANCE
      : 0;
  if (!documentFade) listBottomPadRef.current = paddingBottom;
  /** Documents: 22pt button cover under the fade. Lists: home inset. */
  const fadeBottomStrip = documentFade
    ? Math.max(DOCUMENT_BOTTOM_SOLID, bottomInset)
    : bottomInset;
  const bottomFadeInset = fadeBottomStrip;
  /** Overlay lists: fade starts at chrome bottom. In-flow documents: scroll slot top. */
  const fadeTop = pinChrome ? 0 : chrome != null ? chromeContentHeight : 0;

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

  const showFades = documentFade || listScrollable;

  const hideForStatic = isStaticView && !tabChanged;
  const showTopFade =
    topFade &&
    !hideForStatic &&
    showFades &&
    (pinChrome || chrome == null || chromeContentHeight > 0);
  const showBottomFade = bottomFade && !hideForStatic && showFades;
  /** Keep bands mounted so tab switches only change opacity, not layout. */
  const mountFades =
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
        measuredFadeKeyRef.current = fadeKey;
        reportContent(h);
        if (h > 0) setIsStaticView(false);
      },
      markNonScrollable,
      markScrollable,
    }),
    [fadeKey, markNonScrollable, markScrollable, reportViewport, reportContent],
  );

  const fadeOverlay = mountFades ? (
    <ScrollEdgeFades
      scrollTop={fadeTop}
      color={fadeColor}
      showTop={showTopFade}
      showBottom={showBottomFade}
      topHeight={topFadeHeight}
      bottomHeight={bottomFadeHeight}
      bottomInset={fadeBottomStrip}
      bottomSolidAt={bottomSolidAt}
      topSolidAt={topSolidAt}
      ramp={documentFade ? 'documentBottom' : 'linear'}
      topRamp={documentFade ? 'documentTop' : undefined}
      visible={showFades}
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
            {children({
              paddingTop,
              paddingBottom,
              bottomFadeInset,
              scrollable: documentFade || listScrollable,
              scrollMetricsProps,
            })}
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
