import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing, FontSize, LineHeight } from '@/constants/theme';
import { t } from '@/i18n';

interface PetHeaderProps {
  pet: {
    id: string;
    name: string;
    breed?: string;
    birth_date?: string;
    photo_url?: string;
  } | null;
  petCount: number;
  loading: boolean;
  onSwitchPress: () => void;
}

export default function PetHeader({ pet, petCount, loading, onSwitchPress }: PetHeaderProps) {
  const fadeAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    if (loading) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
          Animated.timing(fadeAnim, { toValue: 0.4, duration: 800, useNativeDriver: true }),
        ])
      ).start();
    } else {
      fadeAnim.stopAnimation();
      fadeAnim.setValue(1);
    }
  }, [loading, fadeAnim]);

  const calculateAge = (birthDateString?: string) => {
    if (!birthDateString) return '';
    const birthDate = new Date(birthDateString);
    const today = new Date();
    let years = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      years--;
    }
    if (years > 0) {
      return `${years} years`;
    } else {
      const months = (today.getFullYear() - birthDate.getFullYear()) * 12 + today.getMonth() - birthDate.getMonth();
      return `${months} months`;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        {petCount > 1 ? (
          <TouchableOpacity style={styles.switchButton} onPress={onSwitchPress}>
            <Ionicons name="swap-horizontal-outline" size={16} color={Colors.primaryText} />
            <Text style={styles.switchText}>{t('home.switch')}</Text>
          </TouchableOpacity>
        ) : (
          <View />
        )}
        <TouchableOpacity>
          <Ionicons name="settings-outline" size={24} color={Colors.primaryText} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.petInfoContainer} onPress={() => { /* Navigate to pet profile */ }}>
        {loading ? (
          <Animated.View style={[styles.avatarSkeleton, { opacity: fadeAnim }]} />
        ) : (
          <Image
            source={{ uri: pet?.photo_url || 'https://via.placeholder.com/100' }}
            style={styles.avatar}
            contentFit="cover"
          />
        )}
        
        {loading ? (
          <Animated.View style={[styles.nameSkeleton, { opacity: fadeAnim }]} />
        ) : (
          <Text style={styles.name}>{pet?.name}</Text>
        )}
        
        {loading ? (
          <Animated.View style={[styles.subtitleSkeleton, { opacity: fadeAnim }]} />
        ) : (
          <Text style={styles.subtitle}>
            {pet?.breed ? `${pet.breed} \u2022 ` : ''}{calculateAge(pet?.birth_date)}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingTop: 60, // approximate safe area
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  switchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 8,
  },
  switchText: {
    fontFamily: 'Rubik-Medium',
    fontSize: 14,
    color: Colors.primaryText,
  },
  petInfoContainer: {
    alignItems: 'center',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: Radius.xl,
    marginBottom: Spacing.md,
  },
  avatarSkeleton: {
    width: 100,
    height: 100,
    borderRadius: Radius.xl,
    backgroundColor: Colors.border,
    marginBottom: Spacing.md,
  },
  name: {
    fontFamily: 'Rubik-Regular',
    fontSize: 28,
    color: Colors.primaryText,
    marginBottom: 4,
  },
  nameSkeleton: {
    width: '60%',
    height: 28,
    borderRadius: 6,
    backgroundColor: Colors.border,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: 'Rubik-Regular',
    fontSize: 14,
    color: Colors.secondaryText,
  },
  subtitleSkeleton: {
    width: '40%',
    height: 14,
    borderRadius: 6,
    backgroundColor: Colors.border,
  },
});
