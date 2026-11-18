import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useColors } from '@/context/ThemeContext';
import { KeyboardBarOverlay } from '@/components/ui/GlobalKeyboardDoneButton';
import { useLocalKeyboardBarHost } from '@/components/ui/keyboardSaveAction';

/**
 * Root of a create screen. On iOS create screens are native modals, which sit
 * above the app-wide keyboard bar, so the screen hosts its own Save / Done bar.
 */
export default function CreateScreenShell({ children }: { children: React.ReactNode }) {
  const colors = useColors();
  useLocalKeyboardBarHost();

  return (
    <View style={[styles.fill, { backgroundColor: colors.background }]}>
      {children}
      <KeyboardBarOverlay />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
});
