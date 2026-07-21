import React from 'react';
import { t } from '@/i18n';
import LegalScreen, { type LegalBlock } from '@/components/settings/LegalScreen';

const LAST_UPDATED_ISO = '2026-05-01';

export default function TermsOfServiceScreen() {
  const blocks: LegalBlock[] = [
    // Figma: 303×144, gap 3px
    { type: 'intro', text: t('legal.terms_intro'), gap: 3 },
    { type: 'heading', text: t('legal.terms_section1_title') },
    // Figma: 303×310, gap 2px
    { type: 'body', text: t('legal.terms_section1_body'), gap: 2 },
    { type: 'heading', text: t('legal.terms_section2_title') },
    // Figma: 303×288, gap 3px
    { type: 'body', text: t('legal.terms_section2_body'), gap: 3 },
  ];

  return (
    <LegalScreen
      title={t('settings.terms')}
      lastUpdatedISO={LAST_UPDATED_ISO}
      blocks={blocks}
    />
  );
}
