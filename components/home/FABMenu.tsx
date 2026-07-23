import React from 'react';
import SpeedDialFab, { type SpeedDialItem } from '@/components/ui/SpeedDialFab';
import { HOME_CATEGORY_ICONS } from '@/components/home/categoryIcons';
import { t } from '@/i18n';

interface FABMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVaccinePress: () => void;
  onHealthPress: () => void;
  onReminderPress: () => void;
}

/** Home speed-dial: Vaccines / Health / Reminders. */
export default function FABMenu({
  open,
  onOpenChange,
  onVaccinePress,
  onHealthPress,
  onReminderPress,
}: FABMenuProps) {
  const items: SpeedDialItem[] = [
    {
      key: 'vaccines',
      label: t('fab.vaccines'),
      icon: HOME_CATEGORY_ICONS.vaccines,
      onPress: onVaccinePress,
    },
    {
      key: 'health',
      label: t('fab.health'),
      icon: HOME_CATEGORY_ICONS.health,
      onPress: onHealthPress,
    },
    {
      key: 'reminders',
      label: t('fab.reminders'),
      icon: HOME_CATEGORY_ICONS.reminders,
      onPress: onReminderPress,
    },
  ];

  return (
    <SpeedDialFab
      open={open}
      onOpenChange={onOpenChange}
      items={items}
      accessibilityLabel={t('fab.add')}
    />
  );
}
