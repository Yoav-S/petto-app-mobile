import { t } from '@/i18n';
import type { LegalBlock } from '@/components/settings/LegalScreen';

/** Keep in sync with website docs and store listing “Last updated”. */
export const LEGAL_LAST_UPDATED_ISO = '2026-08-20';

export function privacyPolicyBlocks(): LegalBlock[] {
  return [
    { type: 'intro', text: t('legal.privacy_intro'), gap: 3 },
    { type: 'heading', text: t('legal.privacy_s1_title') },
    { type: 'body', text: t('legal.privacy_s1_body'), gap: 2 },
    { type: 'heading', text: t('legal.privacy_s2_title') },
    { type: 'body', text: t('legal.privacy_s2_body'), gap: 2 },
    { type: 'heading', text: t('legal.privacy_s3_title') },
    { type: 'body', text: t('legal.privacy_s3_body'), gap: 2 },
    { type: 'heading', text: t('legal.privacy_s4_title') },
    { type: 'body', text: t('legal.privacy_s4_body'), gap: 2 },
    { type: 'heading', text: t('legal.privacy_s5_title') },
    { type: 'body', text: t('legal.privacy_s5_body'), gap: 2 },
    { type: 'heading', text: t('legal.privacy_s6_title') },
    { type: 'body', text: t('legal.privacy_s6_body'), gap: 2 },
    { type: 'heading', text: t('legal.privacy_s7_title') },
    { type: 'body', text: t('legal.privacy_s7_body'), gap: 2 },
    { type: 'heading', text: t('legal.privacy_s8_title') },
    { type: 'body', text: t('legal.privacy_s8_body'), gap: 2 },
    { type: 'heading', text: t('legal.privacy_s9_title') },
    { type: 'body', text: t('legal.privacy_s9_body'), gap: 2 },
    { type: 'heading', text: t('legal.privacy_s10_title') },
    { type: 'body', text: t('legal.privacy_s10_body'), gap: 2 },
    { type: 'heading', text: t('legal.privacy_s11_title') },
    { type: 'body', text: t('legal.privacy_s11_body'), gap: 2 },
  ];
}

export function termsOfServiceBlocks(): LegalBlock[] {
  return [
    { type: 'intro', text: t('legal.terms_intro'), gap: 3 },
    { type: 'heading', text: t('legal.terms_s1_title') },
    { type: 'body', text: t('legal.terms_s1_body'), gap: 2 },
    { type: 'heading', text: t('legal.terms_s2_title') },
    { type: 'body', text: t('legal.terms_s2_body'), gap: 2 },
    { type: 'heading', text: t('legal.terms_s3_title') },
    { type: 'body', text: t('legal.terms_s3_body'), gap: 2 },
    { type: 'heading', text: t('legal.terms_s4_title') },
    { type: 'body', text: t('legal.terms_s4_body'), gap: 2 },
    { type: 'heading', text: t('legal.terms_s5_title') },
    { type: 'body', text: t('legal.terms_s5_body'), gap: 2 },
    { type: 'heading', text: t('legal.terms_s6_title') },
    { type: 'body', text: t('legal.terms_s6_body'), gap: 2 },
    { type: 'heading', text: t('legal.terms_s7_title') },
    { type: 'body', text: t('legal.terms_s7_body'), gap: 2 },
    { type: 'heading', text: t('legal.terms_s8_title') },
    { type: 'body', text: t('legal.terms_s8_body'), gap: 2 },
    { type: 'heading', text: t('legal.terms_s9_title') },
    { type: 'body', text: t('legal.terms_s9_body'), gap: 2 },
  ];
}
