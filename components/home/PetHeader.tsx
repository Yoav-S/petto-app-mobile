import { type ThemeColors } from '@/constants/theme';
import { useColors, useThemedStyles, useTheme } from '@/context/ThemeContext';
import { t } from '@/i18n';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Pencil } from 'lucide-react-native';
import React, { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
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
import { petPhotoRecyclingKey, petPhotoSource, prefetchPetPhoto } from '@/utils/petPhotoSource';
import PetPhotoImage from '@/components/ui/PetPhotoImage';
import HeaderIconButton, {
  HEADER_ICON_BTN,
} from '@/components/ui/HeaderIconButton';
import { useHomePanelLayout } from '@/hooks/useHomePanelLayout';

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

        <View style={styles.coverShade} pointerEvents="none" />

        <View style={[styles.actionBar, { top: insets.top }]}>
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
                <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail">
                  {pet?.name ?? t('home.noPet')}
                </Text>
                {canSwitch ? (
                  <Ionicons
                    name={switchOpen ? 'chevron-up' : 'chevron-down'}
                    size={24}
                    color="#1F2937"
                  />
                ) : null}
              </TouchableOpacity>
              {pet && (pet.breed || petAge) ? (
                <View style={styles.metaRow}>
                  {pet.breed ? (
                    <View style={styles.metaBubble}>
                      <Text style={styles.metaText} numberOfLines={1} ellipsizeMode="tail">
                        {pet.breed}
                      </Text>
                    </View>
                  ) : null}
                  {petAge ? (
                    <View style={styles.metaBubble}>
                      <Text style={styles.metaText} numberOfLines={1} ellipsizeMode="tail">
                        {petAge}
                      </Text>
                    </View>
                  ) : null}
                </View>
              ) : null}
            </>
          )}
        </View>
      </View>

      <View
        style={[styles.panelBody, { paddingBottom: cardsBottomInset }]}
        pointerEvents="box-none"
      >
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
  coverShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
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
    paddingHorizontal: PAGE_HORIZONTAL_PADDING,
    paddingVertical: 6,
    zIndex: 90,
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
    backgroundColor: c.surface,
    overflow: 'visible',
    flex: 1,
    paddingTop: 32,
    paddingHorizontal: PAGE_HORIZONTAL_PADDING,
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
    color: '#1F2937',
  },
  metaRow: {
    maxWidth: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaBubble: {
    flexShrink: 1,
    minWidth: 0,
    maxWidth: '100%',
    borderRadius: 10,
    paddingTop: 4,
    paddingRight: 8,
    paddingBottom: 4,
    paddingLeft: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  metaText: {
    fontFamily: 'Rubik-Medium',
    fontSize: 14,
    lineHeight: 20,
    color: '#1F2937',
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
