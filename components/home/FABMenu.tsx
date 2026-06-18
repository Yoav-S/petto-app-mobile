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
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { t } from '@/i18n';

/** Matches VaccinesCard / RemindersCard minHeight */
export const HOME_TOP_ROW_MIN_HEIGHT = 156;
export const HOME_ROW_GAP = Spacing.md;

export const FAB_WIDTH = 52;
export const FAB_PILL_HEIGHT = 88;
export const FAB_OPEN_SIZE = 56;

/** Legacy alias used by home layout spacing */
export const FAB_SIZE = FAB_OPEN_SIZE;

const FAB_ANCHOR_TOP = HOME_TOP_ROW_MIN_HEIGHT / 2 + HOME_ROW_GAP;

interface FABMenuProps {
  onVaccinePress: () => void;
  onHealthPress: () => void;
  onReminderPress: () => void;
  /** Pin FAB to the gutter between the top row and Health card */
  anchored?: boolean;
}

type FabWindowRect = { x: number; y: number; width: number; height: number };

export default function FABMenu({
  onVaccinePress,
  onHealthPress,
  onReminderPress,
  anchored = false,
}: FABMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [fabRect, setFabRect] = useState<FabWindowRect | null>(null);
  const fabRef = useRef<View>(null);
  const animation = useSharedValue(0);

  const measureFab = useCallback(() => {
    fabRef.current?.measureInWindow((x, y, width, height) => {
      setFabRect({ x, y, width, height });
    });
  }, []);

  const closeMenu = useCallback(() => {
    animation.value = withTiming(0, { duration: 280 });
    setIsOpen(false);
  }, [animation]);

  const openMenu = useCallback(() => {
    fabRef.current?.measureInWindow((x, y, width, height) => {
      setFabRect({ x, y, width, height });
      animation.value = withTiming(1, { duration: 280 });
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
          translateY: interpolate(animation.value, [0, 1], [12 * (index + 1), 0]),
        },
      ],
    }));

  const item1Style = createMenuItemStyle(0);
  const item2Style = createMenuItemStyle(1);
  const item3Style = createMenuItemStyle(2);

  const windowWidth = Dimensions.get('window').width;
  const windowHeight = Dimensions.get('window').height;

  const menuLayerStyle =
    fabRect != null
      ? {
          right: Math.max(8, windowWidth - fabRect.x - fabRect.width),
          bottom: Math.max(8, windowHeight - fabRect.y + Spacing.md),
        }
      : null;

  const renderMenuItems = () => (
    <View style={styles.menuItems} pointerEvents="box-none">
      <Animated.View style={[styles.menuItemWrapper, item3Style]}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => {
            closeMenu();
            onVaccinePress();
          }}
          activeOpacity={0.85}
        >
          <View style={[styles.iconContainer, { backgroundColor: Colors.category.vaccinesBg }]}>
            <MaterialCommunityIcons name="needle" size={20} color={Colors.category.vaccines} />
          </View>
          <Text style={styles.menuItemText}>{t('fab.vaccines')}</Text>
        </TouchableOpacity>
      </Animated.View>

      <Animated.View style={[styles.menuItemWrapper, item2Style]}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => {
            closeMenu();
            onHealthPress();
          }}
          activeOpacity={0.85}
        >
          <View style={[styles.iconContainer, { backgroundColor: Colors.category.notesBg }]}>
            <MaterialCommunityIcons name="heart-pulse" size={20} color={Colors.category.notes} />
          </View>
          <Text style={styles.menuItemText}>{t('fab.health')}</Text>
        </TouchableOpacity>
      </Animated.View>

      <Animated.View style={[styles.menuItemWrapper, item1Style]}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => {
            closeMenu();
            onReminderPress();
          }}
          activeOpacity={0.85}
        >
          <View style={[styles.iconContainer, { backgroundColor: Colors.category.remindersBg }]}>
            <Ionicons name="notifications-outline" size={20} color={Colors.category.reminders} />
          </View>
          <Text style={styles.menuItemText}>{t('fab.reminders')}</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );

  const renderModal = () => (
    <Modal visible={isOpen} transparent animationType="fade" onRequestClose={closeMenu}>
      <View style={styles.modalRoot}>
        <Pressable style={styles.modalOverlay} onPress={closeMenu} />
        {fabRect && menuLayerStyle ? (
          <View style={[styles.modalMenuLayer, menuLayerStyle]} pointerEvents="box-none">
            {renderMenuItems()}
          </View>
        ) : null}
        {isOpen && fabRect ? (
          <TouchableOpacity
            style={[
              styles.fab,
              styles.fabOpen,
              {
                position: 'absolute',
                left: fabRect.x,
                top: fabRect.y,
                width: fabRect.width,
                height: fabRect.height,
              },
            ]}
            onPress={toggleMenu}
            activeOpacity={0.9}
          >
            <Animated.View style={fabIconStyle}>
              <Ionicons name="add" size={28} color={Colors.surface} />
            </Animated.View>
          </TouchableOpacity>
        ) : null}
      </View>
    </Modal>
  );

  if (!anchored) {
    return (
      <>
        {renderModal()}
        <View style={styles.containerScreen} pointerEvents="box-none">
          <View ref={fabRef} collapsable={false} onLayout={measureFab}>
            <TouchableOpacity
              style={[styles.fab, isOpen ? styles.fabOpen : styles.fabCircle]}
              onPress={toggleMenu}
              activeOpacity={0.9}
            >
              <Animated.View style={fabIconStyle}>
                <Ionicons name="add" size={28} color={Colors.surface} />
              </Animated.View>
            </TouchableOpacity>
          </View>
        </View>
      </>
    );
  }

  return (
    <>
      {renderModal()}
      <View style={styles.anchoredRoot} pointerEvents="box-none">
        {!isOpen ? (
          <TouchableOpacity
            style={[styles.fab, styles.fabPill, styles.closedPill]}
            onPress={openMenu}
            activeOpacity={0.9}
          >
            <Ionicons name="add" size={28} color={Colors.surface} />
          </TouchableOpacity>
        ) : null}

        <View ref={fabRef} collapsable={false} style={styles.openFabAnchor} onLayout={measureFab}>
          <View style={styles.openFabPlaceholder} />
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalMenuLayer: {
    position: 'absolute',
    alignItems: 'flex-end',
    zIndex: 2,
  },
  containerScreen: {
    position: 'absolute',
    bottom: 32,
    right: -FAB_OPEN_SIZE / 2 + 8,
    zIndex: 20,
    alignItems: 'flex-end',
  },
  anchoredRoot: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
    overflow: 'visible',
  },
  closedPill: {
    position: 'absolute',
    top: -FAB_ANCHOR_TOP,
    right: -FAB_WIDTH / 2,
  },
  openFabAnchor: {
    position: 'absolute',
    right: -FAB_OPEN_SIZE / 2,
    bottom: -FAB_OPEN_SIZE / 2,
  },
  openFabPlaceholder: {
    width: FAB_OPEN_SIZE,
    height: FAB_OPEN_SIZE,
    opacity: 0,
  },
  menuItems: {
    alignItems: 'flex-end',
    gap: 12,
  },
  menuItemWrapper: {
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
    elevation: 4,
    gap: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuItemText: {
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
    elevation: 8,
    zIndex: 3,
  },
  fabPill: {
    width: FAB_WIDTH,
    height: FAB_PILL_HEIGHT,
    borderRadius: FAB_WIDTH / 2,
  },
  fabCircle: {
    width: FAB_OPEN_SIZE,
    height: FAB_OPEN_SIZE,
    borderRadius: FAB_OPEN_SIZE / 2,
  },
  fabOpen: {
    width: FAB_OPEN_SIZE,
    height: FAB_OPEN_SIZE,
    borderRadius: Radius.lg,
  },
});
