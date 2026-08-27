import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
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
  KEYBOARD_DONE_BAR_HEIGHT,
} from '@/components/ui/keyboardUtils';
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
}

interface HealthKeyboardAvoidingViewProps {
  children: React.ReactNode;
  keyboardVerticalOffset?: number;
}

/** Plain flex shell — Save never moves; only the form scrolls. */
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

/** Extra scroll room when keyboard open (form fields only). */
export function useHealthFormScrollPadding(): number {
  const keyboardHeight = useKeyboardBottomOffset();
  if (keyboardHeight <= 0) return PAGE_HORIZONTAL_PADDING;
  return keyboardHeight + KEYBOARD_DONE_BAR_HEIGHT + PAGE_HORIZONTAL_PADDING;
}

interface HealthFormScrollProps extends Pick<ScrollViewProps, 'onScroll' | 'scrollEventThrottle'> {
  children: React.ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
  scrollRef?: React.RefObject<ScrollView | null>;
}

/** Form scroll — fills space above the fixed Save footer. */
export function HealthFormScroll({
  children,
  contentContainerStyle,
  scrollRef,
  onScroll,
  scrollEventThrottle,
}: HealthFormScrollProps) {
  const scrollPad = useHealthFormScrollPadding();

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.scroll}
      contentContainerStyle={[
        contentContainerStyle,
        { paddingBottom: scrollPad },
      ]}
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

interface HealthFormScreenProps {
  children: React.ReactNode;
  footer: HealthKeyboardFooterProps;
  contentContainerStyle?: StyleProp<ViewStyle>;
  scrollRef?: React.RefObject<ScrollView | null>;
  onScroll?: ScrollViewProps['onScroll'];
  scrollEventThrottle?: number;
}

/** Scroll form + Save pinned to screen bottom (only form scrolls). */
export function HealthFormScreen({
  children,
  footer,
  contentContainerStyle,
  scrollRef,
  onScroll,
  scrollEventThrottle,
}: HealthFormScreenProps) {
  return (
    <HealthKeyboardAvoidingView>
      <HealthFormScroll
        scrollRef={scrollRef}
        onScroll={onScroll}
        scrollEventThrottle={scrollEventThrottle}
        contentContainerStyle={contentContainerStyle}
      >
        {children}
      </HealthFormScroll>
      <HealthKeyboardFooter {...footer} />
    </HealthKeyboardAvoidingView>
  );
}

export function HealthKeyboardFooter({
  label,
  disabled = false,
  loading = false,
  onPress,
  fullWidth = true,
}: HealthKeyboardFooterProps) {
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const { contentWidth } = useResponsiveLayout();

  const footerPadBottom = useMemo(
    () => Math.max(insets.bottom, FOOTER.minBottom) + FOOTER.safeGap,
    [insets.bottom],
  );

  const handlePress = () => {
    dismissKeyboard();
    onPress();
  };

  const busy = disabled || loading;

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
    backgroundColor: c.brand,
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
});
