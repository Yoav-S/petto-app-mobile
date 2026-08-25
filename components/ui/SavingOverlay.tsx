import React from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

/**
 * Blocks the whole screen while a create/save is in flight.
 * No spinner — dim/blur-like veil so the user cannot tap elsewhere.
 */
export default function SavingOverlay({ visible }: { visible: boolean }) {
  const { isDark } = useTheme();
  if (!visible) return null;

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent>
      <View
        style={[
          styles.veil,
          { backgroundColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(31,41,55,0.18)' },
        ]}
        accessibilityViewIsModal
        accessibilityLabel="Saving"
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  veil: {
    flex: 1,
  },
});
