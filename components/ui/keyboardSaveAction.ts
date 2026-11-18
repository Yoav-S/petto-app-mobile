import { useEffect, useRef, useSyncExternalStore } from 'react';
import { useIsFocused } from '@react-navigation/native';

export interface KeyboardSaveAction {
  disabled?: boolean;
  loading?: boolean;
  onPress: () => void;
}

interface ActiveSave {
  owner: number;
  disabled: boolean;
  /** Runs the screen's save only if it is still enabled at press time. */
  press: () => void;
}

let active: ActiveSave | null = null;
let nextOwner = 1;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return active;
}

let localBarHosts = 0;
const hostListeners = new Set<() => void>();

function subscribeHosts(listener: () => void) {
  hostListeners.add(listener);
  return () => hostListeners.delete(listener);
}

function getHostsSnapshot() {
  return localBarHosts;
}

/** True while a focused screen renders its own keyboard bar (create screens are native modals on iOS, above the root overlay). */
export function useHasLocalKeyboardBar(): boolean {
  return useSyncExternalStore(subscribeHosts, getHostsSnapshot, getHostsSnapshot) > 0;
}

/** Register this screen as hosting its own keyboard bar while focused. */
export function useLocalKeyboardBarHost() {
  const isFocused = useIsFocused();
  useEffect(() => {
    if (!isFocused) return;
    localBarHosts += 1;
    hostListeners.forEach((l) => l());
    return () => {
      localBarHosts -= 1;
      hostListeners.forEach((l) => l());
    };
  }, [isFocused]);
}

/** The keyboard bar's Save action for the focused create screen, or null (shows Done). */
export function useActiveKeyboardSave(): ActiveSave | null {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/**
 * Turn the button above the keyboard into Save while this screen is focused.
 * Pass null to keep the regular Done button.
 */
export function useKeyboardSaveAction(action: KeyboardSaveAction | null | undefined) {
  const isFocused = useIsFocused();
  const ownerRef = useRef(0);
  if (ownerRef.current === 0) ownerRef.current = nextOwner++;

  const disabled = Boolean(action?.disabled || action?.loading);
  const latestRef = useRef({ disabled, onPress: action?.onPress });
  latestRef.current = { disabled, onPress: action?.onPress };

  const enabled = Boolean(action) && isFocused;

  useEffect(() => {
    const owner = ownerRef.current;
    if (!enabled) return;
    active = {
      owner,
      disabled,
      press: () => {
        const latest = latestRef.current;
        if (latest.disabled) return;
        latest.onPress?.();
      },
    };
    emit();
    return () => {
      if (active?.owner === owner) {
        active = null;
        emit();
      }
    };
  }, [enabled, disabled]);
}
