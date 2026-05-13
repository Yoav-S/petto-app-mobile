import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Spacing } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

type ViewMode = 'days' | 'months' | 'years';

export default function InlineDatePicker() {
  const [viewMode, setViewMode] = useState<ViewMode>('days');

  const days = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
  // Hardcoded grid matching the screenshot for 'April 2026'
  const dates = [
    [31, 1, 2, 3, 4, 5, 6],
    [7, 8, 9, 10, 11, 12, 13],
    [14, 15, 16, 17, 18, 19, 20],
    [21, 22, 23, 24, 25, 26, 27],
    [28, 29, 30, 31, 1, 2, 3]
  ];
  
  const months = [
    ['Jan', 'Feb', 'Mar'],
    ['Apr', 'May', 'Jun'],
    ['Jul', 'Aug', 'Sep'],
    ['Oct', 'Nov', 'Dec']
  ];

  const years = [
    ['2026', '2025', '2024'],
    ['2023', '2022', '2021'],
    ['2020', '2019', '2018'],
    ['2017', '2016', '2015']
  ];

  const selectedDate = 2; // Fixed selection matching screenshot
  const selectedMonth = 'Apr';
  const selectedYear = '2026';

  const renderDaysView = () => (
    <View style={styles.grid}>
      <View style={styles.row}>
        {days.map(day => (
          <Text key={day} style={styles.dayHeader}>{day}</Text>
        ))}
      </View>
      
      {dates.map((week, weekIndex) => (
        <View key={weekIndex} style={styles.row}>
          {week.map((date, dateIndex) => {
            const isSelected = date === selectedDate && weekIndex === 0;
            const isOutMoth = (weekIndex === 0 && date > 20) || (weekIndex === 4 && date < 10);
            
            return (
              <TouchableOpacity 
                key={`${weekIndex}-${dateIndex}`} 
                style={[styles.dateCell, isSelected && styles.selectedDateCell]}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.dateText, 
                  isSelected && styles.selectedDateText,
                  isOutMoth && !isSelected && styles.outMonthText
                ]}>
                  {date}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );

  const renderMonthsView = () => (
    <View style={styles.grid}>
      {months.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.largeGridRow}>
          {row.map((month) => {
            const isSelected = month === selectedMonth;
            return (
              <TouchableOpacity 
                key={month} 
                style={[styles.largeGridCell, isSelected && styles.selectedLargeGridCell]}
                activeOpacity={0.7}
                onPress={() => setViewMode('days')}
              >
                <Text style={[styles.largeGridText, isSelected && styles.selectedLargeGridText]}>
                  {month}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );

  const renderYearsView = () => (
    <View style={styles.grid}>
      {years.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.largeGridRow}>
          {row.map((year) => {
            const isSelected = year === selectedYear;
            const isPast = parseInt(year) < 2026;
            return (
              <TouchableOpacity 
                key={year} 
                style={[styles.largeGridCell, isSelected && styles.selectedLargeGridCell]}
                activeOpacity={0.7}
                onPress={() => setViewMode('days')}
              >
                <Text style={[
                  styles.largeGridText, 
                  isSelected && styles.selectedLargeGridText,
                  isPast && !isSelected && styles.outMonthText
                ]}>
                  {year}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.dropdown}
          onPress={() => setViewMode(viewMode === 'months' ? 'days' : 'months')}
        >
          <Text style={styles.dropdownText}>April</Text>
          <Ionicons name={viewMode === 'months' ? "chevron-up" : "chevron-down"} size={16} color={Colors.primaryText} style={styles.icon} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.dropdown}
          onPress={() => setViewMode(viewMode === 'years' ? 'days' : 'years')}
        >
          <Text style={styles.dropdownText}>2026</Text>
          <Ionicons name={viewMode === 'years' ? "chevron-up" : "chevron-down"} size={16} color={Colors.primaryText} style={styles.icon} />
        </TouchableOpacity>
      </View>
      
      {viewMode === 'days' && renderDaysView()}
      {viewMode === 'months' && renderMonthsView()}
      {viewMode === 'years' && renderYearsView()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    marginBottom: Spacing.lg,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dropdownText: {
    fontFamily: 'Rubik-Medium',
    fontSize: 14,
    color: Colors.primaryText,
  },
  icon: {
    marginLeft: 4,
  },
  grid: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  dayHeader: {
    fontFamily: 'Rubik-Medium',
    fontSize: 14,
    color: Colors.secondaryText,
    width: 32,
    textAlign: 'center',
  },
  dateCell: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedDateCell: {
    backgroundColor: Colors.primaryText,
  },
  dateText: {
    fontFamily: 'Rubik-Regular',
    fontSize: 14,
    color: Colors.primaryText,
  },
  selectedDateText: {
    color: '#FFFFFF',
    fontFamily: 'Rubik-Medium',
  },
  outMonthText: {
    color: '#D1D5DB', // Gray-300
  },
  largeGridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  largeGridCell: {
    flex: 1,
    height: 48,
    marginHorizontal: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.surface,
  },
  selectedLargeGridCell: {
    backgroundColor: Colors.primaryText,
    borderColor: Colors.primaryText,
  },
  largeGridText: {
    fontFamily: 'Rubik-Regular',
    fontSize: 14,
    color: Colors.primaryText,
  },
  selectedLargeGridText: {
    color: '#FFFFFF',
    fontFamily: 'Rubik-Medium',
  },
});
