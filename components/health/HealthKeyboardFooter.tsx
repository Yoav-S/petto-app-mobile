import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Platform,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollViewProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { type ThemeColors } from '@/constants/theme';
import { PRIMARY_BUTTON } from '@/constants/buttons';
import { PAGE_HORIZONTAL_PADDING } from '@/constants/layout';
import { useThemedStyles } from '@/context/ThemeContext';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import {
  dismissKeyboard,
  useKeyboardBottomOffset,
  useKeyboardOpen,
  useKeyboardWindowResized,
  KEYBOARD_DONE_BAR_HEIGHT,
} from '@/components/ui/keyboardUtils';
import { useScrollFadeReporter } from '@/components/ui/scrollFadeMetrics';
import SavingOverlay from '@/components/ui/SavingOverlay';

/** Figma sticky action bar — fixed metrics. */
const FOOTER = {
  padTop: 12,
  padH: PAGE_HORIZONTAL_PADDING,
  radius: 24,
  saveButtonHeight: PRIMARY_BUTTON.height,
  minBottom: 10,
  safeGap: 8,
  doneButtonWidth: 100,
  doneButtonHeight: 40,
  doneSafeGap: 25,
} as const;

export interface HealthKeyboardFooterProps {
  label: string;
  disabled?: boolean;
  loading?: boolean;
  onPress: () => void;
  fullWidth?: boolean;
  /** Primary filled button (default) or destructive text link pinned like Save. */
  tone?: 'primary' | 'destructive-text';
}

interface HealthKeyboardAvoidingViewProps {
  children: React.ReactNode;
  keyboardVerticalOffset?: number;
}

/** Plain flex shell — never lifts Save. */
export function HealthKeyboardAvoidingView({ children }: HealthKeyboardAvoidingViewProps) {
  const styles = useThemedStyles(makeStyles);
  return <View style={styles.avoiding}>{children}</View>;
}

export function healthSaveFooterHeight(safeBottom = 0): number {
  const bottom = Math.max(safeBottom, FOOTER.minBottom) + FOOTER.safeGap;
  return FOOTER.padTop + FOOTER.saveButtonHeight + bottom;
}

export function healthKeyboardScrollPadding(_scaleY = 1, safeBottom = 0): number {
  return healthSaveFooterHeight(safeBottom) + PAGE_HORIZONTAL_PADDING;
}

export function healthDoneScrollPadding(_scaleY = 1, safeBottom = 0): number {
  return FOOTER.doneButtonHeight + Math.max(safeBottom, 0) + FOOTER.doneSafeGap + PAGE_HORIZONTAL_PADDING;
}

/** @deprecated */
export function useHealthFormScrollPadding(): number {
  const keyboardHeight = useKeyboardBottomOffset();
  if (keyboardHeight <= 0) return 0;
  return keyboardHeight + KEYBOARD_DONE_BAR_HEIGHT;
}

/** @deprecated */
export function HealthFormFields({ children }: { children: React.ReactNode }) {
  return <View style={styles.fieldsGrow}>{children}</View>;
}

interface HealthFormScrollProps extends Pick<ScrollViewProps, 'onScroll' | 'scrollEventThrottle'> {
  children: React.ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
  scrollRef?: React.RefObject<ScrollView | null>;
}

/** Plain form scroll (no Save). */
export function HealthFormScroll({
  children,
  contentContainerStyle,
  scrollRef,
  onScroll,
  scrollEventThrottle,
}: HealthFormScrollProps) {
  return (
    <ScrollView
      ref={scrollRef}
      style={styles.scroll}
      contentContainerStyle={contentContainerStyle}
      keyboardShouldPersistTaps="always"
      keyboardDismissMode="none"
      showsVerticalScrollIndicator={false}
      onScroll={onScroll}
      scrollEventThrottle={scrollEventThrottle}
    >
      {children}
    </ScrollView>
  );
}

interface HealthFormSaveScrollProps extends HealthFormScrollProps {
  footer: HealthKeyboardFooterProps;
  fieldsStyle?: StyleProp<ViewStyle>;
}

/**
 * Save sticks to screen bottom.
 * When keyboard opens, scroll-room is measured so max scroll lands Save
 * exactly above the Done chip — no overscroll / flying.
 */
export function HealthFormSaveScroll({
  children,
  footer,
  fieldsStyle,
  scrollRef,
  onScroll,
  scrollEventThrottle,
}: HealthFormSaveScrollProps) {
  const keyboardHeight = useKeyboardBottomOffset();
  const keyboardOpen = useKeyboardOpen();
  const windowResized = useKeyboardWindowResized();
  const insets = useSafeAreaInsets();
  const scrollFade = useScrollFadeReporter();
  const [viewportH, setViewportH] = useState(0);
  const [fieldsH, setFieldsH] = useState(0);
  const [footerH, setFooterH] = useState(0);
  const [scrollRoom, setScrollRoom] = useState(0);
  const scrollYRef = useRef(0);
  const localScrollRef = useRef<ScrollView>(null);

  const footerPadBottom = keyboardOpen
    ? FOOTER.minBottom + FOOTER.safeGap
    : Math.max(insets.bottom, FOOTER.minBottom) + FOOTER.safeGap;

  const setScrollRef = useCallback(
    (node: ScrollView | null) => {
      localScrollRef.current = node;
      if (!scrollRef) return;
      if (typeof scrollRef === 'object' && scrollRef) {
        (scrollRef as React.MutableRefObject<ScrollView | null>).current = node;
      }
    },
    [scrollRef],
  );

  const onViewportLayout = (e: LayoutChangeEvent) => {
    const h = Math.round(e.nativeEvent.layout.height);
    if (h > 0 && h !== viewportH) setViewportH(h);
    scrollFade?.reportViewport(h);
  };

  useEffect(() => {
    if (viewportH <= 0) return;
    scrollFade?.reportPinnedFooterOverflow(fieldsH + footerH > viewportH + 8);
  }, [fieldsH, footerH, scrollFade, viewportH]);

  useEffect(() => {
    return () => scrollFade?.reportPinnedFooterOverflow(null);
  }, [scrollFade]);

  /**
   * Trailing scroll extent so max scroll parks Save on the Done chip.
   * Android (adjustResize): the viewport already shrinks — only reserve the Done band.
   * iOS: lift Save by keyboard height + Done band.
   */
  useEffect(() => {
    if (!keyboardOpen) {
      setScrollRoom(0);
      return;
    }
    const room =
      Platform.OS === 'android' && windowResized
        ? Math.max(0, KEYBOARD_DONE_BAR_HEIGHT - footerPadBottom)
        : Math.max(0, keyboardHeight + KEYBOARD_DONE_BAR_HEIGHT - footerPadBottom);
    setScrollRoom(room);
  }, [footerPadBottom, keyboardHeight, keyboardOpen, windowResized]);

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      scrollYRef.current = e.nativeEvent.contentOffset.y;
      onScroll?.(e);
    },
    [onScroll],
  );

  return (
    <ScrollView
      ref={setScrollRef}
      style={styles.scroll}
      onLayout={onViewportLayout}
      contentContainerStyle={
        viewportH > 0 ? undefined : styles.scrollContentFallback
      }
      keyboardShouldPersistTaps="always"
      keyboardDismissMode="none"
      showsVerticalScrollIndicator={false}
      bounces={false}
      alwaysBounceVertical={false}
      overScrollMode="never"
      onScroll={handleScroll}
      scrollEventThrottle={scrollEventThrottle ?? 16}
      onContentSizeChange={(_w, h) => scrollFade?.reportContent(h)}
    >
      <View
        style={[
          styles.bottomPinPanel,
          viewportH > 0 ? { minHeight: viewportH } : styles.scrollContentFallback,
        ]}
      >
        <View
          style={[styles.fieldsBlock, fieldsStyle]}
          onLayout={(e) => setFieldsH(e.nativeEvent.layout.height)}
        >
          {children}
        </View>
        <View
          collapsable={false}
          onLayout={(e) => setFooterH(e.nativeEvent.layout.height)}
        >
          <HealthKeyboardFooter {...footer} />
        </View>
      </View>
      {scrollRoom > 0 ? <View style={{ height: scrollRoom }} /> : null}
    </ScrollView>
  );
}

interface HealthFormScreenProps {
  children: React.ReactNode;
  footer: HealthKeyboardFooterProps;
  contentContainerStyle?: StyleProp<ViewStyle>;
  scrollRef?: React.RefObject<ScrollView | null>;
  onScroll?: ScrollViewProps['onScroll'];
  scrollEventThrottle?: number;
  /** Top inset when header floats above scroll (from HeaderScrollLayout). */
  scrollInsetTop?: number;
}

export function HealthFormScreen({
  children,
  footer,
  contentContainerStyle,
  scrollRef,
  onScroll,
  scrollEventThrottle,
  scrollInsetTop = 0,
}: HealthFormScreenProps) {
  const flat = StyleSheet.flatten(contentContainerStyle) ?? {};
  const baseTop = typeof flat.paddingTop === 'number' ? flat.paddingTop : 0;
  const fieldsStyle = scrollInsetTop
    ? { ...flat, paddingTop: scrollInsetTop + baseTop }
    : contentContainerStyle;

  return (
    <HealthKeyboardAvoidingView>
      <HealthFormSaveScroll
        footer={footer}
        fieldsStyle={fieldsStyle}
        scrollRef={scrollRef}
        onScroll={onScroll}
        scrollEventThrottle={scrollEventThrottle}
      >
        {children}
      </HealthFormSaveScroll>
    </HealthKeyboardAvoidingView>
  );
}

export function HealthKeyboardFooter({
  label,
  disabled = false,
  loading = false,
  onPress,
  fullWidth = true,
  tone = 'primary',
}: HealthKeyboardFooterProps) {
  const styles = useThemedStyles(makeStyles);
  const keyboardOpen = useKeyboardOpen();
  const insets = useSafeAreaInsets();
  const { contentWidth } = useResponsiveLayout();

  const footerPadBottom = useMemo(
    () =>
      keyboardOpen
        ? FOOTER.minBottom + FOOTER.safeGap
        : Math.max(insets.bottom, FOOTER.minBottom) + FOOTER.safeGap,
    [insets.bottom, keyboardOpen],
  );

  const handlePress = () => {
    dismissKeyboard();
    onPress();
  };

  const busy = disabled || loading;

  if (tone === 'destructive-text' && fullWidth) {
    return (
      <>
        <SavingOverlay visible={loading} />
        <View
          style={[
            styles.saveFooter,
            {
              paddingTop: FOOTER.padTop,
              paddingHorizontal: FOOTER.padH,
              paddingBottom: footerPadBottom,
              borderTopLeftRadius: FOOTER.radius,
              borderTopRightRadius: FOOTER.radius,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.destructiveTextButton}
            onPress={handlePress}
            disabled={busy}
            activeOpacity={0.7}
          >
            <Text style={[styles.destructiveText, busy && styles.buttonTextDisabled]}>{label}</Text>
          </TouchableOpacity>
        </View>
      </>
    );
  }

  if (!fullWidth) {
    return (
      <>
        <SavingOverlay visible={loading} />
        <View
          style={[
            styles.doneFooter,
            {
              paddingHorizontal: FOOTER.padH,
              paddingTop: FOOTER.padTop,
              paddingBottom: Math.max(insets.bottom, 0) + FOOTER.doneSafeGap,
            },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.doneButton,
              {
                width: FOOTER.doneButtonWidth,
                height: FOOTER.doneButtonHeight,
                borderRadius: PRIMARY_BUTTON.borderRadius,
              },
              busy && styles.buttonDisabled,
            ]}
            onPress={handlePress}
            disabled={busy}
            activeOpacity={0.85}
          >
            <Text style={[styles.buttonText, busy && styles.buttonTextDisabled]}>{label}</Text>
          </TouchableOpacity>
        </View>
      </>
    );
  }

  return (
    <>
      <SavingOverlay visible={loading} />
      <View
        style={[
          styles.saveFooter,
          {
            paddingTop: FOOTER.padTop,
            paddingHorizontal: FOOTER.padH,
            paddingBottom: footerPadBottom,
            borderTopLeftRadius: FOOTER.radius,
            borderTopRightRadius: FOOTER.radius,
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.saveButton,
            {
              width: contentWidth,
              height: FOOTER.saveButtonHeight,
              borderRadius: PRIMARY_BUTTON.borderRadius,
              paddingVertical: PRIMARY_BUTTON.paddingVertical,
              paddingHorizontal: PRIMARY_BUTTON.paddingHorizontal,
              gap: PRIMARY_BUTTON.gap,
            },
            busy && styles.buttonDisabled,
          ]}
          onPress={handlePress}
          disabled={busy}
          activeOpacity={0.85}
        >
          <Text style={[styles.buttonText, busy && styles.buttonTextDisabled]}>{label}</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContentFallback: {
    flexGrow: 1,
  },
  bottomPinPanel: {
    width: '100%',
    justifyContent: 'space-between',
  },
  fieldsBlock: {
    width: '100%',
  },
  fieldsGrow: {
    flexGrow: 1,
    width: '100%',
  },
});

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  avoiding: {
    flex: 1,
    minHeight: 0,
  },
  saveFooter: {
    width: '100%',
    flexShrink: 0,
    backgroundColor: c.panel,
    alignItems: 'center',
    justifyContent: 'flex-start',
    shadowColor: '#1E1E1E',
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 6,
  },
  doneFooter: {
    width: '100%',
    flexShrink: 0,
    backgroundColor: 'transparent',
    alignItems: 'flex-end',
  },
  saveButton: {
    ...PRIMARY_BUTTON,
    backgroundColor: c.brand,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneButton: {
    backgroundColor: c.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: c.button.disabledBg,
  },
  buttonText: {
    fontFamily: 'Rubik-Medium',
    fontSize: 16,
    color: c.button.primaryText,
  },
  buttonTextDisabled: {
    color: c.button.disabledText,
  },
  destructiveTextButton: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 12,
  },
  destructiveText: {
    fontFamily: 'Rubik-Medium',
    fontSize: 16,
    color: c.error,
  },
});
