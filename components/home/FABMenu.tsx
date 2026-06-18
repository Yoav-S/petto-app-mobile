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

const PILL_W = 52;
const PILL_H = 72;

interface FABMenuProps {
  onVaccinePress: () => void;
  onHealthPress: () => void;
  onReminderPress: () => void;
}

type Rect = { x: number; y: number };

export default function FABMenu({
  onVaccinePress,
  onHealthPress,
  onReminderPress,
}: FABMenuProps) {
  const [open, setOpen] = useState(false);
  const [origin, setOrigin] = useState<Rect | null>(null);
  const hubRef = useRef<View>(null);
  const progress = useSharedValue(0);

  const close = useCallback(() => {
    progress.value = withTiming(0, { duration: 200 });
    setOpen(false);
  }, [progress]);

  const toggle = useCallback(() => {
    if (open) {
      close();
      return;
    }
    hubRef.current?.measureInWindow((x, y) => {
      setOrigin({ x, y });
      progress.value = withTiming(1, { duration: 200 });
      setOpen(true);
    });
  }, [close, open, progress]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(progress.value, [0, 1], [0, 45])}deg` }],
  }));

  const fadeUp = (i: number) =>
    useAnimatedStyle(() => ({
      opacity: progress.value,
      transform: [{ translateY: interpolate(progress.value, [0, 1], [6 * (i + 1), 0]) }],
    }));

  const a0 = fadeUp(0);
  const a1 = fadeUp(1);
  const a2 = fadeUp(2);

  const hubBody = (
    <>
      {open ? (
        <View style={styles.menu} pointerEvents="box-none">
          <Animated.View style={[styles.menuRow, a2]}>
            <ActionPill
              label={t('fab.vaccines')}
              iconBg={Colors.category.vaccinesBg}
              icon={<MaterialCommunityIcons name="needle" size={20} color={Colors.category.vaccines} />}
              onPress={() => {
                close();
                onVaccinePress();
              }}
            />
          </Animated.View>
          <Animated.View style={[styles.menuRow, a1]}>
            <ActionPill
              label={t('fab.health')}
              iconBg={Colors.category.notesBg}
              icon={<MaterialCommunityIcons name="heart-pulse" size={20} color={Colors.category.notes} />}
              onPress={() => {
                close();
                onHealthPress();
              }}
            />
          </Animated.View>
          <Animated.View style={[styles.menuRow, a0]}>
            <ActionPill
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

      <TouchableOpacity style={styles.pill} onPress={toggle} activeOpacity={0.9}>
        <Animated.View style={iconStyle}>
          <Ionicons name="add" size={26} color={Colors.surface} />
        </Animated.View>
      </TouchableOpacity>
    </>
  );

  return (
    <>
      <Modal visible={open} transparent animationType="fade" onRequestClose={close}>
        <View style={styles.modal} pointerEvents="box-none">
          <Pressable style={styles.backdrop} onPress={close} />
          {origin ? (
            <View
              style={[styles.hub, styles.modalHub, { left: origin.x, top: origin.y }]}
              pointerEvents="box-none"
            >
              {hubBody}
            </View>
          ) : null}
        </View>
      </Modal>

      {!open ? (
        <View style={styles.slot} pointerEvents="auto">
          <View ref={hubRef} collapsable={false} style={styles.hub}>
            {hubBody}
          </View>
        </View>
      ) : null}
    </>
  );
}

function ActionPill({
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
    <TouchableOpacity style={styles.action} onPress={onPress} activeOpacity={0.85}>
      <View style={[styles.actionIcon, { backgroundColor: iconBg }]}>{icon}</View>
      <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  modal: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalHub: {
    position: 'absolute',
  },
  slot: {
    position: 'absolute',
    right: -(Spacing.lg + PILL_W / 2),
    top: -PILL_H / 2,
    zIndex: 50,
    overflow: 'visible',
  },
  hub: {
    alignItems: 'flex-end',
    overflow: 'visible',
  },
  menu: {
    alignItems: 'flex-end',
    gap: 10,
    marginBottom: 10,
    overflow: 'visible',
  },
  menuRow: {
    alignItems: 'flex-end',
  },
  action: {
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
  actionIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionLabel: {
    fontFamily: 'Rubik-Medium',
    fontSize: 16,
    color: Colors.primaryText,
  },
  pill: {
    width: PILL_W,
    height: PILL_H,
    borderRadius: PILL_W / 2,
    backgroundColor: Colors.primaryText,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 10,
  },
});
