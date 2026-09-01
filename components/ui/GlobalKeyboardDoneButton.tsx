import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type KeyboardEvent,
} from 'react-native';
import { dismissKeyboard, useKeyboardOpen } from '@/components/ui/keyboardUtils';
import { useColors } from '@/context/ThemeContext';
import { t } from '@/i18n';

/** Lift for the full-screen Done overlay — isolated from scroll math. */
function doneOverlayBottom(e: KeyboardEvent): number {
  const { screenY, height } = e.endCoordinates;
  const kbH = Math.round(height ?? 0);
  const windowH = Dimensions.get('window').height;
  const screenH = Dimensions.get('screen').height;

  if (Platform.OS === 'android') {
    // Root overlay spans the physical display; screenY is in screen coordinates.
    if (typeof screenY === 'number' && Number.isFinite(screenY)) {
      return Math.max(0, Math.round(screenH - screenY));
    }
    return Math.max(0, kbH);
  }

  if (typeof screenY === 'number' && Number.isFinite(screenY)) {
    return Math.max(0, Math.round(windowH - screenY));
  }
  return Math.max(0, kbH);
}

/** Done pill above the keyboard — no Save here. */
export default function GlobalKeyboardDoneButton() {
  const keyboardOpen = useKeyboardOpen();
  const [bottom, setBottom] = useState(0);
  const colors = useColors();

  useEffect(() => {
    const onFrame = (e: KeyboardEvent) => setBottom(doneOverlayBottom(e));
    const onHide = () => setBottom(0);

    const showSub = Keyboard.addListener('keyboardDidShow', onFrame);
    const changeSub = Keyboard.addListener('keyboardDidChangeFrame', onFrame);
    const hideSub = Keyboard.addListener('keyboardDidHide', onHide);
    return () => {
      showSub.remove();
      changeSub.remove();
      hideSub.remove();
    };
  }, []);

  if (!keyboardOpen || bottom <= 0) return null;

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <View pointerEvents="box-none" style={[styles.host, { bottom }]}>
        <Pressable
          style={({ pressed }) => [
            styles.doneBtn,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
          onPress={dismissKeyboard}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t('pickers.done')}
        >
          <Text style={[styles.doneLabel, { color: colors.primaryText }]}>
            {t('pickers.done')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    elevation: 9999,
  },
  host: {
    position: 'absolute',
    right: 20,
    paddingVertical: 8,
  },
  doneBtn: {
    minWidth: 100,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  doneLabel: {
    fontFamily: 'Rubik-Medium',
    fontSize: 14,
    lineHeight: 18,
  },
});
