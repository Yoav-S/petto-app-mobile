import { useEffect, useState } from 'react';
import {
  Dimensions,
  Keyboard,
  type KeyboardEvent,
} from 'react-native';

/** Done bar height — used for scroll clearance. */
export const KEYBOARD_DONE_BAR_HEIGHT = 56;

export function dismissKeyboard(): void {
  Keyboard.dismiss();
}

/** Keyboard height from bottom of the window. */
export function useKeyboardBottomOffset(): number {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const onShow = (e: KeyboardEvent) => {
      const winH = Dimensions.get('window').height;
      const screenY = e.endCoordinates?.screenY;
      if (typeof screenY === 'number') {
        setOffset(Math.max(0, Math.round(winH - screenY)));
        return;
      }
      setOffset(Math.max(0, Math.round(e.endCoordinates?.height ?? 0)));
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
