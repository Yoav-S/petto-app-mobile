import React from 'react';
import { t } from '@/i18n';
import LegalScreen, { type LegalBlock } from '@/components/settings/LegalScreen';

const LAST_UPDATED_ISO = '2026-05-01';

export default function PrivacyPolicyScreen() {
  const blocks: LegalBlock[] = [
    { type: 'intro', text: t('legal.privacy_intro'), gap: 3 },
    { type: 'heading', text: t('legal.privacy_section1_title') },
    // Figma: 303×310, gap 2px between lines
    { type: 'body', text: t('legal.privacy_section1_body'), gap: 2 },
  ];

  return (
    <LegalScreen
      title={t('settings.privacy')}
      lastUpdatedISO={LAST_UPDATED_ISO}
      blocks={blocks}
    />
  );
}
