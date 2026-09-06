import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import ConfirmModal, { ConfirmDialogSurface } from '@/components/ui/ConfirmModal';
import {
  isBottomSheetMounted,
  setActiveSheetOverlay,
  subscribeBottomSheetState,
} from '@/components/ui/BottomSheetModal';
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
  const [sheetOpen, setSheetOpen] = useState(isBottomSheetMounted);
  const pendingNav = useRef<UpgradeLimitOptions['onBeforeNavigate']>(undefined);

  useEffect(() => {
    setUpgradeLimitPresenter((next, options) => {
      pendingNav.current = options?.onBeforeNavigate;
      setKind(next);
    });
    return () => setUpgradeLimitPresenter(null);
  }, []);

  useEffect(() => subscribeBottomSheetState(() => setSheetOpen(isBottomSheetMounted())), []);

  const copy = kind ? COPY[kind] : null;

  const dismiss = () => {
    pendingNav.current = undefined;
    setKind(null);
  };

  const confirm = () => {
    const before = pendingNav.current;
    pendingNav.current = undefined;
    setKind(null);
    before?.();
    router.push('/settings/subscription' as never);
  };

  const dialogProps = {
    title: copy ? t(copy.title) : '',
    message: copy ? t(copy.body) : '',
    confirmText: t('settings.upgrade'),
    cancelText: t('common.cancel'),
    variant: 'primary' as const,
    onCancel: dismiss,
    onConfirm: confirm,
  };

  useEffect(() => {
    if (kind && sheetOpen) {
      setActiveSheetOverlay(<ConfirmDialogSurface {...dialogProps} />);
      return () => setActiveSheetOverlay(null);
    }
    setActiveSheetOverlay(null);
    return undefined;
    // dialogProps fields are derived from kind; listing them avoids a stale overlay.
  }, [kind, sheetOpen, dialogProps.title, dialogProps.message, dialogProps.confirmText]);

  return (
    <>
      {children}
      <ConfirmModal visible={Boolean(kind) && !sheetOpen} {...dialogProps} />
    </>
  );
}
