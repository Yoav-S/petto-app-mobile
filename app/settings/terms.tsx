import React from 'react';
import { t } from '@/i18n';
import SettingsPlaceholder from '@/components/settings/SettingsPlaceholder';

export default function TermsSettingsScreen() {
  return <SettingsPlaceholder title={t('settings.terms')} icon="document-text-outline" />;
}
