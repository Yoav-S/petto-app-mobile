import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Radius, Spacing } from '@/constants/theme';

interface ReminderListItemProps {
  title: string;
  subtitle: string;
  timeOrDate: string;
  categoryAccent?: string; // Optional color for the left border highlight
  onPress?: () => void;
}

export default function ReminderListItem({ 
  title, 
  subtitle, 
  timeOrDate, 
  categoryAccent,
  onPress 
}: ReminderListItemProps) {
  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      {categoryAccent && (
        <View style={[styles.leftBorder, { backgroundColor: categoryAccent }]} />
      )}
      
      <View style={styles.contentContainer}>
        <View style={styles.leftContent}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
        <View style={styles.rightContent}>
          {timeOrDate.split('\n').map((line, index) => (
            <Text key={index} style={[
              styles.timeOrDate, 
              index === 0 && timeOrDate.includes('\n') ? styles.primaryTime : null
            ]}>
              {line}
            </Text>
          ))}
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
    flexDirection: 'row',
    overflow: 'hidden',
    minHeight: 72,
  },
  leftBorder: {
    width: 4,
    height: '100%',
  },
  contentContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: Spacing.lg,
  },
  leftContent: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: Spacing.md,
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
    color: Colors.secondaryText,
  },
  rightContent: {
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  timeOrDate: {
    fontFamily: 'Rubik-Regular',
    fontSize: 14,
    color: Colors.secondaryText,
    textAlign: 'right',
  },
  primaryTime: {
    color: Colors.primaryText,
    marginBottom: 2,
  },
});
