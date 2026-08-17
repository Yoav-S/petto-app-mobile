import { Spacing, type ThemeColors } from '@/constants/theme';
import { useColors, useThemedStyles, useTheme } from '@/context/ThemeContext';
import { t } from '@/i18n';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Pencil } from 'lucide-react-native';
import React, { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useImageStatusBarStyle } from '@/hooks/useImageStatusBarStyle';
import {
  useStatusBarOverride,
  type SystemBarContentStyle,
} from '@/context/SystemBarsContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { petPhotoSource } from '@/utils/petPhotoSource';
import PetPhotoImage from '@/components/ui/PetPhotoImage';
import HeaderIconButton, {
  HEADER_ICON_BTN,
} from '@/components/ui/HeaderIconButton';

import {
  DESIGN_COVER_HEIGHT,
  DESIGN_PANEL_RADIUS,
  DESIGN_PANEL_TOP,
} from '@/constants/layout';

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
  const { isDark } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useResponsiveLayout();
  const fadeAnim = useRef(new Animated.Value(0.4)).current;

  const coverHeight = DESIGN_COVER_HEIGHT;
  const panelOverlap = DESIGN_COVER_HEIGHT - DESIGN_PANEL_TOP;
  const panelRadius = DESIGN_PANEL_RADIUS;
  const nameBlockWidth = Math.min(screenWidth - 40, 335);
  const coverSource = useMemo(() => petPhotoSource(pet), [pet]);
  const themeBarStyle: SystemBarContentStyle = isDark ? 'light' : 'dark';
  const imageBarStyle = useImageStatusBarStyle(coverSource, themeBarStyle);
  useStatusBarOverride(loading ? themeBarStyle : pet ? imageBarStyle : 'dark');

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
              source={coverSource}
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

        <View style={[styles.actionBar, { top: insets.top }]}>
          {profileActive ? (
            <>
            <HeaderIconButton
              onPress={onReturnHome}
              accessibilityLabel={t('profile.return_home')}
            >
              <MaterialIcons
                name="chevron-left"
                size={HEADER_ICON_BTN.iconSize}
                color={colors.primaryText}
                style={styles.backIcon}
              />
            </HeaderIconButton>

            <HeaderIconButton
              onPress={onEditProfile}
              accessibilityLabel={t('profile.edit_profile')}
            >
              <Pencil size={18} color={colors.primaryText} strokeWidth={2} />
            </HeaderIconButton>
            </>
          ) : (
            <>
              <View style={styles.actionSpacer} />
              <HeaderIconButton
                onPress={onSettingsPress}
                accessibilityLabel={t('home.settings')}
              >
                <Ionicons
                  name="settings-outline"
                  size={HEADER_ICON_BTN.iconSize}
                  color={colors.primaryText}
                />
              </HeaderIconButton>
            </>
          )}
        </View>
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
            <View style={[styles.nameSection, { maxWidth: nameBlockWidth }]}>
              <Animated.View style={[styles.nameSkeleton, { opacity: fadeAnim }]} />
              <Animated.View style={[styles.subtitleSkeleton, { opacity: fadeAnim }]} />
            </View>
          ) : (
            <View style={[styles.nameSection, { maxWidth: nameBlockWidth }]}>
              <TouchableOpacity
                style={styles.nameRow}
                onPress={canSwitch ? onSwitchPress : undefined}
                activeOpacity={canSwitch ? 0.7 : 1}
              >
                <Text
                  style={styles.name}
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
  actionBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 6,
    zIndex: 90,
  },
  actionSpacer: {
    width: HEADER_ICON_BTN.size,
    height: HEADER_ICON_BTN.size,
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
    width: '100%',
    maxWidth: 335,
    minHeight: 72,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: 12,
    paddingBottom: 0,
    paddingHorizontal: 20,
  },
  nameRow: {
    maxWidth: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    marginBottom: 4,
  },
  name: {
    flexShrink: 1,
    fontFamily: 'Rubik-Regular',
    fontSize: 36,
    lineHeight: 44,
    color: c.primaryText,
    textAlign: 'center',
  },
  subtitleRow: {
    width: '100%',
    minHeight: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'nowrap',
    gap: 4,
  },
  breed: {
    flexShrink: 1,
    minWidth: 0,
    fontFamily: 'Rubik-Regular',
    fontSize: 14,
    lineHeight: 20,
    color: c.secondaryText,
    textAlign: 'center',
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
