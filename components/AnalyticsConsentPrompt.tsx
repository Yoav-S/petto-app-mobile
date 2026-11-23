import React, { useEffect, useState } from 'react';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { useT } from '@/context/LocaleContext';
import { initAnalyticsConsent, setAnalyticsConsent } from '@/services/analyticsConsent';

/** Asks once, after the splash, where analytics needs opt-in. Dismissing counts as "no". */
export default function AnalyticsConsentPrompt({ ready }: { ready: boolean }) {
  const t = useT();
  const [needed, setNeeded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void initAnalyticsConsent().then((ask) => {
      if (!cancelled) setNeeded(ask);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const answer = (granted: boolean) => {
    setNeeded(false);
    void setAnalyticsConsent(granted ? 'granted' : 'denied');
  };

  return (
    <ConfirmModal
      visible={ready && needed}
      variant="primary"
      title={t('analyticsConsent.title')}
      message={t('analyticsConsent.message')}
      confirmText={t('analyticsConsent.allow')}
      cancelText={t('analyticsConsent.decline')}
      onConfirm={() => answer(true)}
      onCancel={() => answer(false)}
    />
  );
}
