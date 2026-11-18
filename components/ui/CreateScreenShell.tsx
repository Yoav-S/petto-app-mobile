import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useColors } from '@/context/ThemeContext';
import { LocalKeyboardCheckButton } from '@/components/ui/KeyboardCheckButton';

/**
 * Root of a create screen. On iOS create screens are native modals, which sit
 * above the app-wide keyboard check, so the screen hosts its own.
 */
export default function CreateScreenShell({ children }: { children: React.ReactNode }) {
  const colors = useColors();

  return (
    <View style={[styles.fill, { backgroundColor: colors.background }]}>
      {children}
      <LocalKeyboardCheckButton />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
});
