import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing } from '@/constants/theme';

export default function InlineTimePicker() {
  return (
    <View style={styles.container}>
      <View style={styles.wheelContainer}>
        {/* Top Fade Row */}
        <View style={styles.fadeRow}>
          <Text style={styles.fadeText}>06</Text>
          <Text style={styles.fadeText}>27</Text>
          <Text style={styles.fadeText}>54</Text>
        </View>

        {/* Separator Top */}
        <View style={styles.separator} />

        {/* Active Row */}
        <View style={styles.activeRow}>
          <Text style={styles.activeText}>06</Text>
          <Text style={styles.colon}>:</Text>
          <Text style={styles.activeText}>28</Text>
          <Text style={styles.colon}>:</Text>
          <Text style={styles.activeText}>55</Text>
        </View>

        {/* Separator Bottom */}
        <View style={styles.separator} />

        {/* Bottom Fade Row */}
        <View style={styles.fadeRow}>
          <Text style={styles.fadeText}>06</Text>
          <Text style={styles.fadeText}>27</Text>
          <Text style={styles.fadeText}>54</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  wheelContainer: {
    width: '100%',
    alignItems: 'center',
  },
  fadeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '70%',
    paddingVertical: Spacing.md,
  },
  fadeText: {
    fontFamily: 'Rubik-Regular',
    fontSize: 18,
    color: '#D1D5DB', // Matches screenshot inactive
    width: 40,
    textAlign: 'center',
  },
  separator: {
    height: 1,
    backgroundColor: Colors.border,
    width: '100%',
  },
  activeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '70%',
    paddingVertical: Spacing.md,
  },
  activeText: {
    fontFamily: 'Rubik-Medium',
    fontSize: 22,
    color: Colors.primaryText,
    width: 40,
    textAlign: 'center',
  },
  colon: {
    fontFamily: 'Rubik-Medium',
    fontSize: 22,
    color: Colors.primaryText,
    marginHorizontal: Spacing.sm,
  },
});
