import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Spacing, Radius } from '@/constants/theme';

export default function InlineRepeatPicker() {
  const options = [
    'Off',
    'Every day',
    'Every 2 days',
    'Every week',
    'Every 2 weeks',
    'Every month',
    'Every year',
  ];

  return (
    <View style={styles.container}>
      <View style={styles.list}>
        {options.map((option, index) => (
          <View key={option}>
            <TouchableOpacity style={styles.optionRow} activeOpacity={0.7}>
              <Text style={styles.optionText}>{option}</Text>
            </TouchableOpacity>
            {index < options.length - 1 && <View style={styles.divider} />}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  list: {
    width: '80%',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  optionRow: {
    paddingVertical: 14,
    paddingHorizontal: Spacing.lg,
  },
  optionText: {
    fontFamily: 'Rubik-Regular',
    fontSize: 16,
    color: Colors.primaryText,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.md,
  },
});
