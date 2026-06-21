import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Modal,
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

/** Vertical pill — matches mockup proportions */
const PILL_W = 52;
const PILL_H = 72;

interface FABMenuProps {
  onVaccinePress: () => void;
  onHealthPress: () => void;
  onReminderPress: () => void;
}

export default function FABMenu({
  onVaccinePress,
  onHealthPress,
  onReminderPress,
}: FABMenuProps) {
  const [open, setOpen] = useState(false);
  const progress = useSharedValue(0);
  const pillRef = useRef<View>(null);
  const [screenPos, setScreenPos] = useState<{ x: number; y: number } | null>(null);

  const close = useCallback(() => {
    progress.value = withTiming(0, { duration: 200 });
    setOpen(false);
  }, [progress]);

  const openMenu = useCallback(() => {
    pillRef.current?.measureInWindow((x, y) => {
      setScreenPos({ x, y });
      progress.value = withTiming(1, { duration: 200 });
      setOpen(true);
    });
  }, [progress]);

  const toggle = useCallback(() => {
    if (open) close();
    else openMenu();
  }, [close, open, openMenu]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(progress.value, [0, 1], [0, 45])}deg` }],
  }));

  const itemAnim = (index: number) =>
    useAnimatedStyle(() => ({
      opacity: progress.value,
      transform: [{ translateY: interpolate(progress.value, [0, 1], [8 * (index + 1), 0]) }],
    }));

  const s0 = itemAnim(0);
  const s1 = itemAnim(1);
  const s2 = itemAnim(2);

  const menu = open ? (
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
  ) : null;

  const pill = (
    <View ref={pillRef} collapsable={false} style={styles.pillWrap}>
      <TouchableOpacity style={styles.pill} onPress={toggle} activeOpacity={0.9}>
        <Animated.View style={iconStyle}>
          <Ionicons name="add" size={26} color={Colors.surface} />
        </Animated.View>
      </TouchableOpacity>
    </View>
  );

  const stack = (
    <View style={styles.stack} pointerEvents="box-none">
      {menu}
      {pill}
    </View>
  );

  return (
    <>
      <Modal visible={open} transparent animationType="fade" onRequestClose={close}>
        <View style={styles.modalRoot} pointerEvents="box-none">
          <Pressable style={styles.backdrop} onPress={close} />
          {screenPos ? (
            <View
              style={[styles.floating, { left: screenPos.x, top: screenPos.y }]}
              pointerEvents="box-none"
            >
              {stack}
            </View>
          ) : null}
        </View>
      </Modal>

      <View style={[styles.anchor, open && styles.anchorHidden]} pointerEvents={open ? 'none' : 'auto'}>
        {stack}
      </View>
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
    overflow: 'visible',
  },
  anchor: {
    position: 'absolute',
    right: -(Spacing.lg + PILL_W / 2),
    top: -(Spacing.md / 2 + PILL_H / 2),
    overflow: 'visible',
    zIndex: 60,
  },
  anchorHidden: {
    opacity: 0,
  },
  stack: {
    alignItems: 'flex-end',
    overflow: 'visible',
  },
  menu: {
    position: 'absolute',
    right: 0,
    bottom: PILL_H + 10,
    alignItems: 'flex-end',
    gap: 10,
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
  pillWrap: {
    width: PILL_W,
    height: PILL_H,
  },
  pill: {
    width: PILL_W,
    height: PILL_H,
    borderRadius: PILL_W / 2,
    backgroundColor: Colors.primaryText,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 10,
  },
});
