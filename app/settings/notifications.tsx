import React from 'react';
import { t } from '@/i18n';
import SettingsPlaceholder from '@/components/settings/SettingsPlaceholder';

export default function NotificationsSettingsScreen() {
  return <SettingsPlaceholder title={t('settings.notifications')} icon="notifications-outline" />;
}
