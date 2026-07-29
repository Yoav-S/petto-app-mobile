import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
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

const LIGHT_CHIP = {
  bg: '#FFFFFF',
  border: '#E5E7EB',
  text: '#1F2937',
} as const;

type ClaimCtx = {
  claimed: boolean;
  claim: () => void;
  release: () => void;
};

const KeyboardDoneClaimContext = createContext<ClaimCtx>({
  claimed: false,
  claim: () => {},
  release: () => {},
});

export function useKeyboardDoneClaim(): ClaimCtx {
  return useContext(KeyboardDoneClaimContext);
}

export function KeyboardDoneClaimProvider({ children }: { children: React.ReactNode }) {
  const [claimed, setClaimed] = useState(false);
  const claim = useCallback(() => setClaimed(true), []);
  const release = useCallback(() => setClaimed(false), []);
  const value = useMemo(() => ({ claimed, claim, release }), [claimed, claim, release]);
  return (
    <KeyboardDoneClaimContext.Provider value={value}>
      {children}
    </KeyboardDoneClaimContext.Provider>
  );
}

/** White Done chip — dismisses the keyboard. */
export function KeyboardDismissDoneChip({ compact }: { compact?: boolean }) {
  const colors = useColors();
  const { isDark } = useTheme();
  const { width } = useWindowDimensions();
  const sx = width / DESIGN_WIDTH;

  const layout = useMemo(
    () => ({
      width: DESIGN_BTN_W * sx,
      height: DESIGN_BTN_H * sx,
      trailing: DESIGN_TRAILING * sx,
      radius: 12 * sx,
      padV: 8 * sx,
      padH: 14 * sx,
      fontSize: 14 * Math.min(sx, 1.15),
      lineHeight: 18 * Math.min(sx, 1.15),
      rowPadV: compact ? 6 * sx : 8 * sx,
    }),
    [sx],
  );

  const bg = isDark ? colors.surface : LIGHT_CHIP.bg;
  const border = isDark ? colors.border : LIGHT_CHIP.border;
  const text = isDark ? colors.primaryText : LIGHT_CHIP.text;

  return (
    <View
      style={[
        styles.row,
        {
          paddingHorizontal: layout.trailing,
          paddingVertical: layout.rowPadV,
          alignItems: isRTL ? 'flex-start' : 'flex-end',
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
 * Fallback Done for screens that do NOT use HealthKeyboardAvoidingView.
 * Form screens claim the context and render Done in-layout instead.
 */
export default function GlobalKeyboardDoneButton() {
  const { claimed } = useKeyboardDoneClaim();
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

  if (claimed || keyboardHeight <= 0) return null;

  const chip = (
    <View
      pointerEvents="box-none"
      style={[styles.host, { bottom: keyboardHeight }]}
      collapsable={false}
    >
      <KeyboardDismissDoneChip />
    </View>
  );

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
  row: {
    width: '100%',
    backgroundColor: 'transparent',
  },
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
