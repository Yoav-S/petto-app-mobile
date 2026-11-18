import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useColors } from '@/context/ThemeContext';

/** Root of a create screen. */
export default function CreateScreenShell({ children }: { children: React.ReactNode }) {
  const colors = useColors();

  return (
    <View style={[styles.fill, { backgroundColor: colors.background }]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
});
