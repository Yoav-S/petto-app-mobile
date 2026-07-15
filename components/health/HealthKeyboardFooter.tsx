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
import { Colors } from '@/constants/theme';

const DESIGN_WIDTH = 375;
const DESIGN_HEIGHT = 812;
/** White save bar (button + padding). */
const DESIGN_FOOTER_BAR_HEIGHT = 104;
/** Extra space below the button for home indicator / safe area when keyboard is closed. */
const DESIGN_FOOTER_SAFE_EXTRA = 50;
/** Total resting footer height on the 812 frame. */
const DESIGN_FOOTER_REST_HEIGHT = DESIGN_FOOTER_BAR_HEIGHT + DESIGN_FOOTER_SAFE_EXTRA;

interface HealthKeyboardFooterProps {
  label: string;
  disabled?: boolean;
  loading?: boolean;
  onPress: () => void;
  /** Full-width save bar (335×48). When false, compact button aligned right (Done). */
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

/** ScrollView bottom padding so fields clear the resting footer bar. */
export function healthKeyboardScrollPadding(scaleY = 1, safeBottom = 0): number {
  return DESIGN_FOOTER_REST_HEIGHT * scaleY + Math.max(12, safeBottom) + 16;
}

export default function HealthKeyboardFooter({
  label,
  disabled = false,
  loading = false,
  onPress,
  fullWidth = true,
}: HealthKeyboardFooterProps) {
  const { width, height } = useWindowDimensions();
  const sx = width / DESIGN_WIDTH;
  const sy = height / DESIGN_HEIGHT;

  const keyboardOpen = useKeyboardOpen();

  const layout = useMemo(
    () => ({
      buttonWidth: 335 * sx,
      buttonHeight: 48 * sx,
      buttonRadius: 12 * sx,
      footerPadH: 20 * sx,
      footerPadTop: 12 * sy,
      footerRadius: 24 * sx,
      footerHeightClosed: DESIGN_FOOTER_REST_HEIGHT * sy,
      footerPadBottomClosed: (DESIGN_FOOTER_REST_HEIGHT - 12 - 48) * sy,
    }),
    [sx, sy],
  );

  const footerBottomPad = keyboardOpen ? layout.footerPadTop : layout.footerPadBottomClosed;

  return (
    <View
      style={[
        styles.footer,
        keyboardOpen ? styles.footerOpen : styles.footerClosed,
        {
          height: keyboardOpen ? undefined : layout.footerHeightClosed,
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
          fullWidth ? styles.buttonFull : styles.buttonCompact,
          fullWidth && {
            width: layout.buttonWidth,
            height: layout.buttonHeight,
            borderRadius: layout.buttonRadius,
          },
          disabled && styles.buttonDisabled,
        ]}
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.85}
      >
        {loading ? (
          <ActivityIndicator color={Colors.surface} />
        ) : (
          <Text style={[styles.buttonText, disabled && styles.buttonTextDisabled]}>{label}</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  avoiding: {
    flex: 1,
  },
  footer: {
    width: '100%',
    backgroundColor: Colors.surface,
    alignItems: 'center',
    shadowColor: '#2D2D2A',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 8,
  },
  footerClosed: {
    justifyContent: 'flex-start',
  },
  footerOpen: {
    justifyContent: 'center',
  },
  buttonFull: {
    backgroundColor: Colors.primaryText,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonCompact: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.primaryText,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    minWidth: 96,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: Colors.button.disabledBg,
  },
  buttonText: {
    fontFamily: 'Rubik-Medium',
    fontSize: 16,
    color: Colors.surface,
  },
  buttonTextDisabled: {
    color: Colors.button.disabledText,
  },
});
