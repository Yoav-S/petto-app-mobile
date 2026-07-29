import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { type ThemeColors } from '@/constants/theme';
import { useColors, useThemedStyles } from '@/context/ThemeContext';

const DESIGN_WIDTH = 375;
const DESIGN_HEIGHT = 812;

/** Figma sticky action bar (375×104): pad 12/20 + 48px button; bottom is device safe area. */
const DESIGN_FOOTER_PAD_TOP = 12;
const DESIGN_FOOTER_PAD_H = 20;
const DESIGN_FOOTER_RADIUS = 24;
const DESIGN_SAVE_BUTTON_WIDTH = 335;
const DESIGN_SAVE_BUTTON_HEIGHT = 48;
const DESIGN_FOOTER_MIN_BOTTOM = 10;

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

function useKeyboardOpen(): boolean {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, () => setOpen(true));
    const hideSub = Keyboard.addListener(hideEvent, () => setOpen(false));

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return open;
}

/** Wraps scroll content + footer; lifts the footer only while the keyboard is open. */
export function HealthKeyboardAvoidingView({
  children,
  keyboardVerticalOffset = 0,
}: HealthKeyboardAvoidingViewProps) {
  const styles = useThemedStyles(makeStyles);
  const keyboardOpen = useKeyboardOpen();

  return (
    <KeyboardAvoidingView
      style={styles.avoiding}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={keyboardVerticalOffset}
      enabled={keyboardOpen}
    >
      {children}
    </KeyboardAvoidingView>
  );
}

/** ScrollView bottom padding so fields clear the full-width save footer bar. */
export function healthKeyboardScrollPadding(scaleY = 1, safeBottom = 0): number {
  const bottom = Math.max(safeBottom, DESIGN_FOOTER_MIN_BOTTOM * scaleY);
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

  const keyboardOpen = useKeyboardOpen();

  const layout = useMemo(
    () => ({
      saveButtonWidth: DESIGN_SAVE_BUTTON_WIDTH * sx,
      saveButtonHeight: DESIGN_SAVE_BUTTON_HEIGHT * sx,
      buttonRadius: 12 * sx,
      footerPadH: DESIGN_FOOTER_PAD_H * sx,
      footerPadTop: DESIGN_FOOTER_PAD_TOP * sy,
      footerRadius: DESIGN_FOOTER_RADIUS * sx,
      footerPadBottomClosed: Math.max(insets.bottom, DESIGN_FOOTER_MIN_BOTTOM * sy),
      doneButtonWidth: DESIGN_DONE_BUTTON_WIDTH * sx,
      doneButtonHeight: DESIGN_DONE_BUTTON_HEIGHT * sy,
      donePadTop: DESIGN_FOOTER_PAD_TOP * sy,
      doneBottomClosed: Math.max(insets.bottom, 0) + DESIGN_DONE_SAFE_GAP * sy,
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
            paddingBottom: keyboardOpen ? layout.donePadTop : layout.doneBottomClosed,
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

  const footerBottomPad = keyboardOpen ? layout.footerPadTop : layout.footerPadBottomClosed;

  return (
    <View
      style={[
        styles.saveFooter,
        keyboardOpen ? styles.footerOpen : styles.footerClosed,
        {
          paddingTop: layout.footerPadTop,
          paddingHorizontal: layout.footerPadH,
          paddingBottom: footerBottomPad,
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
  saveFooter: {
    width: '100%',
    backgroundColor: c.panel,
    alignItems: 'center',
    // Figma: 0px -1px 8px #1E1E1E0F
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
  footerClosed: {
    justifyContent: 'flex-start',
  },
  footerOpen: {
    justifyContent: 'center',
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
