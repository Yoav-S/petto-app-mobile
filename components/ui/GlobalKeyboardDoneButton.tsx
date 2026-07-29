import React, { useEffect, useMemo, useState } from 'react';
import {
  Keyboard,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { FullWindowOverlay } from 'react-native-screens';
import { useColors, useTheme } from '@/context/ThemeContext';
import { t, isRTL } from '@/i18n';

const DESIGN_WIDTH = 375;
const DESIGN_TRAILING = 20;
const DESIGN_BTN_W = 100;
const DESIGN_BTN_H = 40;
const DESIGN_GAP_ABOVE_KEYBOARD = 8;

const LIGHT_CHIP = {
  bg: '#FFFFFF',
  border: '#E5E7EB',
  text: '#1F2937',
} as const;

function KeyboardDoneChip({
  keyboardHeight,
  layout,
}: {
  keyboardHeight: number;
  layout: {
    width: number;
    height: number;
    trailing: number;
    radius: number;
    padV: number;
    padH: number;
    gapAbove: number;
    fontSize: number;
    lineHeight: number;
  };
}) {
  const colors = useColors();
  const { isDark } = useTheme();

  if (keyboardHeight <= 0) return null;

  const bg = isDark ? colors.surface : LIGHT_CHIP.bg;
  const border = isDark ? colors.border : LIGHT_CHIP.border;
  const text = isDark ? colors.primaryText : LIGHT_CHIP.text;

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.host,
        {
          bottom: keyboardHeight + layout.gapAbove,
          paddingHorizontal: layout.trailing,
        },
      ]}
    >
      <TouchableOpacity
        style={[
          styles.button,
          {
            width: layout.width,
            height: layout.height,
            borderRadius: layout.radius,
            paddingVertical: layout.padV,
            paddingHorizontal: layout.padH,
            alignSelf: isRTL ? 'flex-start' : 'flex-end',
            backgroundColor: bg,
            borderColor: border,
          },
        ]}
        onPress={() => Keyboard.dismiss()}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={t('pickers.done')}
      >
        <Text
          style={[
            styles.label,
            {
              fontSize: layout.fontSize,
              lineHeight: layout.lineHeight,
              color: text,
            },
          ]}
        >
          {t('pickers.done')}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

/**
 * Global Done chip above the soft keyboard.
 * No Modal — mounting a Modal while the keyboard is open steals focus and
 * loops show/hide until the UI freezes.
 */
export default function GlobalKeyboardDoneButton() {
  const { width } = useWindowDimensions();
  const sx = width / DESIGN_WIDTH;
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onShow = (e: { endCoordinates?: { height?: number } }) => {
      setKeyboardHeight(Math.max(0, e.endCoordinates?.height ?? 0));
    };
    const onHide = () => setKeyboardHeight(0);

    const showSub = Keyboard.addListener(showEvent, onShow);
    const hideSub = Keyboard.addListener(hideEvent, onHide);
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const layout = useMemo(
    () => ({
      width: DESIGN_BTN_W * sx,
      height: DESIGN_BTN_H * sx,
      trailing: DESIGN_TRAILING * sx,
      radius: 12 * sx,
      padV: 8 * sx,
      padH: 14 * sx,
      gapAbove: DESIGN_GAP_ABOVE_KEYBOARD * sx,
      fontSize: 14 * Math.min(sx, 1.15),
      lineHeight: 18 * Math.min(sx, 1.15),
    }),
    [sx],
  );

  const chip = <KeyboardDoneChip keyboardHeight={keyboardHeight} layout={layout} />;

  // iOS: stay above the native stack without using Modal.
  // Overlay stays mounted; only the chip toggles with the keyboard.
  if (Platform.OS === 'ios') {
    return (
      <FullWindowOverlay>
        <View pointerEvents="box-none" style={styles.overlayRoot}>
          {chip}
        </View>
      </FullWindowOverlay>
    );
  }

  return chip;
}

const styles = StyleSheet.create({
  overlayRoot: {
    ...StyleSheet.absoluteFillObject,
  },
  host: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 9999,
    elevation: 9999,
  },
  button: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2D2D2A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 12,
  },
  label: {
    fontFamily: 'Rubik-Medium',
    fontWeight: '500',
    textAlign: 'center',
  },
});
