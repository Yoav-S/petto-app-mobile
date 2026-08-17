import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/context/ThemeContext';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';

interface SegmentedControlProps {
  tabs: string[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  getLabel?: (tab: string) => string;
  /** Optional max width. Omit for full content width (lists). Compact tabs pass 220. */
  width?: number;
  style?: StyleProp<ViewStyle>;
}

const SEGMENT = {
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
  width: designWidthCap,
  style,
}: SegmentedControlProps) {
  const styles = useThemedStyles(makeStyles);
  const { contentWidth } = useResponsiveLayout();

  const segmentWidth = useMemo(
    () => (designWidthCap == null ? contentWidth : Math.min(contentWidth, designWidthCap)),
    [contentWidth, designWidthCap],
  );

  return (
    <View style={[styles.wrap, style]}>
      <View
        style={[
          styles.container,
          {
            width: segmentWidth,
            maxWidth: '100%',
          },
        ]}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => onTabChange(tab)}
              activeOpacity={0.85}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]} numberOfLines={1}>
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
    },
    container: {
      flexDirection: 'row',
      height: SEGMENT.height,
      borderRadius: SEGMENT.radius,
      paddingVertical: SEGMENT.padV,
      paddingHorizontal: SEGMENT.padH,
      gap: SEGMENT.gap,
      backgroundColor: c.border,
      alignItems: 'center',
      shadowColor: '#1F1F1F',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 2,
    },
    tab: {
      flex: 1,
      minWidth: 0,
      height: 28,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: Math.max(6, SEGMENT.radius - 2),
    },
    tabActive: {
      backgroundColor: c.surface,
      shadowColor: '#1F1F1F',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
    },
    tabText: {
      fontFamily: 'Rubik-Regular',
      fontSize: 14,
      lineHeight: 20,
      color: c.tabInactiveText,
    },
    tabTextActive: {
      fontFamily: 'Rubik-Medium',
      color: c.primaryText,
    },
  });
