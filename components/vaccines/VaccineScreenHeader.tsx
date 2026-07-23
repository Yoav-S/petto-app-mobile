import React from 'react';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { getHeaderContentOffset } from '@/utils/headerLayout';

interface VaccineScreenHeaderProps {
  title: string;
  icon?: 'back' | 'close';
  /** @deprecated Ignored — header spacing is unified via headerLayout. */
  extraTopOffset?: number;
}

/** Alias of ScreenHeader kept for existing vaccine/reminder imports. */
export default function VaccineScreenHeader({
  title,
  icon = 'back',
}: VaccineScreenHeaderProps) {
  return <ScreenHeader title={title} icon={icon} />;
}

/** @deprecated Prefer getHeaderContentOffset from @/utils/headerLayout */
export function getVaccineHeaderContentOffset(screenHeight: number): number {
  return getHeaderContentOffset(screenHeight);
}
