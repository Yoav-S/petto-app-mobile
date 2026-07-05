import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing } from '@/constants/theme';

interface HealthListItemProps {
  title: string;
  subtitle: string;
  dateOrTime: string;
  icon?: any;
  onPress?: () => void;
  onLongPress?: () => void;
}

export default function HealthListItem({ 
  title, 
  subtitle, 
  dateOrTime, 
  icon,
  onPress,
  onLongPress 
}: HealthListItemProps) {
  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      <View style={styles.contentContainer}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
        <View style={styles.bottomRow}>
          {icon && (
            <Ionicons name={icon} size={16} color={Colors.secondaryText} style={styles.icon} />
          )}
          <Text style={styles.dateOrTime}>{dateOrTime}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    minHeight: 72,
  },
  contentContainer: {
    padding: Spacing.lg,
  },
  title: {
    fontFamily: 'Rubik-Medium',
    fontSize: 16,
    color: Colors.primaryText,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: 'Rubik-Regular',
    fontSize: 14,
    color: Colors.primaryText, // Made darker to match screenshot
    marginBottom: Spacing.md,
    lineHeight: 20,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 4,
  },
  dateOrTime: {
    fontFamily: 'Rubik-Regular',
    fontSize: 12,
    color: Colors.secondaryText,
  },
});
