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
import { type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/context/ThemeContext';
import { t, isRTL } from '@/i18n';

const DESIGN_WIDTH = 375;
/** Figma: left 255 + width 100 on a 375 frame → 20px from the trailing edge. */
const DESIGN_TRAILING = 20;
const DESIGN_BTN_W = 100;
const DESIGN_BTN_H = 40;
const DESIGN_GAP_ABOVE_KEYBOARD = 8;

/**
 * Global Done chip that sits just above the soft keyboard and dismisses it.
 * Mount once at the app root — no per-screen wiring required.
 */
export default function GlobalKeyboardDoneButton() {
  const styles = useThemedStyles(makeStyles);
  const { width } = useWindowDimensions();
  const sx = width / DESIGN_WIDTH;

  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onShow = (e: { endCoordinates?: { height?: number } }) => {
      setKeyboardHeight(e.endCoordinates?.height ?? 0);
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

  if (keyboardHeight <= 0) return null;

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
            { fontSize: layout.fontSize, lineHeight: layout.lineHeight },
          ]}
        >
          {t('pickers.done')}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    host: {
      position: 'absolute',
      left: 0,
      right: 0,
      zIndex: 2500,
      elevation: 2500,
    },
    button: {
      backgroundColor: c.panel,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#2D2D2A',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.04,
      shadowRadius: 20,
      elevation: 4,
    },
    label: {
      fontFamily: 'Rubik-Medium',
      fontWeight: '500',
      color: c.primaryText,
      textAlign: 'center',
    },
  });
