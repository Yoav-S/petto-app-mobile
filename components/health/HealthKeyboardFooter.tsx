import React, { useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { type ThemeColors } from '@/constants/theme';
import { useColors, useThemedStyles } from '@/context/ThemeContext';
import {
  KeyboardDismissDoneChip,
  useKeyboardBottomOffset,
  useKeyboardDoneClaim,
} from '@/components/ui/GlobalKeyboardDoneButton';

const DESIGN_WIDTH = 375;
const DESIGN_HEIGHT = 812;

/** Figma sticky action bar (375×104): pad 12/20 + 48px button; bottom is device safe area. */
const DESIGN_FOOTER_PAD_TOP = 12;
const DESIGN_FOOTER_PAD_H = 20;
const DESIGN_FOOTER_RADIUS = 24;
const DESIGN_SAVE_BUTTON_WIDTH = 335;
const DESIGN_SAVE_BUTTON_HEIGHT = 48;
const DESIGN_FOOTER_MIN_BOTTOM = 10;
/** Extra lift above the home-indicator so the CTA doesn't kiss the safe zone. */
const DESIGN_FOOTER_SAFE_GAP = 8;

/** Compact Done (edit note) — 100×40, lifted above the home indicator. */
const DESIGN_DONE_BUTTON_WIDTH = 100;
const DESIGN_DONE_BUTTON_HEIGHT = 40;
const DESIGN_DONE_SAFE_GAP = 25;

interface HealthKeyboardFooterProps {
  label: string;
  disabled?: boolean;
  loading?: boolean;
  onPress: () => void;
  /** Full-width save bar (335×48). When false, compact Done button (100×40). */
  fullWidth?: boolean;
}

interface HealthKeyboardAvoidingViewProps {
  children: React.ReactNode;
  keyboardVerticalOffset?: number;
}

/**
 * Form shell: sticky Save/Continue stays pinned to the screen bottom.
 * When the keyboard is open, only the light Done chip floats on the keyboard edge.
 */
export function HealthKeyboardAvoidingView({
  children,
}: HealthKeyboardAvoidingViewProps) {
  const styles = useThemedStyles(makeStyles);
  const offset = useKeyboardBottomOffset();
  const { claim, release } = useKeyboardDoneClaim();

  useEffect(() => {
    claim();
    return () => release();
  }, [claim, release]);

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

/** ScrollView bottom padding so fields clear the full-width save footer bar. */
export function healthKeyboardScrollPadding(scaleY = 1, safeBottom = 0): number {
  const bottom = Math.max(safeBottom, DESIGN_FOOTER_MIN_BOTTOM * scaleY) + DESIGN_FOOTER_SAFE_GAP * scaleY;
  return (DESIGN_FOOTER_PAD_TOP + DESIGN_SAVE_BUTTON_HEIGHT) * scaleY + bottom + 16;
}

/** ScrollView bottom padding for compact Done button screens. */
export function healthDoneScrollPadding(scaleY = 1, safeBottom = 0): number {
  return (
    DESIGN_DONE_BUTTON_HEIGHT * scaleY +
    Math.max(safeBottom, 0) +
    DESIGN_DONE_SAFE_GAP * scaleY +
    16
  );
}

export default function HealthKeyboardFooter({
  label,
  disabled = false,
  loading = false,
  onPress,
  fullWidth = true,
}: HealthKeyboardFooterProps) {
  const styles = useThemedStyles(makeStyles);
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const sx = width / DESIGN_WIDTH;
  const sy = height / DESIGN_HEIGHT;

  const layout = useMemo(
    () => ({
      saveButtonWidth: DESIGN_SAVE_BUTTON_WIDTH * sx,
      saveButtonHeight: DESIGN_SAVE_BUTTON_HEIGHT * sx,
      buttonRadius: 12 * sx,
      footerPadH: DESIGN_FOOTER_PAD_H * sx,
      footerPadTop: DESIGN_FOOTER_PAD_TOP * sy,
      footerRadius: DESIGN_FOOTER_RADIUS * sx,
      footerPadBottom:
        Math.max(insets.bottom, DESIGN_FOOTER_MIN_BOTTOM * sy) + DESIGN_FOOTER_SAFE_GAP * sy,
      doneButtonWidth: DESIGN_DONE_BUTTON_WIDTH * sx,
      doneButtonHeight: DESIGN_DONE_BUTTON_HEIGHT * sy,
      donePadTop: DESIGN_FOOTER_PAD_TOP * sy,
      doneBottom: Math.max(insets.bottom, 0) + DESIGN_DONE_SAFE_GAP * sy,
    }),
    [sx, sy, insets.bottom],
  );

  if (!fullWidth) {
    return (
      <View
        style={[
          styles.doneFooter,
          {
            paddingHorizontal: layout.footerPadH,
            paddingTop: layout.donePadTop,
            paddingBottom: layout.doneBottom,
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.doneButton,
            {
              width: layout.doneButtonWidth,
              height: layout.doneButtonHeight,
              borderRadius: layout.buttonRadius,
            },
            disabled && styles.buttonDisabled,
          ]}
          onPress={onPress}
          disabled={disabled || loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color={colors.surface} />
          ) : (
            <Text style={[styles.buttonText, disabled && styles.buttonTextDisabled]}>{label}</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.saveFooter,
        {
          paddingTop: layout.footerPadTop,
          paddingHorizontal: layout.footerPadH,
          paddingBottom: layout.footerPadBottom,
          borderTopLeftRadius: layout.footerRadius,
          borderTopRightRadius: layout.footerRadius,
        },
      ]}
    >
      <TouchableOpacity
        style={[
          styles.saveButton,
          {
            width: layout.saveButtonWidth,
            height: layout.saveButtonHeight,
            borderRadius: layout.buttonRadius,
          },
          disabled && styles.buttonDisabled,
        ]}
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.85}
      >
        {loading ? (
          <ActivityIndicator color={colors.surface} />
        ) : (
          <Text style={[styles.buttonText, disabled && styles.buttonTextDisabled]}>{label}</Text>
        )}
      </TouchableOpacity>
    </View>
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
    color: c.surface,
  },
  buttonTextDisabled: {
    color: c.button.disabledText,
  },
});
