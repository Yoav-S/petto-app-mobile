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

export const BTN_W = 52;
export const BTN_H = 72;
const BTN_RADIUS = 12;
const MENU_GAP = 4;

const CLOSED_DEG = -15;
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
            label={t('fab.vaccines')}
            iconBg={Colors.category.vaccinesBg}
            icon={<MaterialCommunityIcons name="needle" size={20} color={Colors.category.vaccines} />}
            onPress={() => {
              close();
              onVaccinePress();
            }}
          />
        </Animated.View>
        <Animated.View style={[styles.menuRow, s1]}>
          <MenuItem
            label={t('fab.health')}
            iconBg={Colors.category.notesBg}
            icon={<MaterialCommunityIcons name="heart-pulse" size={20} color={Colors.category.notes} />}
            onPress={() => {
              close();
              onHealthPress();
            }}
          />
        </Animated.View>
        <Animated.View style={[styles.menuRow, s0]}>
          <MenuItem
            label={t('fab.reminders')}
            iconBg={Colors.category.remindersBg}
            icon={<Ionicons name="notifications-outline" size={20} color={Colors.category.reminders} />}
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
  label,
  iconBg,
  icon,
  onPress,
}: {
  label: string;
  iconBg: string;
  icon: React.ReactNode;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.85}>
      <View style={[styles.menuIcon, { backgroundColor: iconBg }]}>{icon}</View>
      <Text style={styles.menuLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  anchor: {
    position: 'absolute',
    right: -(Spacing.lg + BTN_W / 2),
    bottom: -22,
    width: BTN_W,
    height: BTN_H,
    zIndex: 100,
    elevation: 100,
    overflow: 'visible',
  },
  menu: {
    position: 'absolute',
    right: 0,
    bottom: BTN_H + MENU_GAP,
    alignItems: 'flex-end',
    gap: 8,
    overflow: 'visible',
  },
  menuRow: {
    alignItems: 'flex-end',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 28,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  menuIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuLabel: {
    fontFamily: 'Rubik-Medium',
    fontSize: 16,
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
