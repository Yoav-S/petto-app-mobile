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
import { Colors, Radius, Spacing } from '@/constants/theme';
import { t } from '@/i18n';

const PILL_WIDTH = 52;
const PILL_HEIGHT = 72;
const BTN_SIZE = 56;

interface FABMenuProps {
  onVaccinePress: () => void;
  onHealthPress: () => void;
  onReminderPress: () => void;
}

type Point = { x: number; y: number; width: number; height: number };

export default function FABMenu({
  onVaccinePress,
  onHealthPress,
  onReminderPress,
}: FABMenuProps) {
  const [open, setOpen] = useState(false);
  const [point, setPoint] = useState<Point | null>(null);
  const anchorRef = useRef<View>(null);
  const progress = useSharedValue(0);

  const measure = useCallback(() => {
    anchorRef.current?.measureInWindow((x, y, width, height) => {
      setPoint({ x, y, width, height });
    });
  }, []);

  const close = useCallback(() => {
    progress.value = withTiming(0, { duration: 220 });
    setOpen(false);
  }, [progress]);

  const toggle = useCallback(() => {
    if (open) {
      close();
      return;
    }
    anchorRef.current?.measureInWindow((x, y, width, height) => {
      setPoint({ x, y, width, height });
      progress.value = withTiming(1, { duration: 220 });
      setOpen(true);
    });
  }, [close, open, progress]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(progress.value, [0, 1], [0, 45])}deg` }],
  }));

  const itemStyle = (index: number) =>
    useAnimatedStyle(() => ({
      opacity: progress.value,
      transform: [{ translateY: interpolate(progress.value, [0, 1], [8 * (index + 1), 0]) }],
    }));

  const s0 = itemStyle(0);
  const s1 = itemStyle(1);
  const s2 = itemStyle(2);

  const screen = Dimensions.get('window');
  const floatStyle =
    point != null
      ? {
          right: screen.width - point.x - point.width,
          bottom: screen.height - point.y - point.height,
        }
      : null;

  const menu = (
    <View style={styles.menu} pointerEvents="box-none">
      <Animated.View style={[styles.menuRow, s2]}>
        <MenuPill
          label={t('fab.vaccines')}
          bg={Colors.category.vaccinesBg}
          icon={<MaterialCommunityIcons name="needle" size={20} color={Colors.category.vaccines} />}
          onPress={() => {
            close();
            onVaccinePress();
          }}
        />
      </Animated.View>
      <Animated.View style={[styles.menuRow, s1]}>
        <MenuPill
          label={t('fab.health')}
          bg={Colors.category.notesBg}
          icon={<MaterialCommunityIcons name="heart-pulse" size={20} color={Colors.category.notes} />}
          onPress={() => {
            close();
            onHealthPress();
          }}
        />
      </Animated.View>
      <Animated.View style={[styles.menuRow, s0]}>
        <MenuPill
          label={t('fab.reminders')}
          bg={Colors.category.remindersBg}
          icon={<Ionicons name="notifications-outline" size={20} color={Colors.category.reminders} />}
          onPress={() => {
            close();
            onReminderPress();
          }}
        />
      </Animated.View>
    </View>
  );

  const trigger = (
    <TouchableOpacity
      style={[styles.btn, open ? styles.btnOpen : styles.btnPill]}
      onPress={toggle}
      activeOpacity={0.9}
    >
      <Animated.View style={iconStyle}>
        <Ionicons name="add" size={28} color={Colors.surface} />
      </Animated.View>
    </TouchableOpacity>
  );

  const renderColumn = (trackAnchor: boolean) => (
    <View style={styles.column} pointerEvents="box-none">
      {open ? menu : null}
      <View
        ref={trackAnchor ? anchorRef : undefined}
        collapsable={false}
        onLayout={trackAnchor ? measure : undefined}
        style={styles.anchor}
      >
        {trigger}
      </View>
    </View>
  );

  return (
    <>
      <Modal visible={open} transparent animationType="fade" onRequestClose={close}>
        <View style={styles.modal}>
          <Pressable style={styles.backdrop} onPress={close} />
          {floatStyle ? (
            <View style={[styles.float, floatStyle]} pointerEvents="box-none">
              {renderColumn(false)}
            </View>
          ) : null}
        </View>
      </Modal>

      <View style={styles.root} pointerEvents="box-none">
        <View style={open ? styles.rootHidden : undefined} pointerEvents={open ? 'none' : 'auto'}>
          {renderColumn(true)}
        </View>
      </View>
    </>
  );
}

function MenuPill({
  label,
  bg,
  icon,
  onPress,
}: {
  label: string;
  bg: string;
  icon: React.ReactNode;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.pill} onPress={onPress} activeOpacity={0.85}>
      <View style={[styles.pillIcon, { backgroundColor: bg }]}>{icon}</View>
      <Text style={styles.pillLabel}>{label}</Text>
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
  float: {
    position: 'absolute',
    alignItems: 'flex-end',
    overflow: 'visible',
  },
  root: {
    position: 'absolute',
    right: -(Spacing.lg + BTN_SIZE / 2),
    top: -PILL_HEIGHT / 2,
    height: PILL_HEIGHT,
    width: BTN_SIZE,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    zIndex: 50,
    overflow: 'visible',
  },
  rootHidden: {
    opacity: 0,
  },
  column: {
    alignItems: 'flex-end',
    overflow: 'visible',
  },
  anchor: {
    width: BTN_SIZE,
    height: BTN_SIZE,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
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
  pill: {
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
  pillIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillLabel: {
    fontFamily: 'Rubik-Medium',
    fontSize: 16,
    color: Colors.primaryText,
  },
  btn: {
    backgroundColor: Colors.primaryText,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 10,
  },
  btnPill: {
    width: PILL_WIDTH,
    height: PILL_HEIGHT,
    borderRadius: PILL_WIDTH / 2,
  },
  btnOpen: {
    width: BTN_SIZE,
    height: BTN_SIZE,
    borderRadius: Radius.lg,
  },
});
