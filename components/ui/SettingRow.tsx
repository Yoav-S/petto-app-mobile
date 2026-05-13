import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Spacing } from '@/constants/theme';
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
  return (
    <>
      <TouchableOpacity 
        style={styles.container} 
        onPress={onPress} 
        activeOpacity={0.7}
        disabled={!onPress}
      >
        <View style={styles.left}>
          <Ionicons name={icon} size={20} color={Colors.primaryText} style={styles.icon} />
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

const styles = StyleSheet.create({
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
    color: Colors.primaryText,
  },
  value: {
    fontFamily: 'Rubik-Regular',
    fontSize: 14,
    color: Colors.secondaryText,
  },
  expandedContent: {
    paddingHorizontal: Spacing.xs,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    width: '100%',
  },
});
