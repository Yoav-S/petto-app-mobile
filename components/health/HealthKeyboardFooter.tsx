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
/** Done button on add/edit note screens. */
const DESIGN_DONE_BUTTON_WIDTH = 100;
const DESIGN_DONE_BUTTON_HEIGHT = 40;
const DESIGN_DONE_BOTTOM_OFFSET = 44;

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

/** ScrollView bottom padding so fields clear the save footer bar. */
export function healthKeyboardScrollPadding(scaleY = 1, safeBottom = 0): number {
  return DESIGN_FOOTER_REST_HEIGHT * scaleY + Math.max(12, safeBottom) + 16;
}

/** ScrollView bottom padding for Done button screens. */
export function healthDoneScrollPadding(scaleY = 1): number {
  return (DESIGN_DONE_BOTTOM_OFFSET + DESIGN_DONE_BUTTON_HEIGHT) * scaleY + 16;
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
      saveButtonWidth: 335 * sx,
      saveButtonHeight: 48 * sx,
      buttonRadius: 12 * sx,
      footerPadH: 20 * sx,
      footerPadTop: 12 * sy,
      footerRadius: 24 * sx,
      footerHeightClosed: DESIGN_FOOTER_REST_HEIGHT * sy,
      footerPadBottomClosed: (DESIGN_FOOTER_REST_HEIGHT - 12 - 48) * sy,
      doneButtonWidth: DESIGN_DONE_BUTTON_WIDTH * sx,
      doneButtonHeight: DESIGN_DONE_BUTTON_HEIGHT * sy,
      doneBottomOffset: DESIGN_DONE_BOTTOM_OFFSET * sy,
      donePadTop: 12 * sy,
    }),
    [sx, sy],
  );

  if (!fullWidth) {
    return (
      <View
        style={[
          styles.doneFooter,
          {
            paddingHorizontal: layout.footerPadH,
            paddingTop: layout.donePadTop,
            paddingBottom: keyboardOpen ? layout.donePadTop : layout.doneBottomOffset,
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
            <ActivityIndicator color={Colors.surface} />
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
  saveFooter: {
    width: '100%',
    backgroundColor: Colors.surface,
    alignItems: 'center',
    shadowColor: '#2D2D2A',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 8,
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
    backgroundColor: Colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneButton: {
    backgroundColor: Colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
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
