import React, { useCallback, useEffect, useState } from 'react';
import {
  Pressable,
  type GestureResponderEvent,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';

/**
 * List row pressable that cannot stay in the pressed look after navigating
 * away. iOS leaves TouchableOpacity highlighted when a stack push cancels
 * the gesture.
 */
export default function ListRowPressable({
  style,
  onPress,
  onPressIn,
  onPressOut,
  children,
  ...rest
}: PressableProps) {
  const isFocused = useIsFocused();
  const [pressed, setPressed] = useState(false);

  useEffect(() => {
    if (!isFocused) setPressed(false);
  }, [isFocused]);

  const handlePressIn = useCallback(
    (e: GestureResponderEvent) => {
      setPressed(true);
      onPressIn?.(e);
    },
    [onPressIn],
  );

  const handlePressOut = useCallback(
    (e: GestureResponderEvent) => {
      setPressed(false);
      onPressOut?.(e);
    },
    [onPressOut],
  );

  return (
    <Pressable
      {...rest}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[style as StyleProp<ViewStyle>, pressed && isFocused ? { opacity: 0.85 } : null]}
    >
      {children}
    </Pressable>
  );
}
