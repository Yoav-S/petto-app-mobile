import React from 'react';
import { t } from '@/i18n';
import LegalScreen from '@/components/settings/LegalScreen';
import { LEGAL_LAST_UPDATED_ISO, termsOfServiceBlocks } from '@/constants/legalContent';

export default function TermsOfServiceScreen() {
  return (
    <LegalScreen
      title={t('settings.terms')}
      lastUpdatedISO={LEGAL_LAST_UPDATED_ISO}
      blocks={termsOfServiceBlocks()}
    />
  );
}
