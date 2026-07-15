import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Keyboard,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/theme';

const DESIGN_WIDTH = 375;

interface HealthKeyboardFooterProps {
  label: string;
  disabled?: boolean;
  loading?: boolean;
  onPress: () => void;
  /** Full-width save bar (335×48). When false, compact button aligned right (Done). */
  fullWidth?: boolean;
}

export default function HealthKeyboardFooter({
  label,
  disabled = false,
  loading = false,
  onPress,
  fullWidth = true,
}: HealthKeyboardFooterProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const sx = width / DESIGN_WIDTH;
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const layout = useMemo(
    () => ({
      buttonWidth: 335 * sx,
      buttonHeight: 48 * sx,
      buttonRadius: 12 * sx,
      footerPadH: 20 * sx,
      footerPadTop: 12 * sx,
      footerRadius: 24 * sx,
    }),
    [sx],
  );

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (event) => {
      setKeyboardHeight(event.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const keyboardOffset =
    keyboardHeight > 0 ? Math.max(0, keyboardHeight - insets.bottom) : 0;

  return (
    <View
      style={[
        styles.footer,
        {
          paddingTop: layout.footerPadTop,
          paddingHorizontal: layout.footerPadH,
          paddingBottom: keyboardHeight > 0 ? layout.footerPadTop : Math.max(12, insets.bottom),
          borderTopLeftRadius: layout.footerRadius,
          borderTopRightRadius: layout.footerRadius,
          marginBottom: keyboardOffset,
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
  footer: {
    backgroundColor: Colors.surface,
    alignItems: 'center',
    shadowColor: '#2D2D2A',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 8,
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
