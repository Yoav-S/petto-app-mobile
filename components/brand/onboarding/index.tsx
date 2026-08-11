import React from 'react';
import { SvgXml } from 'react-native-svg';
import photoAddXml from './photo-addXml';
import calendarXml from './calendarXml';
import bedXml from './bedXml';
import dogXml from './dogXml';
import catXml from './catXml';
import collarXml from './collarXml';

type Props = {
  width: number;
  height: number;
};

function Art({ xml, width, height }: Props & { xml: string }) {
  return <SvgXml xml={xml} width={width} height={height} />;
}

/** Photo picker placeholder — onboarding + in-app add pet. */
export function OnboardingPhotoAdd(props: Props) {
  return <Art xml={photoAddXml} {...props} />;
}

/** Birth-date onboarding hero. */
export function OnboardingCalendar(props: Props) {
  return <Art xml={calendarXml} {...props} />;
}

/** Pet-type onboarding bed illustration. */
export function OnboardingBed(props: Props) {
  return <Art xml={bedXml} {...props} />;
}

export function OnboardingDog(props: Props) {
  return <Art xml={dogXml} {...props} />;
}

export function OnboardingCat(props: Props) {
  return <Art xml={catXml} {...props} />;
}

/** Name onboarding collar illustration. */
export function OnboardingCollar(props: Props) {
  return <Art xml={collarXml} {...props} />;
}
