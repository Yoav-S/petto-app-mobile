import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  dismissKeyboard,
  useKeyboardBottomOffset,
} from '@/components/ui/keyboardUtils';
import { useColors } from '@/context/ThemeContext';
import { t } from '@/i18n';

/** Done pill above the keyboard — no Save here. */
export default function GlobalKeyboardDoneButton() {
  const bottom = useKeyboardBottomOffset();
  const colors = useColors();

  if (bottom <= 0) return null;

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
