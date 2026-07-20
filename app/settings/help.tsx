import React from 'react';
import { t } from '@/i18n';
import SettingsPlaceholder from '@/components/settings/SettingsPlaceholder';

export default function HelpSettingsScreen() {
  return <SettingsPlaceholder title={t('settings.help')} icon="help-circle-outline" />;
}
