import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { t } from '@/i18n';

const FAB_SIZE = 56;

interface FABMenuProps {
  onVaccinePress: () => void;
  onHealthPress: () => void;
  onReminderPress: () => void;
}

export default function FABMenu({ onVaccinePress, onHealthPress, onReminderPress }: FABMenuProps) {
  const insets = useSafeAreaInsets();
  const [isOpen, setIsOpen] = useState(false);
  const animation = useSharedValue(0);

  const toggleMenu = () => {
    const toValue = isOpen ? 0 : 1;
    animation.value = withTiming(toValue, { duration: 280 });
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    if (isOpen) {
      animation.value = withTiming(0, { duration: 280 });
      setIsOpen(false);
    }
  };

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: animation.value,
  }));

  const fabIconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(animation.value, [0, 1], [0, 45])}deg` }],
  }));

  const createMenuItemStyle = (index: number) =>
    useAnimatedStyle(() => ({
      opacity: animation.value,
      transform: [
        {
          translateY: interpolate(animation.value, [0, 1], [16 * (index + 1), 0]),
        },
      ],
    }));

  const item1Style = createMenuItemStyle(0);
  const item2Style = createMenuItemStyle(1);
  const item3Style = createMenuItemStyle(2);

  const fabBottom = Math.max(insets.bottom, 12) + 8;
  const fabRight = -FAB_SIZE / 2 + 8;

  return (
    <>
      {isOpen && (
        <TouchableWithoutFeedback onPress={closeMenu}>
          <Animated.View style={[styles.overlay, overlayStyle]} />
        </TouchableWithoutFeedback>
      )}

      <View
        style={[styles.container, { bottom: fabBottom, right: fabRight }]}
        pointerEvents="box-none"
      >
        {isOpen && (
          <View style={styles.menuItems} pointerEvents="box-none">
            <Animated.View style={[styles.menuItemWrapper, item3Style]}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  closeMenu();
                  onVaccinePress();
                }}
                activeOpacity={0.85}
              >
                <View style={[styles.iconContainer, { backgroundColor: Colors.category.vaccinesBg }]}>
                  <MaterialCommunityIcons
                    name="needle"
                    size={20}
                    color={Colors.category.vaccines}
                  />
                </View>
                <Text style={styles.menuItemText}>{t('fab.vaccines')}</Text>
              </TouchableOpacity>
            </Animated.View>

            <Animated.View style={[styles.menuItemWrapper, item2Style]}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  closeMenu();
                  onHealthPress();
                }}
                activeOpacity={0.85}
              >
                <View style={[styles.iconContainer, { backgroundColor: Colors.category.notesBg }]}>
                  <MaterialCommunityIcons
                    name="heart-pulse"
                    size={20}
                    color={Colors.category.notes}
                  />
                </View>
                <Text style={styles.menuItemText}>{t('fab.health')}</Text>
              </TouchableOpacity>
            </Animated.View>

            <Animated.View style={[styles.menuItemWrapper, item1Style]}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  closeMenu();
                  onReminderPress();
                }}
                activeOpacity={0.85}
              >
                <View style={[styles.iconContainer, { backgroundColor: Colors.category.remindersBg }]}>
                  <Ionicons name="notifications-outline" size={20} color={Colors.category.reminders} />
                </View>
                <Text style={styles.menuItemText}>{t('fab.reminders')}</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        )}

        <TouchableOpacity
          style={[styles.fab, isOpen && styles.fabOpen]}
          onPress={toggleMenu}
          activeOpacity={0.9}
        >
          <Animated.View style={fabIconStyle}>
            <Ionicons name="add" size={28} color={Colors.surface} />
          </Animated.View>
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    zIndex: 10,
  },
  container: {
    position: 'absolute',
    alignItems: 'flex-end',
    zIndex: 20,
  },
  menuItems: {
    alignItems: 'flex-end',
    marginBottom: Spacing.md,
    gap: 12,
    paddingRight: FAB_SIZE / 2 + 4,
  },
  menuItemWrapper: {
    alignItems: 'flex-end',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    gap: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuItemText: {
    fontFamily: 'Rubik-Medium',
    fontSize: 16,
    color: Colors.primaryText,
  },
  fab: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    backgroundColor: Colors.primaryText,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 8,
  },
  fabOpen: {
    borderRadius: Radius.lg,
  },
});
