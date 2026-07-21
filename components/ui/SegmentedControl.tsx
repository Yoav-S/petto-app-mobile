import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Radius, Spacing, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/context/ThemeContext';

interface SegmentedControlProps {
  tabs: string[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  /** Maps a tab value to its display label (e.g. for translations). */
  getLabel?: (tab: string) => string;
}

export default function SegmentedControl({
  tabs,
  activeTab,
  onTabChange,
  getLabel,
}: SegmentedControlProps) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab;
        return (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, isActive && styles.activeTab]}
            onPress={() => onTabChange(tab)}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, isActive && styles.activeTabText]}>
              {getLabel ? getLabel(tab) : tab}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: c.border, // using border color as light gray background
    borderRadius: Radius.md,
    padding: 4,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.sm,
  },
  activeTab: {
    backgroundColor: c.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontFamily: 'Rubik-Medium',
    fontSize: 14,
    color: c.secondaryText,
  },
  activeTabText: {
    color: c.primaryText,
  },
});
