import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { t } from '@/i18n';
import {
  setUpgradeLimitPresenter,
  type UpgradeKind,
  type UpgradeLimitOptions,
} from '@/services/upgradeLimit';

const COPY: Record<UpgradeKind, { title: string; body: string }> = {
  pet: {
    title: 'settings.limit_pet_title',
    body: 'settings.limit_pet_body',
  },
  reminder: {
    title: 'settings.limit_reminder_title',
    body: 'settings.limit_reminder_body',
  },
  pet_switch: {
    title: 'settings.limit_pet_switch_title',
    body: 'settings.limit_pet_switch_body',
  },
};

export function UpgradeLimitProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [kind, setKind] = useState<UpgradeKind | null>(null);
  const pendingNav = useRef<UpgradeLimitOptions['onBeforeNavigate']>(undefined);

  useEffect(() => {
    setUpgradeLimitPresenter((next, options) => {
      pendingNav.current = options?.onBeforeNavigate;
      setKind(next);
    });
    return () => setUpgradeLimitPresenter(null);
  }, []);

  const copy = kind ? COPY[kind] : null;

  return (
    <>
      {children}
      <ConfirmModal
        visible={Boolean(kind)}
        title={copy ? t(copy.title) : ''}
        message={copy ? t(copy.body) : ''}
        confirmText={t('settings.upgrade')}
        cancelText={t('common.cancel')}
        variant="primary"
        onCancel={() => {
          pendingNav.current = undefined;
          setKind(null);
        }}
        onConfirm={() => {
          const before = pendingNav.current;
          pendingNav.current = undefined;
          setKind(null);
          before?.();
          router.push('/settings/subscription' as never);
        }}
      />
    </>
  );
}
