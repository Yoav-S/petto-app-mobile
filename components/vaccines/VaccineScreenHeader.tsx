import React from 'react';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { getHeaderContentOffset } from '@/utils/headerLayout';
import type { HeaderTitleFit } from '@/components/ui/HeaderTitle';

interface VaccineScreenHeaderProps {
  title: string;
  icon?: 'back' | 'close';
  onBack?: () => void;
  right?: React.ReactNode;
  fit?: HeaderTitleFit;
  /** @deprecated Ignored — header spacing is unified via headerLayout. */
  extraTopOffset?: number;
}

/** Alias of ScreenHeader kept for existing vaccine/reminder imports. */
export default function VaccineScreenHeader({
  title,
  icon = 'back',
  onBack,
  right,
  fit,
}: VaccineScreenHeaderProps) {
  return (
    <ScreenHeader title={title} icon={icon} onBack={onBack} right={right} fit={fit} />
  );
}

/** @deprecated Prefer getHeaderContentOffset from @/utils/headerLayout */
export function getVaccineHeaderContentOffset(screenHeight: number): number {
  return getHeaderContentOffset(screenHeight);
}
