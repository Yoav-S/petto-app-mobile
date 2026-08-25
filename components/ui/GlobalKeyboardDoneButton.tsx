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

/** Distance from the bottom of the app window to the top of the keyboard. */
export function useKeyboardBottomOffset(): number {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onShow = (e: KeyboardEvent) => {
      const { height } = e.endCoordinates;
      setOffset(Math.max(0, Math.round(height || 0)));
    };
    const onHide = () => setOffset(0);

    const showSub = Keyboard.addListener(showEvent, onShow);
    const hideSub = Keyboard.addListener(hideEvent, onHide);
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return offset;
}

/** Fixed Done chip — dismisses the keyboard. */
export function KeyboardDismissDoneChip() {
  const colors = useColors();

  const bg = colors.surface;
  const border = colors.border;
  const text = colors.primaryText;

  return (
    <View
      style={[
        styles.row,
        {
          paddingHorizontal: DESIGN_TRAILING,
          paddingVertical: 4,
          alignItems: isRTL ? 'flex-start' : 'flex-end',
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
              fontSize: 14,
              lineHeight: 18,
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
 * Anchored to the keyboard top via measured bottom offset (no Modal).
 */
export default function GlobalKeyboardDoneButton() {
  const { claimed } = useKeyboardDoneClaim();
  const offset = useKeyboardBottomOffset();

  if (claimed || offset <= 0) return null;

  const chip = (
    <View pointerEvents="box-none" style={[styles.host, { bottom: offset }]} collapsable={false}>
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
    textAlign: 'center',
  },
});
