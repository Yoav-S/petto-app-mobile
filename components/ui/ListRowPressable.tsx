import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Pressable,
  type GestureResponderEvent,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';

/**
 * List row pressable that cannot stay dimmed after a long press or after
 * navigating away. iOS skips `pressOut` on a long press and also leaves
 * TouchableOpacity highlighted when a stack push cancels the gesture.
 */
export default function ListRowPressable({
  style,
  onPress,
  onPressIn,
  onPressOut,
  onLongPress,
  children,
  ...rest
}: PressableProps) {
  const isFocused = useIsFocused();
  const [pressed, setPressed] = useState(false);
  const token = useRef(0);

  const clearPressed = useCallback(() => {
    token.current += 1;
    setPressed(false);
  }, []);

  useEffect(() => {
    if (!isFocused) clearPressed();
  }, [isFocused, clearPressed]);

  const handlePressIn = useCallback(
    (e: GestureResponderEvent) => {
      const id = ++token.current;
      setPressed(true);
      onPressIn?.(e);
      setTimeout(() => {
        if (token.current === id) setPressed(false);
      }, 280);
    },
    [onPressIn],
  );

  const handlePressOut = useCallback(
    (e: GestureResponderEvent) => {
      clearPressed();
      onPressOut?.(e);
    },
    [clearPressed, onPressOut],
  );

  const handleLongPress = useCallback(
    (e: GestureResponderEvent) => {
      clearPressed();
      onLongPress?.(e);
    },
    [clearPressed, onLongPress],
  );

  return (
    <Pressable
      {...rest}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onLongPress={handleLongPress}
      delayLongPress={320}
      style={[style as StyleProp<ViewStyle>, pressed && isFocused ? { opacity: 0.85 } : null]}
    >
      {children}
    </Pressable>
  );
}
