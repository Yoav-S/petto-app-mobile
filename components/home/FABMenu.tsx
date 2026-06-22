import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Colors, Spacing } from '@/constants/theme';
import { t } from '@/i18n';

export const BTN_W = 60;
export const BTN_H = 82;
const BTN_RADIUS = 22;

const MENU_W = 137;
const MENU_GAP = 16;
/** Menu right edge sits this far left of the FAB right edge (Figma: 353 vs 394). */
const MENU_RIGHT_INSET = 41;

const CLOSED_DEG = -10;
const OPEN_DEG = -90;
const ANIM_MS = 200;

interface FABMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVaccinePress: () => void;
  onHealthPress: () => void;
  onReminderPress: () => void;
}

export default function FABMenu({
  open,
  onOpenChange,
  onVaccinePress,
  onHealthPress,
  onReminderPress,
}: FABMenuProps) {
  const progress = useSharedValue(open ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(open ? 1 : 0, { duration: ANIM_MS });
  }, [open, progress]);

  const close = () => onOpenChange(false);
  const toggle = () => onOpenChange(!open);

  const btnRotateStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: BTN_W / 2 },
      { translateY: BTN_H / 2 },
      { rotate: `${interpolate(progress.value, [0, 1], [CLOSED_DEG, OPEN_DEG])}deg` },
      { translateX: -BTN_W / 2 },
      { translateY: -BTN_H / 2 },
    ],
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(progress.value, [0, 1], [0, 45])}deg` }],
  }));

  const menuStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
  }));

  const itemAnim = (index: number) =>
    useAnimatedStyle(() => ({
      opacity: progress.value,
      transform: [{ translateY: interpolate(progress.value, [0, 1], [4 * (index + 1), 0]) }],
    }));

  const s0 = itemAnim(0);
  const s1 = itemAnim(1);
  const s2 = itemAnim(2);

  return (
    <View style={styles.anchor} pointerEvents="box-none">
      <Animated.View
        style={[styles.menu, menuStyle]}
        pointerEvents={open ? 'box-none' : 'none'}
      >
        <Animated.View style={[styles.menuRow, s2]}>
          <MenuItem
            width={121}
            padded={false}
            label={t('fab.vaccines')}
            iconBg={Colors.category.vaccinesBg}
            icon={<MaterialCommunityIcons name="needle" size={18} color={Colors.category.vaccines} />}
            onPress={() => {
              close();
              onVaccinePress();
            }}
          />
        </Animated.View>
        <Animated.View style={[styles.menuRow, s1]}>
          <MenuItem
            width={105}
            padded
            label={t('fab.health')}
            iconBg={Colors.category.notesBg}
            icon={<MaterialCommunityIcons name="heart-pulse" size={18} color={Colors.category.notes} />}
            onPress={() => {
              close();
              onHealthPress();
            }}
          />
        </Animated.View>
        <Animated.View style={[styles.menuRow, s0]}>
          <MenuItem
            width={137}
            padded
            label={t('fab.reminders')}
            iconBg={Colors.category.remindersBg}
            icon={<Ionicons name="notifications-outline" size={18} color={Colors.category.reminders} />}
            onPress={() => {
              close();
              onReminderPress();
            }}
          />
        </Animated.View>
      </Animated.View>

      <Animated.View style={btnRotateStyle}>
        <TouchableOpacity style={styles.btn} onPress={toggle} activeOpacity={0.9}>
          <Animated.View style={iconStyle}>
            <Ionicons name="add" size={26} color={Colors.surface} />
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

function MenuItem({
  width,
  padded,
  label,
  iconBg,
  icon,
  onPress,
}: {
  width: number;
  padded: boolean;
  label: string;
  iconBg: string;
  icon: React.ReactNode;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.menuItem, { width }, padded ? styles.menuItemPadded : styles.menuItemVaccines]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={[styles.menuIcon, { backgroundColor: iconBg }]}>{icon}</View>
      <Text style={styles.menuLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  anchor: {
    position: 'absolute',
    right: -(Spacing.lg + BTN_W / 2),
    bottom: -33,
    width: BTN_W,
    height: BTN_H,
    zIndex: 100,
    elevation: 100,
    overflow: 'visible',
  },
  menu: {
    position: 'absolute',
    right: MENU_RIGHT_INSET,
    bottom: BTN_H,
    width: MENU_W,
    alignItems: 'flex-end',
    gap: MENU_GAP,
    overflow: 'visible',
  },
  menuRow: {
    alignItems: 'flex-end',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    borderRadius: 12,
    gap: 10,
    backgroundColor: Colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  menuItemVaccines: {
    paddingHorizontal: 14,
  },
  menuItemPadded: {
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  menuIcon: {
    width: 24,
    height: 24,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuLabel: {
    fontFamily: 'Rubik-Medium',
    fontSize: 14,
    color: Colors.primaryText,
  },
  btn: {
    width: BTN_W,
    height: BTN_H,
    borderRadius: BTN_RADIUS,
    backgroundColor: Colors.primaryText,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 10,
  },
});
