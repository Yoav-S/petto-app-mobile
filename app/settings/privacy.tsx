import React from 'react';
import { t } from '@/i18n';
import SettingsPlaceholder from '@/components/settings/SettingsPlaceholder';

export default function PrivacySettingsScreen() {
  return <SettingsPlaceholder title={t('settings.privacy')} icon="shield-checkmark-outline" />;
}
