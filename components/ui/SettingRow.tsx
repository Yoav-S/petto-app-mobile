import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Spacing, type ThemeColors } from '@/constants/theme';
import { useColors, useThemedStyles } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

interface SettingRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  onPress?: () => void;
  isExpanded?: boolean;
  children?: React.ReactNode;
  hideDivider?: boolean;
}

export default function SettingRow({ 
  icon, 
  label, 
  value, 
  onPress, 
  isExpanded, 
  children,
  hideDivider 
}: SettingRowProps) {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  return (
    <>
      <TouchableOpacity 
        style={styles.container} 
        onPress={onPress} 
        activeOpacity={0.7}
        disabled={!onPress}
      >
        <View style={styles.left}>
          <Ionicons name={icon} size={20} color={colors.primaryText} style={styles.icon} />
          <Text style={styles.label}>{label}</Text>
        </View>
        <Text style={styles.value}>{value}</Text>
      </TouchableOpacity>
      
      {isExpanded && children && (
        <View style={styles.expandedContent}>
          {children}
        </View>
      )}
      
      {!hideDivider && <View style={styles.divider} />}
    </>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: Spacing.sm,
  },
  label: {
    fontFamily: 'Rubik-Medium',
    fontSize: 16,
    color: c.primaryText,
  },
  value: {
    fontFamily: 'Rubik-Regular',
    fontSize: 14,
    color: c.secondaryText,
  },
  expandedContent: {
    paddingHorizontal: Spacing.xs,
  },
  divider: {
    height: 1,
    backgroundColor: c.border,
    width: '100%',
  },
});
