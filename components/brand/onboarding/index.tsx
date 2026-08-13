import React from 'react';
import { Image, type ImageSource } from 'expo-image';
import { SvgXml } from 'react-native-svg';
import { useTheme } from '@/context/ThemeContext';
import photoAddXml from './photo-addXml';

type Props = {
  width: number;
  height: number;
};

const COLLAR = require('@/assets/images/onboarding/collar.png') as ImageSource;
const BED = require('@/assets/images/onboarding/bed.png') as ImageSource;
const CALENDAR = require('@/assets/images/onboarding/calendar.png') as ImageSource;
const ADD_PHOTO_EMPTY = require('@/assets/images/onboarding/add-photo-empty.png') as ImageSource;
const MASK_HOLDER = require('@/assets/images/onboarding/mask-group-image-holder.png') as ImageSource;
const DOG_DAY = require('@/assets/images/onboarding/dog-day.png') as ImageSource;
const DOG_DARK = require('@/assets/images/onboarding/dog-dark.png') as ImageSource;
const CAT_DAY = require('@/assets/images/onboarding/cat-day.png') as ImageSource;
const CAT_DARK = require('@/assets/images/onboarding/cat-dark.png') as ImageSource;
const NO_PET_DEFAULT = require('@/assets/images/onboarding/no-pet-images-default.png') as ImageSource;

function Art({ source, width, height }: Props & { source: ImageSource }) {
  return (
    <Image
      source={source}
      style={{ width, height }}
      contentFit="contain"
      accessibilityIgnoresInvertColors
    />
  );
}

/** Name onboarding collar illustration. */
export function OnboardingCollar(props: Props) {
  return <Art source={COLLAR} {...props} />;
}

/** Pet-type onboarding bed illustration. */
export function OnboardingBed(props: Props) {
  return <Art source={BED} {...props} />;
}

/** Birth-date onboarding hero. */
export function OnboardingCalendar(props: Props) {
  return <Art source={CALENDAR} {...props} />;
}

/** Photo step empty illustration (no user photo yet). */
export function OnboardingPhotoEmpty(props: Props) {
  return <Art source={ADD_PHOTO_EMPTY} {...props} />;
}

/** Circular crop that sits over the user photo (holding fingers). */
export function OnboardingPhotoMask(props: Props) {
  return <Art source={MASK_HOLDER} {...props} />;
}

/** Default dog photo shown in the hero frame when no user photo yet. */
export function OnboardingDefaultPetPhoto(props: Props) {
  return <Art source={NO_PET_DEFAULT} {...props} />;
}

/** Square photo-picker placeholder — in-app add pet. */
export function OnboardingPhotoAdd(props: Props) {
  return <SvgXml xml={photoAddXml} width={props.width} height={props.height} />;
}

/** Dog type tile — day/night art follows theme. */
export function OnboardingDog(props: Props) {
  const { isDark } = useTheme();
  return <Art source={isDark ? DOG_DARK : DOG_DAY} {...props} />;
}

/** Cat type tile — day/night art follows theme. */
export function OnboardingCat(props: Props) {
  const { isDark } = useTheme();
  return <Art source={isDark ? CAT_DARK : CAT_DAY} {...props} />;
}
