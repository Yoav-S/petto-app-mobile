import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import type { LayoutChangeEvent } from 'react-native';

interface ScrollFadeMetrics {
  viewportHeight: number;
  contentHeight: number;
  /** When set, form screens with pinned footers override scroll-size overflow. */
  pinnedFooterOverflow: boolean | null;
}

interface ScrollFadeContextValue {
  reportViewport: (height: number) => void;
  reportContent: (height: number) => void;
  reportPinnedFooterOverflow: (overflow: boolean | null) => void;
}

const ScrollFadeContext = createContext<ScrollFadeContextValue | null>(null);

export function useScrollFadeReporter() {
  return useContext(ScrollFadeContext);
}

export function useScrollFadeMetricsProps() {
  const ctx = useContext(ScrollFadeContext);
  return useMemo(
    () => ({
      onLayout: (e: LayoutChangeEvent) => {
        ctx?.reportViewport(e.nativeEvent.layout.height);
      },
      onContentSizeChange: (_w: number, h: number) => {
        ctx?.reportContent(h);
      },
    }),
    [ctx],
  );
}

export function useScrollFadeMetricsState() {
  const [metrics, setMetrics] = useState<ScrollFadeMetrics>({
    viewportHeight: 0,
    contentHeight: 0,
    pinnedFooterOverflow: null,
  });

  const reportViewport = useCallback((viewportHeight: number) => {
    setMetrics((prev) =>
      prev.viewportHeight === viewportHeight ? prev : { ...prev, viewportHeight },
    );
  }, []);

  const reportContent = useCallback((contentHeight: number) => {
    setMetrics((prev) =>
      prev.contentHeight === contentHeight ? prev : { ...prev, contentHeight },
    );
  }, []);

  const reportPinnedFooterOverflow = useCallback((pinnedFooterOverflow: boolean | null) => {
    setMetrics((prev) =>
      prev.pinnedFooterOverflow === pinnedFooterOverflow
        ? prev
        : { ...prev, pinnedFooterOverflow },
    );
  }, []);

  return { metrics, reportViewport, reportContent, reportPinnedFooterOverflow };
}

export function hasActiveScrollOverflow(metrics: ScrollFadeMetrics): boolean {
  if (metrics.viewportHeight <= 0) return false;
  if (metrics.pinnedFooterOverflow != null) return metrics.pinnedFooterOverflow;
  return metrics.contentHeight > metrics.viewportHeight + 12;
}

export function ScrollFadeMetricsProvider({
  value,
  children,
}: {
  value: ScrollFadeContextValue;
  children: React.ReactNode;
}) {
  return <ScrollFadeContext.Provider value={value}>{children}</ScrollFadeContext.Provider>;
}
