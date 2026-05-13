import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing } from '@/constants/theme';

interface HealthLogCardProps {
  text: string;
  reminder?: string;
  imageUrl?: string;
}

export default function HealthLogCard({ text, reminder, imageUrl }: HealthLogCardProps) {
  return (
    <View style={styles.card}>
      {imageUrl && (
        <Image 
          source={{ uri: imageUrl }} 
          style={styles.image} 
          contentFit="cover" 
        />
      )}
      
      <Text style={[styles.text, imageUrl ? styles.textWithImage : null]}>{text}</Text>
      
      {reminder && (
        <View style={styles.reminderRow}>
          <Text style={styles.reminderLabel}>Reminder:</Text>
          <Text style={styles.reminderValue}> {reminder}</Text>
        </View>
      )}
      
      <View style={styles.iconRow}>
        <Ionicons name="image-outline" size={20} color={Colors.secondaryText} style={styles.icon} />
        <Ionicons name="notifications-outline" size={20} color={Colors.secondaryText} style={styles.icon} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  image: {
    width: '100%',
    height: 180, // Approximate height matching screenshot
    borderRadius: Radius.md,
    marginBottom: Spacing.md,
  },
  text: {
    fontFamily: 'Rubik-Regular',
    fontSize: 16,
    color: Colors.primaryText,
    lineHeight: 22,
    marginBottom: Spacing.md,
  },
  textWithImage: {
    marginTop: 4,
  },
  reminderRow: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  reminderLabel: {
    fontFamily: 'Rubik-Medium',
    fontSize: 14,
    color: Colors.primaryText,
  },
  reminderValue: {
    fontFamily: 'Rubik-Regular',
    fontSize: 14,
    color: Colors.primaryText,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  icon: {
    marginRight: Spacing.md,
  },
});
