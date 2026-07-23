import React from 'react';
import BottomToast, { type BottomToastProps } from '@/components/ui/BottomToast';

interface SnackbarProps {
  visible: boolean;
  message: string;
  actionText?: string;
  onAction?: () => void;
  onHide?: () => void;
  duration?: number;
  aboveFab?: boolean;
  countdownSec?: number | null;
}

/**
 * @deprecated Prefer `useToast()` from ToastContext for app-wide toasts.
 * Kept as a thin wrapper for screens that still mount a local snackbar.
 */
export default function Snackbar({
  visible,
  message,
  actionText,
  onAction,
  onHide,
  duration = 3000,
  aboveFab = true,
  countdownSec,
}: SnackbarProps) {
  React.useEffect(() => {
    if (!visible || !onHide || countdownSec != null) return;
    const timer = setTimeout(onHide, duration);
    return () => clearTimeout(timer);
  }, [visible, duration, onHide, countdownSec]);

  const props: BottomToastProps = {
    visible,
    message,
    actionText,
    onAction,
    aboveFab,
    countdownSec,
  };

  return <BottomToast {...props} />;
}
