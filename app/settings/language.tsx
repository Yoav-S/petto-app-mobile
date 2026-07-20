import React from 'react';
import { t } from '@/i18n';
import SettingsPlaceholder from '@/components/settings/SettingsPlaceholder';

export default function LanguageSettingsScreen() {
  return <SettingsPlaceholder title={t('settings.language')} icon="language-outline" />;
}
