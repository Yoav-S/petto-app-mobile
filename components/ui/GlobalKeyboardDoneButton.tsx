import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  Keyboard,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
  type KeyboardEvent,
} from 'react-native';
import { FullWindowOverlay } from 'react-native-screens';
import { useColors } from '@/context/ThemeContext';
import { t, isRTL } from '@/i18n';

const DESIGN_TRAILING = 20;
const DESIGN_BTN_W = 100;
const DESIGN_BTN_H = 40;

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

/**
 * Distance from the bottom of the *visible* app window to the top of the keyboard.
 * - iOS: keyboard overlays → use keyboard height
 * - Android (adjustResize): window already shrinks → 0 (bottom of window = keyboard top)
 */
export function useKeyboardBottomOffset(): number {
  const [offset, setOffset] = useState(0);
  const { height: windowHeight } = useWindowDimensions();

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onShow = (e: KeyboardEvent) => {
      const kbHeight = Math.max(0, Math.round(e.endCoordinates?.height ?? 0));
      if (Platform.OS === 'android') {
        // adjustResize: usable window bottom is already the keyboard top.
        setOffset(0);
        return;
      }
      // Prefer screenY when present so we sit exactly on the keyboard top.
      const screenY = e.endCoordinates?.screenY;
      if (typeof screenY === 'number' && windowHeight > 0) {
        setOffset(Math.max(0, Math.round(windowHeight - screenY)));
        return;
      }
      setOffset(kbHeight);
    };
    const onHide = () => setOffset(0);

    const showSub = Keyboard.addListener(showEvent, onShow);
    const hideSub = Keyboard.addListener(hideEvent, onHide);
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [windowHeight]);

  return offset;
}

/** True while the keyboard is open (including Android resize where offset is 0). */
export function useKeyboardOpen(): boolean {
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

/** Fixed Done chip — dismisses the keyboard. */
export function KeyboardDismissDoneChip() {
  const colors = useColors();

  return (
    <View
      style={[
        styles.row,
        {
          paddingHorizontal: DESIGN_TRAILING,
          paddingVertical: 6,
          alignItems: isRTL ? 'flex-start' : 'flex-end',
          backgroundColor: 'transparent',
        },
      ]}
    >
      <TouchableOpacity
        style={[
          styles.button,
          {
            width: DESIGN_BTN_W,
            height: DESIGN_BTN_H,
            borderRadius: 12,
            paddingVertical: 8,
            paddingHorizontal: 14,
            backgroundColor: colors.surface,
            borderColor: colors.border,
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
              fontSize: 14,
              lineHeight: 18,
              color: colors.primaryText,
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
 * Done chip anchored to the top of the keyboard on every screen.
 * Must stay above sticky Save footers (rendered after RootLayoutNav).
 */
export default function GlobalKeyboardDoneButton() {
  const { claimed } = useKeyboardDoneClaim();
  const open = useKeyboardOpen();
  const offset = useKeyboardBottomOffset();

  if (claimed || !open) return null;

  const chip = (
    <View
      pointerEvents="box-none"
      collapsable={false}
      style={[styles.host, { bottom: offset }]}
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
  },
  overlayRoot: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 99999,
    elevation: 99999,
  },
  host: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 99999,
    elevation: 99999,
  },
  button: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2D2D2A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 16,
  },
  label: {
    fontFamily: 'Rubik-Medium',
    textAlign: 'center',
  },
});
