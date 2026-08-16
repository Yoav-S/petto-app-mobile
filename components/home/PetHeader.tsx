import { Spacing, type ThemeColors } from '@/constants/theme';
import { useColors, useThemedStyles } from '@/context/ThemeContext';
import { t } from '@/i18n';
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
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
import { petPhotoSource } from '@/utils/petPhotoSource';
import PetPhotoImage from '@/components/ui/PetPhotoImage';

export const DESIGN_WIDTH = 375;
export const DESIGN_HEIGHT = 812;
/** Figma 375x812: bottom panel starts at y=328 and is 484px tall. */
export const DESIGN_COVER_HEIGHT = 352;
export const DESIGN_PANEL_TOP = 328;
export const DESIGN_PANEL_HEIGHT = 484;
export const DESIGN_PANEL_RADIUS = 24;

interface PetHeaderProps {
  pet: {
    id: string;
    name: string;
    type?: string | null;
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
  const petAge = calculateAge(pet?.birth_date ?? undefined);

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
            <PetPhotoImage forceLoading style={styles.coverImage} />
          ) : pet ? (
            <PetPhotoImage
              recyclingKey={pet.id}
              source={petPhotoSource(pet)}
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
              <MaterialIcons
                name="chevron-left"
                size={24}
                color={colors.primaryText}
                style={styles.backIcon}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={onEditProfile}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={t('profile.edit_profile')}
            >
              <MaterialCommunityIcons name="pencil-outline" size={18} color={colors.primaryText} />
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
            <View style={[styles.nameSection, profileActive && styles.profileNameSection]}>
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
                <Text
                  style={[styles.name, profileActive && styles.profileName]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {pet?.name ?? t('home.noPet')}
                </Text>
                {canSwitch ? (
                  <Ionicons name="chevron-down" size={24} color={colors.primaryText} />
                ) : null}
              </TouchableOpacity>
              {pet ? (
                <View style={styles.subtitleRow}>
                  {pet.breed ? (
                    <Text style={styles.breed} numberOfLines={1} ellipsizeMode="tail">
                      {pet.breed}
                    </Text>
                  ) : null}
                  {pet.breed && petAge ? <Text style={styles.subtitleSeparator}>{'\u2022'}</Text> : null}
                  {petAge ? (
                    <Text style={styles.age} numberOfLines={1}>
                      {petAge}
                    </Text>
                  ) : null}
                </View>
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
    backgroundColor: c.surface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  backIcon: {
    // Material chevron glyph is optically left-heavy inside its box.
    marginLeft: -1,
    textAlign: 'center',
  },
  panelOuter: {
    flex: 1,
    backgroundColor: 'transparent',
    overflow: 'visible',
  },
  panelHeaderClip: {
    backgroundColor: c.panel,
    paddingTop: 16,
    overflow: 'hidden',
  },
  panelBody: {
    backgroundColor: c.panel,
    paddingBottom: Spacing.lg,
    overflow: 'visible',
    flex: 1,
  },
  nameSection: {
    width: 141,
    height: 72,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: 12,
    paddingBottom: 0,
  },
  profileNameSection: {
    width: 335,
  },
  nameRow: {
    maxWidth: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: 4,
  },
  name: {
    flexShrink: 1,
    fontFamily: 'Rubik-Regular',
    fontSize: 28,
    color: c.primaryText,
  },
  profileName: {
    fontSize: 36,
    lineHeight: 44,
  },
  subtitleRow: {
    width: '100%',
    height: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    overflow: 'hidden',
  },
  breed: {
    flexShrink: 1,
    minWidth: 0,
    fontFamily: 'Rubik-Regular',
    fontSize: 14,
    lineHeight: 20,
    color: c.secondaryText,
  },
  subtitleSeparator: {
    flexShrink: 0,
    fontFamily: 'Rubik-Regular',
    fontSize: 14,
    lineHeight: 20,
    color: c.secondaryText,
  },
  age: {
    flexShrink: 0,
    fontFamily: 'Rubik-Regular',
    fontSize: 14,
    lineHeight: 20,
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
