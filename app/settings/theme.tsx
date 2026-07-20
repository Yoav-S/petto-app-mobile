import React from 'react';
import { t } from '@/i18n';
import SettingsPlaceholder from '@/components/settings/SettingsPlaceholder';

export default function ThemeSettingsScreen() {
  return <SettingsPlaceholder title={t('settings.theme')} icon="color-palette-outline" />;
}
