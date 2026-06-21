import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Modal,
  Dimensions,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Colors, Spacing } from '@/constants/theme';
import { t } from '@/i18n';

const BTN_W = 52;
const BTN_H = 72;
const BTN_RADIUS = 12;

const CLOSED_DEG = -15;
const OPEN_DEG = -90;
const ANIM_MS = 200;

interface FABMenuProps {
  onVaccinePress: () => void;
  onHealthPress: () => void;
  onReminderPress: () => void;
}

type ScreenAnchor = { right: number; bottom: number };

export default function FABMenu({
  onVaccinePress,
  onHealthPress,
  onReminderPress,
}: FABMenuProps) {
  const [open, setOpen] = useState(false);
  const [frozenAnchor, setFrozenAnchor] = useState<ScreenAnchor | null>(null);
  const btnRef = useRef<View>(null);
  const progress = useSharedValue(0);

  const syncAnchor = useCallback(() => {
    btnRef.current?.measureInWindow((x, y, width, height) => {
      const { width: sw, height: sh } = Dimensions.get('window');
      setFrozenAnchor({
        right: sw - x - width,
        bottom: sh - y - height,
      });
    });
  }, []);

  const close = useCallback(() => {
    progress.value = withTiming(0, { duration: ANIM_MS });
    setOpen(false);
  }, [progress]);

  const openMenu = useCallback(() => {
    btnRef.current?.measureInWindow((x, y, width, height) => {
      const { width: sw, height: sh } = Dimensions.get('window');
      const anchor = {
        right: sw - x - width,
        bottom: sh - y - height,
      };
      setFrozenAnchor(anchor);
      setOpen(true);
      progress.value = withTiming(1, { duration: ANIM_MS });
    });
  }, [progress]);

  const toggle = useCallback(() => {
    if (open) close();
    else openMenu();
  }, [close, open, openMenu]);

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

  const itemAnim = (index: number) =>
    useAnimatedStyle(() => ({
      opacity: progress.value,
      transform: [{ translateY: interpolate(progress.value, [0, 1], [4 * (index + 1), 0]) }],
    }));

  const s0 = itemAnim(0);
  const s1 = itemAnim(1);
  const s2 = itemAnim(2);

  const stack = (
    <View style={styles.stack} pointerEvents="box-none">
      {open ? (
        <View style={styles.menu} pointerEvents="box-none">
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
        </View>
      ) : null}

      <View ref={btnRef} collapsable={false} onLayout={syncAnchor} style={styles.btnSlot}>
        <Animated.View style={btnRotateStyle}>
          <TouchableOpacity style={styles.btn} onPress={toggle} activeOpacity={0.9}>
            <Animated.View style={iconStyle}>
              <Ionicons name="add" size={26} color={Colors.surface} />
            </Animated.View>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );

  const screenAnchor = frozenAnchor;

  return (
    <>
      <Modal visible={open} transparent animationType="fade" onRequestClose={close}>
        <View style={styles.modalRoot} pointerEvents="box-none">
          <Pressable style={styles.backdrop} onPress={close} />
          {screenAnchor ? (
            <View
              style={[
                styles.floating,
                { right: screenAnchor.right, bottom: screenAnchor.bottom },
              ]}
              pointerEvents="box-none"
            >
              {stack}
            </View>
          ) : null}
        </View>
      </Modal>

      {!open ? <View style={styles.anchor}>{stack}</View> : null}
    </>
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
  modalRoot: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  floating: {
    position: 'absolute',
    alignItems: 'flex-end',
    overflow: 'visible',
  },
  anchor: {
    position: 'absolute',
    right: -(Spacing.lg + BTN_W / 2),
    bottom: 0,
    overflow: 'visible',
    zIndex: 60,
  },
  stack: {
    alignItems: 'flex-end',
    overflow: 'visible',
  },
  menu: {
    alignItems: 'flex-end',
    gap: 8,
    marginBottom: 4,
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
  btnSlot: {
    width: BTN_W,
    height: BTN_H,
    overflow: 'visible',
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
