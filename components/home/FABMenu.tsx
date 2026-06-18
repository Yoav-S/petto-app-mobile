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
  const triggerRef = useRef<View>(null);
  const animation = useSharedValue(0);

  const measureTrigger = useCallback(() => {
    triggerRef.current?.measureInWindow((x, y, width, height) => {
      setAnchor({ x, y, width, height });
    });
  }, []);

  const closeMenu = useCallback(() => {
    animation.value = withTiming(0, { duration: 240 });
    setIsOpen(false);
  }, [animation]);

  const openMenu = useCallback(() => {
    triggerRef.current?.measureInWindow((x, y, width, height) => {
      setAnchor({ x, y, width, height });
      animation.value = withTiming(1, { duration: 240 });
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
          translateY: interpolate(animation.value, [0, 1], [10 * (index + 1), 0]),
        },
      ],
    }));

  const item1Style = createMenuItemStyle(0);
  const item2Style = createMenuItemStyle(1);
  const item3Style = createMenuItemStyle(2);

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

  const renderTrigger = (attachRef: boolean) => (
    <View
      ref={attachRef ? triggerRef : undefined}
      collapsable={false}
      onLayout={attachRef ? measureTrigger : undefined}
    >
      <TouchableOpacity
        style={[styles.fab, isOpen ? styles.fabOpen : styles.fabPill]}
        onPress={toggleMenu}
        activeOpacity={0.9}
      >
        <Animated.View style={fabIconStyle}>
          <Ionicons name="add" size={28} color={Colors.surface} />
        </Animated.View>
      </TouchableOpacity>
    </View>
  );

  const renderStack = (layer: 'inline' | 'modal') => {
    const hidden = layer === 'inline' && isOpen;
    const show = layer === 'modal' ? isOpen : !isOpen;

    if (!show) return null;

    const modalPosition =
      layer === 'modal' && anchor
        ? {
            position: 'absolute' as const,
            left: anchor.x + (anchor.width - FAB_OPEN_SIZE) / 2,
            top: anchor.y + (anchor.height - FAB_OPEN_SIZE) / 2,
          }
        : null;

    return (
      <View
        style={[styles.stack, modalPosition, hidden ? styles.hidden : null]}
        pointerEvents="box-none"
      >
        {isOpen ? renderMenu() : null}
        {renderTrigger(layer === 'inline')}
      </View>
    );
  };

  return (
    <>
      <Modal visible={isOpen} transparent animationType="fade" onRequestClose={closeMenu}>
        <View style={styles.modalRoot}>
          <Pressable style={styles.overlay} onPress={closeMenu} />
          {renderStack('modal')}
        </View>
      </Modal>

      <View style={styles.host} pointerEvents="box-none">
        {renderStack('inline')}
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
  host: {
    position: 'absolute',
    right: -(Spacing.lg + FAB_WIDTH / 2),
    top: -FAB_PILL_HEIGHT / 2,
    height: FAB_PILL_HEIGHT,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    zIndex: 40,
  },
  stack: {
    alignItems: 'flex-end',
  },
  hidden: {
    opacity: 0,
  },
  menuStack: {
    alignItems: 'flex-end',
    gap: 10,
    marginBottom: 12,
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
