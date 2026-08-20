import React from 'react';
import { t } from '@/i18n';
import LegalScreen from '@/components/settings/LegalScreen';
import { LEGAL_LAST_UPDATED_ISO, privacyPolicyBlocks } from '@/constants/legalContent';

export default function PrivacyPolicyScreen() {
  return (
    <LegalScreen
      title={t('settings.privacy')}
      lastUpdatedISO={LEGAL_LAST_UPDATED_ISO}
      blocks={privacyPolicyBlocks()}
    />
  );
}
