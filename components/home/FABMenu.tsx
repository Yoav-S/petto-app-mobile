import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Modal,
  Dimensions,
  type LayoutChangeEvent,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { t } from '@/i18n';

export const FAB_WIDTH = 52;
export const FAB_PILL_HEIGHT = 72;
export const FAB_OPEN_SIZE = 56;
export const FAB_SIZE = FAB_OPEN_SIZE;

interface FABMenuProps {
  onVaccinePress: () => void;
  onHealthPress: () => void;
  onReminderPress: () => void;
}

type AnchorRect = { x: number; y: number; width: number; height: number };

export default function FABMenu({
  onVaccinePress,
  onHealthPress,
  onReminderPress,
}: FABMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [anchor, setAnchor] = useState<AnchorRect | null>(null);
  const slotRef = useRef<View>(null);
  const animation = useSharedValue(0);

  const syncAnchor = useCallback(() => {
    slotRef.current?.measureInWindow((x, y, width, height) => {
      setAnchor({ x, y, width, height });
    });
  }, []);

  const onSlotLayout = useCallback(
    (_event: LayoutChangeEvent) => {
      syncAnchor();
    },
    [syncAnchor],
  );

  const closeMenu = useCallback(() => {
    animation.value = withTiming(0, { duration: 220 });
    setIsOpen(false);
  }, [animation]);

  const openMenu = useCallback(() => {
    slotRef.current?.measureInWindow((x, y, width, height) => {
      setAnchor({ x, y, width, height });
      animation.value = withTiming(1, { duration: 220 });
      setIsOpen(true);
    });
  }, [animation]);

  const toggleMenu = () => {
    if (isOpen) closeMenu();
    else openMenu();
  };

  const fabIconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(animation.value, [0, 1], [0, 45])}deg` }],
  }));

  const createMenuItemStyle = (index: number) =>
    useAnimatedStyle(() => ({
      opacity: animation.value,
      transform: [
        {
          translateY: interpolate(animation.value, [0, 1], [8 * (index + 1), 0]),
        },
      ],
    }));

  const item1Style = createMenuItemStyle(0);
  const item2Style = createMenuItemStyle(1);
  const item3Style = createMenuItemStyle(2);

  const windowSize = Dimensions.get('window');

  const modalAnchorStyle =
    anchor != null
      ? {
          right: windowSize.width - anchor.x - anchor.width,
          bottom: windowSize.height - anchor.y - anchor.height,
        }
      : null;

  const renderMenu = () => (
    <View style={styles.menuStack} pointerEvents="box-none">
      <Animated.View style={[styles.menuItemRow, item3Style]}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => {
            closeMenu();
            onVaccinePress();
          }}
          activeOpacity={0.85}
        >
          <View style={[styles.menuIcon, { backgroundColor: Colors.category.vaccinesBg }]}>
            <MaterialCommunityIcons name="needle" size={20} color={Colors.category.vaccines} />
          </View>
          <Text style={styles.menuLabel}>{t('fab.vaccines')}</Text>
        </TouchableOpacity>
      </Animated.View>

      <Animated.View style={[styles.menuItemRow, item2Style]}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => {
            closeMenu();
            onHealthPress();
          }}
          activeOpacity={0.85}
        >
          <View style={[styles.menuIcon, { backgroundColor: Colors.category.notesBg }]}>
            <MaterialCommunityIcons name="heart-pulse" size={20} color={Colors.category.notes} />
          </View>
          <Text style={styles.menuLabel}>{t('fab.health')}</Text>
        </TouchableOpacity>
      </Animated.View>

      <Animated.View style={[styles.menuItemRow, item1Style]}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => {
            closeMenu();
            onReminderPress();
          }}
          activeOpacity={0.85}
        >
          <View style={[styles.menuIcon, { backgroundColor: Colors.category.remindersBg }]}>
            <Ionicons name="notifications-outline" size={20} color={Colors.category.reminders} />
          </View>
          <Text style={styles.menuLabel}>{t('fab.reminders')}</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );

  const renderFabStack = (opts: { interactive: boolean; attachRef: boolean }) => (
    <View style={styles.stack} pointerEvents="box-none">
      {isOpen ? renderMenu() : null}
      <View
        ref={opts.attachRef ? slotRef : undefined}
        collapsable={false}
        onLayout={opts.attachRef ? onSlotLayout : undefined}
        style={styles.triggerSlot}
      >
        <TouchableOpacity
          style={[styles.fab, isOpen ? styles.fabOpen : styles.fabPill]}
          onPress={opts.interactive ? toggleMenu : undefined}
          activeOpacity={0.9}
          disabled={!opts.interactive}
        >
          <Animated.View style={fabIconStyle}>
            <Ionicons name="add" size={28} color={Colors.surface} />
          </Animated.View>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <>
      <Modal visible={isOpen} transparent animationType="fade" onRequestClose={closeMenu}>
        <View style={styles.modalRoot}>
          <Pressable style={styles.overlay} onPress={closeMenu} />
          {modalAnchorStyle ? (
            <View style={[styles.modalAnchor, modalAnchorStyle]} pointerEvents="box-none">
              {renderFabStack({ interactive: true, attachRef: false })}
            </View>
          ) : null}
        </View>
      </Modal>

      <View style={styles.host} pointerEvents="box-none">
        <View style={isOpen ? styles.hostHidden : undefined} pointerEvents={isOpen ? 'none' : 'auto'}>
          {renderFabStack({ interactive: !isOpen, attachRef: true })}
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalAnchor: {
    position: 'absolute',
    alignItems: 'flex-end',
    overflow: 'visible',
  },
  host: {
    position: 'absolute',
    right: -(Spacing.lg + FAB_OPEN_SIZE / 2),
    top: -FAB_PILL_HEIGHT / 2,
    width: FAB_OPEN_SIZE,
    height: FAB_PILL_HEIGHT,
    zIndex: 40,
    overflow: 'visible',
  },
  hostHidden: {
    opacity: 0,
  },
  stack: {
    alignItems: 'flex-end',
    overflow: 'visible',
  },
  triggerSlot: {
    width: FAB_OPEN_SIZE,
    height: FAB_OPEN_SIZE,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },
  menuStack: {
    alignItems: 'flex-end',
    gap: 10,
    marginBottom: 10,
    overflow: 'visible',
  },
  menuItemRow: {
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
    elevation: 6,
    gap: 12,
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
  fab: {
    backgroundColor: Colors.primaryText,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 10,
  },
  fabPill: {
    width: FAB_WIDTH,
    height: FAB_PILL_HEIGHT,
    borderRadius: FAB_WIDTH / 2,
  },
  fabOpen: {
    width: FAB_OPEN_SIZE,
    height: FAB_OPEN_SIZE,
    borderRadius: Radius.lg,
  },
});
