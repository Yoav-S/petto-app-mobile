import React from 'react';
import { t } from '@/i18n';
import SettingsPlaceholder from '@/components/settings/SettingsPlaceholder';

export default function AccountSettingsScreen() {
  return <SettingsPlaceholder title={t('settings.account')} icon="person-outline" />;
}
