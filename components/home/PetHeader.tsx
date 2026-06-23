import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  useWindowDimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing } from '@/constants/theme';
import { t } from '@/i18n';

export const DESIGN_WIDTH = 375;
export const DESIGN_PANEL_TOP = 316;
export const DESIGN_PANEL_HEIGHT = 496;
export const DESIGN_PANEL_RADIUS = 24;

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
  children?: React.ReactNode;
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
  children,
}: PetHeaderProps) {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const fadeAnim = useRef(new Animated.Value(0.4)).current;

  const layoutScale = screenWidth / DESIGN_WIDTH;
  const coverHeight = Math.round(DESIGN_PANEL_TOP * layoutScale);
  const panelMinHeight = Math.round(DESIGN_PANEL_HEIGHT * layoutScale);

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
      <View style={[styles.cover, { height: coverHeight }]}>
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

      <View
        style={[
          styles.panel,
          {
            minHeight: panelMinHeight,
            borderTopLeftRadius: DESIGN_PANEL_RADIUS,
            borderTopRightRadius: DESIGN_PANEL_RADIUS,
          },
        ]}
      >
        {loading ? (
          <View style={styles.nameSection}>
            <Animated.View style={[styles.nameSkeleton, { opacity: fadeAnim }]} />
            <Animated.View style={[styles.subtitleSkeleton, { opacity: fadeAnim }]} />
          </View>
        ) : (
          <View style={styles.nameSection}>
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

        {children}
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
    borderRadius: 12,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  panel: {
    backgroundColor: Colors.surface,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
    overflow: 'visible',
  },
  nameSection: {
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
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
