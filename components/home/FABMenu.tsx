import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Colors } from '@/constants/theme';
import { t } from '@/i18n';
import { DESIGN_WIDTH } from '@/components/home/PetHeader';

export const BTN_W = 60;
export const BTN_H = 82;
const BTN_RADIUS = 22;

const MENU_W = 137;
const MENU_GAP = 16;
const MENU_RIGHT_INSET = 41;

/** Figma screen coords on 375px-wide frame */
const BTN_CLOSED_LEFT = 334.46;
const BTN_OPEN_LEFT = 320;
const BTN_CLOSED_TOP = 681.05;
const BTN_OPEN_TOP = 697;

const CLOSED_DEG = -10;
const OPEN_DEG = -90;
const ANIM_MS = 200;

const ICON_SIZE = 24;
const ICON_CLOSED = { top: 15.98, left: 7.7, deg: 10 };
const ICON_OPEN = { top: 18.36, left: 8.88, deg: 90 };

interface FABMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVaccinePress: () => void;
  onHealthPress: () => void;
  onReminderPress: () => void;
  /** healthWrap origin in window coords (from measureInWindow) */
  healthScreenX: number;
  healthScreenY: number;
  layoutScale: number;
  measured: boolean;
}

export default function FABMenu({
  open,
  onOpenChange,
  onVaccinePress,
  onHealthPress,
  onReminderPress,
  healthScreenX,
  healthScreenY,
  layoutScale,
  measured,
}: FABMenuProps) {
  const progress = useSharedValue(open ? 1 : 0);

  const closedLeft = BTN_CLOSED_LEFT * layoutScale - healthScreenX;
  const closedTop = BTN_CLOSED_TOP * layoutScale - healthScreenY;
  const openLeft = BTN_OPEN_LEFT * layoutScale - healthScreenX;
  const openTop = BTN_OPEN_TOP * layoutScale - healthScreenY;

  useEffect(() => {
    progress.value = withTiming(open ? 1 : 0, { duration: ANIM_MS });
  }, [open, progress]);

  const close = () => onOpenChange(false);
  const toggle = () => onOpenChange(!open);

  const anchorStyle = useAnimatedStyle(() => ({
    left: interpolate(progress.value, [0, 1], [closedLeft, openLeft]),
    top: interpolate(progress.value, [0, 1], [closedTop, openTop]),
  }));

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
    top: interpolate(progress.value, [0, 1], [ICON_CLOSED.top, ICON_OPEN.top]),
    left: interpolate(progress.value, [0, 1], [ICON_CLOSED.left, ICON_OPEN.left]),
    transform: [
      { translateX: ICON_SIZE / 2 },
      { translateY: ICON_SIZE / 2 },
      { rotate: `${interpolate(progress.value, [0, 1], [ICON_CLOSED.deg, ICON_OPEN.deg])}deg` },
      { translateX: -ICON_SIZE / 2 },
      { translateY: -ICON_SIZE / 2 },
    ],
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

  if (!measured) {
    return null;
  }

  return (
    <Animated.View style={[styles.anchor, anchorStyle]} pointerEvents="box-none">
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
          <Animated.View style={[styles.iconBox, iconStyle]}>
            <Ionicons name="add" size={ICON_SIZE} color={Colors.surface} />
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 10,
  },
  iconBox: {
    position: 'absolute',
    width: ICON_SIZE,
    height: ICON_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
