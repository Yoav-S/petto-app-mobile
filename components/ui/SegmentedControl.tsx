import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { type ThemeColors } from '@/constants/theme';
import { useColors, useThemedStyles } from '@/context/ThemeContext';

interface SegmentedControlProps {
  tabs: string[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  getLabel?: (tab: string) => string;
  style?: StyleProp<ViewStyle>;
}

const TAB_SHADOW = {
  shadowColor: '#2D2D2A',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0x14 / 255,
  shadowRadius: 20,
  elevation: 4,
} as const;

export default function SegmentedControl({
  tabs,
  activeTab,
  onTabChange,
  getLabel,
  style,
}: SegmentedControlProps) {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);

  return (
    <View style={[styles.row, style]}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab;
        return (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, isActive && { backgroundColor: colors.brand }]}
            onPress={() => onTabChange(tab)}
            activeOpacity={0.85}
          >
            <Text style={[styles.label, isActive && styles.labelActive]} numberOfLines={1}>
              {getLabel ? getLabel(tab) : tab}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      height: 28,
      gap: 8,
    },
    tab: {
      height: 28,
      boxSizing: 'border-box',
      borderRadius: 10,
      paddingTop: 4,
      paddingBottom: 4,
      paddingLeft: 8,
      paddingRight: 8,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.surface,
      ...TAB_SHADOW,
    },
    label: {
      fontFamily: 'Rubik-Medium',
      fontSize: 14,
      lineHeight: 20,
      color: c.primaryText,
      textAlign: 'center',
    },
    labelActive: {
      color: c.button.primaryText,
    },
  });
