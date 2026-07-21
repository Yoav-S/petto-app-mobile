import { Spacing, type ThemeColors } from '@/constants/theme';
import { useColors, useThemedStyles } from '@/context/ThemeContext';
import { t } from '@/i18n';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const DESIGN_WIDTH = 375;
export const DESIGN_HEIGHT = 812;
export const DESIGN_COVER_HEIGHT = 340;
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
  onLogout?: () => void;
  onSettingsPress?: () => void;
  onCoverPress?: () => void;
  onEditProfile?: () => void;
  onReturnHome?: () => void;
  profileActive?: boolean;
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
  onCoverPress,
  onEditProfile,
  onReturnHome,
  profileActive,
  children,
}: PetHeaderProps) {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const fadeAnim = useRef(new Animated.Value(0.4)).current;

  const scaleX = screenWidth / DESIGN_WIDTH;
  const scaleY = screenHeight / DESIGN_HEIGHT;
  const coverHeight = Math.round(DESIGN_COVER_HEIGHT * scaleY);
  const panelOverlap = Math.round((DESIGN_COVER_HEIGHT - DESIGN_PANEL_TOP) * scaleY);
  const panelRadius = Math.round(DESIGN_PANEL_RADIUS * scaleX);

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

  const canSwitch = Boolean(pet);

  return (
    <View style={styles.wrapper}>
      <View style={[styles.cover, { height: coverHeight }]}>
        <Pressable
          style={styles.coverPressable}
          onPress={onCoverPress}
          disabled={loading || !pet || !onCoverPress}
          accessibilityRole={onCoverPress ? 'button' : undefined}
          accessibilityLabel={
            onCoverPress
              ? profileActive
                ? t('profile.cover_back_a11y')
                : t('profile.cover_open_a11y')
              : undefined
          }
        >
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
              <Ionicons name="paw" size={72} color={colors.secondaryText} />
            </View>
          )}
        </Pressable>

        {profileActive ? (
          <View style={[styles.actionBar, { top: insets.top + Spacing.xs }]}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={onReturnHome}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={t('profile.return_home')}
            >
              <Ionicons name="arrow-back" size={20} color={colors.primaryText} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={onEditProfile}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={t('profile.edit_profile')}
            >
              <Ionicons name="pencil" size={18} color={colors.primaryText} />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.settingsButton, { top: insets.top + Spacing.sm }]}
            onPress={onSettingsPress}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={t('home.settings')}
          >
            <Ionicons name="settings-outline" size={22} color={colors.primaryText} />
          </TouchableOpacity>
        )}
      </View>

      <View style={[styles.panelOuter, { marginTop: -panelOverlap }]}>
        <View
          style={[
            styles.panelHeaderClip,
            {
              borderTopLeftRadius: panelRadius,
              borderTopRightRadius: panelRadius,
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
                  <Ionicons name="chevron-down" size={24} color={colors.primaryText} />
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

        <View style={styles.panelBody}>{children}</View>
      </View>
    </View>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: c.panel,
  },
  cover: {
    width: '100%',
    backgroundColor: '#E8E2D8',
    overflow: 'hidden',
  },
  coverPressable: {
    width: '100%',
    height: '100%',
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
    backgroundColor: c.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  actionBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    zIndex: 90,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    padding: 4,
    backgroundColor: c.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  panelOuter: {
    flex: 1,
    backgroundColor: 'transparent',
    overflow: 'visible',
  },
  panelHeaderClip: {
    backgroundColor: c.panel,
    paddingTop: Spacing.xl,
    overflow: 'hidden',
  },
  panelBody: {
    backgroundColor: c.panel,
    paddingBottom: Spacing.lg,
    overflow: 'visible',
    flex: 1,
  },
  nameSection: {
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    paddingBottom: 0,
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
    color: c.primaryText,
  },
  subtitle: {
    fontFamily: 'Rubik-Regular',
    fontSize: 14,
    color: c.secondaryText,
  },
  emptySubtitle: {
    fontFamily: 'Rubik-Regular',
    fontSize: 14,
    color: c.secondaryText,
    textAlign: 'center',
  },
  nameSkeleton: {
    width: 160,
    height: 28,
    borderRadius: 6,
    backgroundColor: c.border,
    marginBottom: 8,
  },
  subtitleSkeleton: {
    width: 120,
    height: 14,
    borderRadius: 6,
    backgroundColor: c.border,
  },
});
