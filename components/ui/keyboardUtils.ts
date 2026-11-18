import { useEffect, useState } from 'react';
import {
  Dimensions,
  Keyboard,
  Platform,
  type KeyboardEvent,
} from 'react-native';

/** Gap kept between a focused field and the top of the keyboard. */
export const KEYBOARD_DONE_BAR_HEIGHT = 16;

export function dismissKeyboard(): void {
  Keyboard.dismiss();
}

function keyboardShowEvent(): 'keyboardWillShow' | 'keyboardDidShow' {
  return Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
}

function keyboardHideEvent(): 'keyboardDidHide' {
  // didHide only — willHide zeros padding while the keyboard is still
  // animating down and makes content jump the wrong way.
  return 'keyboardDidHide';
}

function keyboardFrameEvent():
  | 'keyboardWillChangeFrame'
  | 'keyboardDidChangeFrame'
  | 'keyboardDidShow' {
  // iOS: willChangeFrame tracks the animation. Android 11+: didChangeFrame
  // reports height as the IME moves; older Android falls back to didShow.
  if (Platform.OS === 'ios') return 'keyboardWillChangeFrame';
  return 'keyboardDidChangeFrame';
}

function offsetFromEvent(e: KeyboardEvent): number {
  const kbH = Math.round(e.endCoordinates?.height ?? 0);
  if (Platform.OS === 'android') {
    return Math.max(0, kbH);
  }
  const winH = Dimensions.get('window').height;
  const screenY = e.endCoordinates?.screenY;
  if (typeof screenY === 'number') {
    return Math.max(0, Math.round(winH - screenY));
  }
  return Math.max(0, kbH);
}

/** Whether the software keyboard is open. Hide waits for didHide so layout does not snap early. */
export function useKeyboardOpen(): boolean {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const showSub = Keyboard.addListener(keyboardShowEvent(), () => setOpen(true));
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
 * iOS listens to willChangeFrame so padding moves with the keyboard animation.
 * Android: reported keyboard height (scroll math stays separate from Done overlay).
 */
export function useKeyboardBottomOffset(): number {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const onFrame = (e: KeyboardEvent) => setOffset(offsetFromEvent(e));
    const onHide = () => setOffset(0);

    const frameSub = Keyboard.addListener(keyboardFrameEvent(), onFrame);
    // Older Android may not emit didChangeFrame — keep didShow as a seed.
    const showSub =
      Platform.OS === 'android'
        ? Keyboard.addListener('keyboardDidShow', onFrame)
        : null;
    const hideSub = Keyboard.addListener(keyboardHideEvent(), onHide);
    return () => {
      frameSub.remove();
      showSub?.remove();
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
