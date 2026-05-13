import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSpring,
  withDelay,
  interpolate
} from 'react-native-reanimated';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { t } from '@/i18n';

interface FABMenuProps {
  onVaccinePress: () => void;
  onHealthPress: () => void;
  onReminderPress: () => void;
}

export default function FABMenu({ onVaccinePress, onHealthPress, onReminderPress }: FABMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const animation = useSharedValue(0);

  const toggleMenu = () => {
    const toValue = isOpen ? 0 : 1;
    animation.value = withTiming(toValue, { duration: 300 });
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    if (isOpen) {
      animation.value = withTiming(0, { duration: 300 });
      setIsOpen(false);
    }
  };

  const overlayStyle = useAnimatedStyle(() => {
    return {
      opacity: animation.value,
      // Need pointerEvents handled by conditionally rendering or styling below
    };
  });

  const fabIconStyle = useAnimatedStyle(() => {
    const rotate = interpolate(animation.value, [0, 1], [0, 45]);
    return {
      transform: [{ rotate: `${rotate}deg` }],
    };
  });

  const createMenuItemStyle = (index: number) => {
    return useAnimatedStyle(() => {
      return {
        opacity: animation.value,
        transform: [
          {
            translateY: interpolate(animation.value, [0, 1], [20 * (index + 1), 0])
          }
        ]
      };
    });
  };

  const item1Style = createMenuItemStyle(0);
  const item2Style = createMenuItemStyle(1);
  const item3Style = createMenuItemStyle(2);

  return (
    <>
      {isOpen && (
        <TouchableWithoutFeedback onPress={closeMenu}>
          <Animated.View style={[styles.overlay, overlayStyle]} />
        </TouchableWithoutFeedback>
      )}

      <View style={styles.container} pointerEvents="box-none">
        {isOpen && (
          <View style={styles.menuItems} pointerEvents="box-none">
            <Animated.View style={[styles.menuItemWrapper, item3Style]}>
              <TouchableOpacity style={styles.menuItem} onPress={() => { closeMenu(); onVaccinePress(); }}>
                <View style={[styles.iconContainer, { backgroundColor: Colors.category.vaccinesBg }]}>
                  <Ionicons name="medkit-outline" size={20} color={Colors.category.vaccines} />
                </View>
                <Text style={styles.menuItemText}>{t('fab.vaccines')}</Text>
              </TouchableOpacity>
            </Animated.View>

            <Animated.View style={[styles.menuItemWrapper, item2Style]}>
              <TouchableOpacity style={styles.menuItem} onPress={() => { closeMenu(); onHealthPress(); }}>
                <View style={[styles.iconContainer, { backgroundColor: Colors.category.notesBg }]}>
                  <Ionicons name="heart-outline" size={20} color={Colors.category.notes} />
                </View>
                <Text style={styles.menuItemText}>{t('fab.health')}</Text>
              </TouchableOpacity>
            </Animated.View>

            <Animated.View style={[styles.menuItemWrapper, item1Style]}>
              <TouchableOpacity style={styles.menuItem} onPress={() => { closeMenu(); onReminderPress(); }}>
                <View style={[styles.iconContainer, { backgroundColor: Colors.category.remindersBg }]}>
                  <Ionicons name="notifications-outline" size={20} color={Colors.category.reminders} />
                </View>
                <Text style={styles.menuItemText}>{t('fab.reminders')}</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        )}

        <TouchableOpacity style={styles.fab} onPress={toggleMenu} activeOpacity={0.8}>
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
    bottom: 32,
    right: 16,
    alignItems: 'flex-end',
    zIndex: 20,
  },
  menuItems: {
    alignItems: 'flex-end',
    marginBottom: 16,
    gap: 12,
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
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuItemText: {
    fontFamily: 'Rubik-Medium',
    fontSize: 16,
    color: Colors.primaryText,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primaryText,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
});
