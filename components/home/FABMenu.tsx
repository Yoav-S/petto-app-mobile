import { Colors } from '@/constants/theme';
import { DESIGN_WIDTH } from '@/components/home/PetHeader';
import { t } from '@/i18n';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** Full-screen scrim opacity when the menu is fully open (Figma: #000 @ 0.2). */
const SCRIM_OPACITY = 0.2;

/** Reference frame (Figma / your tuned device) */
const DESIGN = {
  btnW: 60,
  btnH: 82,
  btnRadius: 22,
  menuW: 137,
  menuGap: 16,
  menuRightInset: 41,
  /** Your tweak: menu sits at bottom: BTN_H - 50 */
  menuBottom: 32,
  fabRightOverflow: 35.46,
  /** Push the FAB lower than the reference position (auto-scaled). */
  bottomOffsetClosed: 30,
  bottomOffsetOpen: 20,
  openShiftX: 5.54,
  openShiftY: -49.05,
  iconSize: 24,
  iconClosed: { top: 15.98, left: 7.7, deg: 0 },
  iconOpen: { top: 18.36, left: 8.88, deg: 45 },
  menuItemH: 40,
  menuItemVaccinesW: 121,
  menuItemHealthW: 105,
  menuItemRemindersW: 137,
} as const;

const CLOSED_DEG = -10;
const OPEN_DEG = -90;
const ANIM_MS = 200;

export const BTN_W = DESIGN.btnW;
export const BTN_H = DESIGN.btnH;

function useFabLayout() {
  const { width } = useWindowDimensions();
  const s = width / DESIGN_WIDTH;

  return useMemo(
    () => ({
      s,
      btnW: DESIGN.btnW * s,
      btnH: DESIGN.btnH * s,
      btnRadius: DESIGN.btnRadius * s,
      menuW: DESIGN.menuW * s,
      menuGap: DESIGN.menuGap * s,
      menuBottom: DESIGN.menuBottom * s,
      menuRightInset: DESIGN.menuRightInset * s,
      fabRight: DESIGN.fabRightOverflow * s,
      bottomOffsetClosed: DESIGN.bottomOffsetClosed * s,
      bottomOffsetOpen: DESIGN.bottomOffsetOpen * s,
      openShiftX: DESIGN.openShiftX * s,
      openShiftY: DESIGN.openShiftY * s,
      iconSize: DESIGN.iconSize * s,
      iconClosed: {
        top: DESIGN.iconClosed.top * s,
        left: DESIGN.iconClosed.left * s,
        deg: DESIGN.iconClosed.deg,
      },
      iconOpen: {
        top: DESIGN.iconOpen.top * s,
        left: DESIGN.iconOpen.left * s,
        deg: DESIGN.iconOpen.deg,
      },
      menuItemH: DESIGN.menuItemH * s,
      menuItemVaccinesW: DESIGN.menuItemVaccinesW * s,
      menuItemHealthW: DESIGN.menuItemHealthW * s,
      menuItemRemindersW: DESIGN.menuItemRemindersW * s,
    }),
    [s],
  );
}

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
  const layout = useFabLayout();
  const progress = useSharedValue(open ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(open ? 1 : 0, { duration: ANIM_MS });
  }, [open, progress]);

  const close = () => onOpenChange(false);
  const toggle = () => onOpenChange(!open);

  // Closed rests at bottomOffsetClosed; opening lifts by the extra difference so it
  // effectively sits at bottomOffsetOpen while keeping the tuned open-shift intact.
  const openExtraLift = layout.bottomOffsetClosed - layout.bottomOffsetOpen;

  const anchorStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(progress.value, [0, 1], [0, layout.openShiftX]) },
      { translateY: interpolate(progress.value, [0, 1], [0, layout.openShiftY - openExtraLift]) },
    ],
  }));

  const btnRotateStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: layout.btnW / 2 },
      { translateY: layout.btnH / 2 },
      { rotate: `${interpolate(progress.value, [0, 1], [CLOSED_DEG, OPEN_DEG])}deg` },
      { translateX: -layout.btnW / 2 },
      { translateY: -layout.btnH / 2 },
    ],
  }));

  const iconStyle = useAnimatedStyle(() => ({
    top: interpolate(progress.value, [0, 1], [layout.iconClosed.top, layout.iconOpen.top]),
    left: interpolate(progress.value, [0, 1], [layout.iconClosed.left, layout.iconOpen.left]),
    transform: [
      { translateX: layout.iconSize / 2 },
      { translateY: layout.iconSize / 2 },
      {
        rotate: `${interpolate(progress.value, [0, 1], [layout.iconClosed.deg, layout.iconOpen.deg])}deg`,
      },
      { translateX: -layout.iconSize / 2 },
      { translateY: -layout.iconSize / 2 },
    ],
  }));

  const menuStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
  }));

  const scrimStyle = useAnimatedStyle(() => ({
    opacity: progress.value * SCRIM_OPACITY,
  }));

  const itemAnim = (index: number) =>
    useAnimatedStyle(() => ({
      opacity: progress.value,
      transform: [{ translateY: interpolate(progress.value, [0, 1], [4 * (index + 1) * layout.s, 0]) }],
    }));

  const s0 = itemAnim(0);
  const s1 = itemAnim(1);
  const s2 = itemAnim(2);

  return (
    <>
      <AnimatedPressable
        style={[styles.scrim, scrimStyle]}
        pointerEvents={open ? 'auto' : 'none'}
        onPress={close}
      />
      <Animated.View
        style={[
          styles.anchor,
          {
            right: -layout.fabRight,
            bottom: -layout.bottomOffsetClosed,
            width: layout.btnW,
            height: layout.btnH,
          },
          anchorStyle,
        ]}
        pointerEvents="box-none"
      >
      <Animated.View
        style={[
          styles.menu,
          {
            right: layout.menuRightInset,
            bottom: layout.menuBottom,
            width: layout.menuW,
            gap: layout.menuGap,
          },
          menuStyle,
        ]}
        pointerEvents={open ? 'box-none' : 'none'}
      >
        <Animated.View style={[styles.menuRow, s2]}>
          <MenuItem
            width={layout.menuItemVaccinesW}
            height={layout.menuItemH}
            padded={false}
            label={t('fab.vaccines')}
            iconBg={Colors.category.vaccinesBg}
            icon={<MaterialCommunityIcons name="needle" size={18 * layout.s} color={Colors.category.vaccines} />}
            onPress={() => {
              close();
              onVaccinePress();
            }}
          />
        </Animated.View>
        <Animated.View style={[styles.menuRow, s1]}>
          <MenuItem
            width={layout.menuItemHealthW}
            height={layout.menuItemH}
            padded
            label={t('fab.health')}
            iconBg={Colors.category.notesBg}
            icon={<MaterialCommunityIcons name="heart-pulse" size={18 * layout.s} color={Colors.category.notes} />}
            onPress={() => {
              close();
              onHealthPress();
            }}
          />
        </Animated.View>
        <Animated.View style={[styles.menuRow, s0]}>
          <MenuItem
            width={layout.menuItemRemindersW}
            height={layout.menuItemH}
            padded
            label={t('fab.reminders')}
            iconBg={Colors.category.remindersBg}
            icon={<Ionicons name="notifications-outline" size={18 * layout.s} color={Colors.category.reminders} />}
            onPress={() => {
              close();
              onReminderPress();
            }}
          />
        </Animated.View>
      </Animated.View>

      <Animated.View style={btnRotateStyle}>
        <TouchableOpacity
          style={[styles.btn, { width: layout.btnW, height: layout.btnH, borderRadius: layout.btnRadius }]}
          onPress={toggle}
          activeOpacity={0.9}
        >
          <Animated.View style={[styles.iconBox, { width: layout.iconSize, height: layout.iconSize }, iconStyle]}>
            <Ionicons name="add" size={layout.iconSize} color={Colors.surface} />
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>
      </Animated.View>
    </>
  );
}

function MenuItem({
  width,
  height,
  padded,
  label,
  iconBg,
  icon,
  onPress,
}: {
  width: number;
  height: number;
  padded: boolean;
  label: string;
  iconBg: string;
  icon: React.ReactNode;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.menuItem,
        { width, height },
        padded ? styles.menuItemPadded : styles.menuItemVaccines,
      ]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={[styles.menuIcon, { backgroundColor: iconBg }]}>{icon}</View>
      <Text style={styles.menuLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  scrim: {
    position: 'absolute',
    top: -2000,
    bottom: -2000,
    left: -2000,
    right: -2000,
    backgroundColor: '#000000',
    zIndex: 90,
  },
  anchor: {
    position: 'absolute',
    bottom: 0,
    zIndex: 100,
    elevation: 100,
    overflow: 'visible',
  },
  menu: {
    position: 'absolute',
    alignItems: 'flex-end',
    overflow: 'visible',
  },
  menuRow: {
    alignItems: 'flex-end',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
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
    backgroundColor: Colors.brand,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 10,
  },
  iconBox: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
