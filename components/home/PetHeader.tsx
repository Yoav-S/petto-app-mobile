import { type ThemeColors } from '@/constants/theme';
import { useColors, useThemedStyles, useTheme } from '@/context/ThemeContext';
import { t } from '@/i18n';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Pencil } from 'lucide-react-native';
import React, { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import {
  foregroundForBarStyle,
  useImageStatusBarStyle,
} from '@/hooks/useImageStatusBarStyle';
import {
  useStatusBarOverride,
  type SystemBarContentStyle,
} from '@/context/SystemBarsContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { requireOptionalNativeModule } from 'expo-modules-core';
import type { BlurViewProps } from 'expo-blur';
import { petPhotoRecyclingKey, petPhotoSource, prefetchPetPhoto } from '@/utils/petPhotoSource';
import PetPhotoImage from '@/components/ui/PetPhotoImage';
import HeaderIconButton from '@/components/ui/HeaderIconButton';
import { useHomePanelLayout } from '@/hooks/useHomePanelLayout';

const blurModule = requireOptionalNativeModule('ExpoBlurView')
  ? (require('expo-blur') as { BlurView?: React.ComponentType<BlurViewProps>; default?: React.ComponentType<BlurViewProps> })
  : null;
const BlurView = blurModule?.BlurView ?? blurModule?.default ?? null;

import {
  DESIGN_COVER_HEIGHT,
  PAGE_HORIZONTAL_PADDING,
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
  loading: boolean;
  onSwitchPress: () => void;
  onEditProfile?: () => void;
  onReturnHome?: () => void;
  switchOpen?: boolean;
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
  loading,
  onSwitchPress,
  onEditProfile,
  onReturnHome,
  switchOpen = false,
  children,
}: PetHeaderProps) {
  const colors = useColors();
  const { isDark } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const { width: screenWidth, structuralScale, contentWidth } = useResponsiveLayout();
  const { cardsBottomInset } = useHomePanelLayout();
  const fadeAnim = useRef(new Animated.Value(0.4)).current;

  const coverHeight = Math.round(DESIGN_COVER_HEIGHT * structuralScale);
  const nameBlockWidth = Math.min(screenWidth - PAGE_HORIZONTAL_PADDING * 2, contentWidth);
  const coverSource = useMemo(
    () => petPhotoSource(pet),
    [pet?.id, pet?.photo_url, pet?.type],
  );

  useEffect(() => {
    void prefetchPetPhoto(pet?.photo_url);
  }, [pet?.photo_url]);
  const themeBarStyle: SystemBarContentStyle = isDark ? 'light' : 'dark';
  const imageContrast = useImageStatusBarStyle(coverSource, themeBarStyle);
  const barStyle: SystemBarContentStyle = loading ? themeBarStyle : pet ? imageContrast.style : 'dark';
  useStatusBarOverride(barStyle);
  const nameColor = foregroundForBarStyle(
    imageContrast.ready ? imageContrast.style : themeBarStyle,
  );
  const lightType = nameColor === '#FFFFFF';
  const chipTextColor = foregroundForBarStyle(imageContrast.fromPhoto ? imageContrast.style : 'dark');
  // Halo keeps the type readable when a photo is mixed or the read is late.
  const typeHalo = {
    textShadowColor: lightType ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.9)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  };
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
  const metaChip = (label: string, shrink = false) => (
    <View style={[styles.metaBubble, shrink && styles.metaBubbleShrink]} collapsable={false}>
      {BlurView ? (
        <BlurView
          pointerEvents="none"
          intensity={40}
          tint="light"
          blurReductionFactor={1}
          experimentalBlurMethod="dimezisBlurView"
          style={styles.metaBlur}
        />
      ) : null}
      <View pointerEvents="none" style={styles.metaFill} />
      <Text
        style={[styles.metaText, shrink && styles.metaTextShrink, { color: chipTextColor }]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      <View style={[styles.cover, { height: coverHeight }]} pointerEvents="auto">
        <View style={styles.coverPressable}>
          {loading ? (
            <PetPhotoImage forceLoading style={styles.coverImage} />
          ) : pet ? (
            <PetPhotoImage
              recyclingKey={petPhotoRecyclingKey(pet)}
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
        </View>

        <View style={[styles.identity, { maxWidth: nameBlockWidth }]} pointerEvents="box-none">
          {loading ? (
            <View>
              <Animated.View style={[styles.nameSkeleton, { opacity: fadeAnim }]} />
              <Animated.View style={[styles.subtitleSkeleton, { opacity: fadeAnim }]} />
            </View>
          ) : (
            <>
              <TouchableOpacity
                style={styles.nameRow}
                onPress={canSwitch ? onSwitchPress : undefined}
                activeOpacity={canSwitch ? 0.7 : 1}
                disabled={!canSwitch}
              >
                <Text style={[styles.name, typeHalo, { color: nameColor }]} numberOfLines={1} ellipsizeMode="tail">
                  {pet?.name ?? t('home.noPet')}
                </Text>
                {canSwitch ? (
                  <Ionicons
                    name={switchOpen ? 'chevron-up' : 'chevron-down'}
                    size={24}
                    color={nameColor}
                  />
                ) : null}
              </TouchableOpacity>
              {pet && (pet.breed || petAge) ? (
                <View style={styles.metaRow}>
                  {pet.breed ? metaChip(pet.breed, true) : null}
                  {petAge ? metaChip(petAge) : null}
                </View>
              ) : null}
            </>
          )}
        </View>
      </View>

      <View style={[styles.actionBar, { top: insets.top }]}>
        <HeaderIconButton
          onPress={onReturnHome}
          accessibilityLabel={t('profile.return_home')}
        >
          <MaterialIcons
            name="chevron-left"
            size={24}
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
      </View>

      <View
        style={[styles.panelBody, { paddingBottom: cardsBottomInset }]}
        pointerEvents="box-none"
      >
        <View pointerEvents="none" style={styles.panelSurface} />
        <View style={styles.handleRow} pointerEvents="none">
          <View style={styles.handle} />
        </View>
        {children}
      </View>
    </View>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: c.panel,
    zIndex: 2,
  },
  cover: {
    width: '100%',
    backgroundColor: 'transparent',
    overflow: 'hidden',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
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
    overflow: 'visible',
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: PAGE_HORIZONTAL_PADDING,
    paddingVertical: 6,
    zIndex: 4,
  },
  backIcon: {
    // Material chevron glyph is optically left-heavy inside its box.
    marginLeft: -1,
    textAlign: 'center',
  },
  identity: {
    position: 'absolute',
    left: PAGE_HORIZONTAL_PADDING,
    bottom: 20,
    gap: 6,
    zIndex: 3,
  },
  panelBody: {
    overflow: 'visible',
    flex: 1,
    paddingTop: 32,
    paddingHorizontal: PAGE_HORIZONTAL_PADDING,
  },
  panelSurface: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: c.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  handleRow: {
    position: 'absolute',
    top: 8,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  handle: {
    width: 36,
    height: 5,
    borderRadius: 100,
    backgroundColor: c.border,
  },
  nameRow: {
    maxWidth: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    flexShrink: 1,
    fontFamily: 'Rubik-Regular',
    fontSize: 36,
    lineHeight: 44,
    color: '#FFFFFF',
  },
  metaRow: {
    alignSelf: 'flex-start',
    maxWidth: '100%',
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'center',
    gap: 8,
  },
  metaBubble: {
    flexGrow: 0,
    flexShrink: 0,
    height: 28,
    boxSizing: 'border-box',
    borderRadius: 10,
    paddingTop: 4,
    paddingRight: 8,
    paddingBottom: 4,
    paddingLeft: 8,
    gap: 4,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  metaBubbleShrink: {
    flexShrink: 1,
    minWidth: 0,
  },
  metaBlur: {
    ...StyleSheet.absoluteFillObject,
  },
  metaFill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF33',
  },
  metaText: {
    flexGrow: 0,
    flexShrink: 0,
    fontFamily: 'Rubik-Medium',
    fontSize: 14,
    lineHeight: Platform.OS === 'ios' ? 16 : 20,
    includeFontPadding: false,
    textAlign: 'center',
    textAlignVertical: 'center',
    backgroundColor: 'transparent',
  },
  metaTextShrink: {
    flexShrink: 1,
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
