import { useEffect, useState } from 'react';
import {
  Dimensions,
  Keyboard,
  Platform,
  type KeyboardEvent,
} from 'react-native';

/** Done bar height — used for scroll clearance. */
export const KEYBOARD_DONE_BAR_HEIGHT = 56;

export function dismissKeyboard(): void {
  Keyboard.dismiss();
}

/** Whether the software keyboard is open. */
export function useKeyboardOpen(): boolean {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => setOpen(true));
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setOpen(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return open;
}

/**
 * Keyboard lift for in-app scroll/focus.
 * Android: reported keyboard height (scroll math stays separate from Done overlay).
 */
export function useKeyboardBottomOffset(): number {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const onShow = (e: KeyboardEvent) => {
      const kbH = Math.round(e.endCoordinates?.height ?? 0);
      if (Platform.OS === 'android') {
        setOffset(Math.max(0, kbH));
        return;
      }
      const winH = Dimensions.get('window').height;
      const screenY = e.endCoordinates?.screenY;
      if (typeof screenY === 'number') {
        setOffset(Math.max(0, Math.round(winH - screenY)));
        return;
      }
      setOffset(Math.max(0, kbH));
    };
    const onHide = () => setOffset(0);

    const showSub = Keyboard.addListener('keyboardDidShow', onShow);
    const hideSub = Keyboard.addListener('keyboardDidHide', onHide);
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return offset;
}

/**
 * True when adjustResize already shrunk the RN window (scroll must not add
 * keyboard height again).
 */
export function useKeyboardWindowResized(): boolean {
  const [resized, setResized] = useState(false);

  useEffect(() => {
    const onShow = (e: KeyboardEvent) => {
      if (Platform.OS !== 'android') {
        setResized(false);
        return;
      }
      const kbH = Math.round(e.endCoordinates?.height ?? 0);
      const winH = Dimensions.get('window').height;
      const screenY = e.endCoordinates?.screenY;
      const fromWindow =
        typeof screenY === 'number' ? Math.max(0, Math.round(winH - screenY)) : kbH;
      setResized(kbH > 0 && fromWindow < kbH * 0.5);
    };
    const onHide = () => setResized(false);

    const showSub = Keyboard.addListener('keyboardDidShow', onShow);
    const hideSub = Keyboard.addListener('keyboardDidHide', onHide);
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return resized;
}
