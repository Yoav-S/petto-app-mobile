import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { t } from '@/i18n';

const COVER_HEIGHT = Math.round(Dimensions.get('window').height * 0.36);

interface PetHeaderProps {
  pet: {
    id: string;
    name: string;
    breed?: string | null;
    birth_date?: string | null;
    photo_url?: string | null;
  } | null;
  petCount: number;
  loading: boolean;
  onSwitchPress: () => void;
  onSettingsPress?: () => void;
}

function calculateAge(birthDateString?: string): string {
  if (!birthDateString) return '';
  const birthDate = new Date(birthDateString);
  const today = new Date();
  let years = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    years--;
  }
  if (years > 0) return `${years} years`;
  const months =
    (today.getFullYear() - birthDate.getFullYear()) * 12 +
    today.getMonth() -
    birthDate.getMonth();
  return `${Math.max(months, 0)} months`;
}

export default function PetHeader({
  pet,
  petCount,
  loading,
  onSwitchPress,
  onSettingsPress,
}: PetHeaderProps) {
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    if (loading) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
          Animated.timing(fadeAnim, { toValue: 0.4, duration: 800, useNativeDriver: true }),
        ]),
      ).start();
    } else {
      fadeAnim.stopAnimation();
      fadeAnim.setValue(1);
    }
  }, [loading, fadeAnim]);

  const canSwitch = petCount > 1;

  return (
    <View style={styles.wrapper}>
      <View style={[styles.cover, { height: COVER_HEIGHT }]}>
        {loading ? (
          <Animated.View style={[styles.coverPlaceholder, { opacity: fadeAnim }]} />
        ) : pet?.photo_url ? (
          <Image
            key={pet.id}
            source={{ uri: pet.photo_url }}
            style={styles.coverImage}
            contentFit="cover"
            accessibilityLabel={pet.name ? `${pet.name} photo` : 'Pet photo'}
          />
        ) : (
          <View style={styles.coverPlaceholder}>
            <Ionicons name="paw" size={72} color={Colors.secondaryText} />
          </View>
        )}

        <TouchableOpacity
          style={[styles.settingsButton, { top: insets.top + Spacing.sm }]}
          onPress={onSettingsPress}
          activeOpacity={0.85}
        >
          <Ionicons name="settings-outline" size={22} color={Colors.primaryText} />
        </TouchableOpacity>
      </View>

      <View style={styles.sheet}>
        {loading ? (
          <View style={styles.sheetInner}>
            <Animated.View style={[styles.nameSkeleton, { opacity: fadeAnim }]} />
            <Animated.View style={[styles.subtitleSkeleton, { opacity: fadeAnim }]} />
          </View>
        ) : (
          <View style={styles.sheetInner}>
            <TouchableOpacity
              style={styles.nameRow}
              onPress={canSwitch ? onSwitchPress : undefined}
              activeOpacity={canSwitch ? 0.7 : 1}
            >
              <Text style={styles.name}>{pet?.name ?? t('home.noPet')}</Text>
              {canSwitch ? (
                <Ionicons name="chevron-down" size={22} color={Colors.primaryText} />
              ) : null}
            </TouchableOpacity>
            {pet ? (
              <Text style={styles.subtitle}>
                {[pet.breed, calculateAge(pet.birth_date ?? undefined)].filter(Boolean).join(' \u2022 ')}
              </Text>
            ) : (
              <Text style={styles.emptySubtitle}>{t('home.addFirstPet')}</Text>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: Colors.background,
  },
  cover: {
    width: '100%',
    backgroundColor: '#E8E2D8',
    overflow: 'hidden',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8E2D8',
  },
  settingsButton: {
    position: 'absolute',
    right: Spacing.lg,
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  sheet: {
    marginTop: -40,
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  sheetInner: {
    alignItems: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: 4,
  },
  name: {
    fontFamily: 'Rubik-Regular',
    fontSize: 28,
    color: Colors.primaryText,
  },
  subtitle: {
    fontFamily: 'Rubik-Regular',
    fontSize: 14,
    color: Colors.secondaryText,
  },
  emptySubtitle: {
    fontFamily: 'Rubik-Regular',
    fontSize: 14,
    color: Colors.secondaryText,
    textAlign: 'center',
  },
  nameSkeleton: {
    width: 160,
    height: 28,
    borderRadius: 6,
    backgroundColor: Colors.border,
    marginBottom: 8,
  },
  subtitleSkeleton: {
    width: 120,
    height: 14,
    borderRadius: 6,
    backgroundColor: Colors.border,
  },
});
