import React from 'react';
import SpeedDialFab, { type SpeedDialItem } from '@/components/ui/SpeedDialFab';
import { HOME_CATEGORY_ICONS, TOPICS_FAB_ICON } from '@/components/home/categoryIcons';
import { t } from '@/i18n';

interface FABMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVaccinePress: () => void;
  onHealthPress: () => void;
  onReminderPress: () => void;
}

/** Home speed-dial: Topics / Vaccines / Reminders. */
export default function FABMenu({
  open,
  onOpenChange,
  onVaccinePress,
  onHealthPress,
  onReminderPress,
}: FABMenuProps) {
  const items: SpeedDialItem[] = [
    {
      key: 'health',
      label: t('fab.topics'),
      icon: TOPICS_FAB_ICON,
      onPress: onHealthPress,
    },
    {
      key: 'vaccines',
      label: t('fab.vaccines'),
      icon: HOME_CATEGORY_ICONS.vaccines,
      onPress: onVaccinePress,
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
