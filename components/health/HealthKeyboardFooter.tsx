import React, { useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { type ThemeColors } from '@/constants/theme';
import { PRIMARY_BUTTON } from '@/constants/buttons';
import { PAGE_HORIZONTAL_PADDING } from '@/constants/layout';
import { useThemedStyles } from '@/context/ThemeContext';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import {
  KeyboardDismissDoneChip,
  useKeyboardBottomOffset,
  useKeyboardDoneClaim,
} from '@/components/ui/GlobalKeyboardDoneButton';
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

interface HealthKeyboardFooterProps {
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

export function HealthKeyboardAvoidingView({ children }: HealthKeyboardAvoidingViewProps) {
  const styles = useThemedStyles(makeStyles);
  const offset = useKeyboardBottomOffset();
  const { claim, release } = useKeyboardDoneClaim();

  useEffect(() => {
    claim();
    return () => release();
  }, [claim, release]);

  /**
   * Save footer stays pinned to the screen bottom — never lifts with the keyboard.
   * ScrollViews add keyboard height via useHealthFormScrollPadding so fields stay reachable.
   */
  return (
    <View style={styles.avoiding}>
      {children}
      {offset > 0 ? (
        <View
          pointerEvents="box-none"
          collapsable={false}
          style={[styles.keyboardDoneHost, { bottom: offset }]}
        >
          <KeyboardDismissDoneChip />
        </View>
      ) : null}
    </View>
  );
}

export function healthKeyboardScrollPadding(_scaleY = 1, safeBottom = 0): number {
  const bottom = Math.max(safeBottom, FOOTER.minBottom) + FOOTER.safeGap;
  return FOOTER.padTop + FOOTER.saveButtonHeight + bottom + PAGE_HORIZONTAL_PADDING;
}

export function healthDoneScrollPadding(_scaleY = 1, safeBottom = 0): number {
  return FOOTER.doneButtonHeight + Math.max(safeBottom, 0) + FOOTER.doneSafeGap + PAGE_HORIZONTAL_PADDING;
}

/** Footer stays put; when keyboard is open, scroll content clears keyboard + Done chip. */
export function useHealthFormScrollPadding(safeBottom = 0): number {
  const offset = useKeyboardBottomOffset();
  const base = healthKeyboardScrollPadding(1, safeBottom);
  if (offset <= 0) return base;
  return base + offset + FOOTER.doneButtonHeight + 8;
}

export default function HealthKeyboardFooter({
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
    Keyboard.dismiss();
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

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  avoiding: {
    flex: 1,
  },
  keyboardDoneHost: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 100,
    elevation: 100,
  },
  saveFooter: {
    width: '100%',
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
