import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/context/ThemeContext';

interface SegmentedControlProps {
  tabs: string[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  /** Maps a tab value to its display label (e.g. for translations). */
  getLabel?: (tab: string) => string;
  /** Design-frame width (375 canvas). Health: 220, Reminders: 335. */
  width?: number;
  style?: StyleProp<ViewStyle>;
}

const DESIGN_WIDTH = 375;
const DESIGN_HEIGHT = 812;

/** Figma segmented pill chrome. */
const SEGMENT = {
  width: 220,
  height: 36,
  padV: 2,
  padH: 4,
  gap: 4,
  radius: 10,
} as const;

export default function SegmentedControl({
  tabs,
  activeTab,
  onTabChange,
  getLabel,
  width: designWidth = SEGMENT.width,
  style,
}: SegmentedControlProps) {
  const styles = useThemedStyles(makeStyles);
  const { width, height } = useWindowDimensions();
  const sx = width / DESIGN_WIDTH;
  const sy = height / DESIGN_HEIGHT;

  const layout = useMemo(
    () => ({
      width: designWidth * sx,
      height: SEGMENT.height * sy,
      padV: SEGMENT.padV * sy,
      padH: SEGMENT.padH * sx,
      gap: SEGMENT.gap * sx,
      radius: SEGMENT.radius * sx,
      tabRadius: Math.max(6, (SEGMENT.radius - 2) * sx),
    }),
    [designWidth, sx, sy],
  );

  return (
    <View style={[styles.wrap, style]}>
      <View
        style={[
          styles.container,
          {
            width: layout.width,
            height: layout.height,
            borderRadius: layout.radius,
            paddingVertical: layout.padV,
            paddingHorizontal: layout.padH,
            gap: layout.gap,
          },
        ]}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tab,
                { borderRadius: layout.tabRadius },
                isActive && styles.activeTab,
              ]}
              onPress={() => onTabChange(tab)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, isActive && styles.activeTabText]} numberOfLines={1}>
                {getLabel ? getLabel(tab) : tab}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    wrap: {
      width: '100%',
      alignItems: 'center',
      marginBottom: 16,
    },
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.track,
      shadowColor: '#1F1F1F',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 3,
    },
    tab: {
      flex: 1,
      height: '100%',
      alignItems: 'center',
      justifyContent: 'center',
    },
    activeTab: {
      backgroundColor: c.surface,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 2,
      elevation: 2,
    },
    tabText: {
      fontFamily: 'Rubik-Medium',
      fontSize: 14,
      lineHeight: 20,
      color: c.secondaryText,
    },
    activeTabText: {
      color: c.primaryText,
    },
  });
