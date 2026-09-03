import { useCallback, useEffect, useRef, useState } from 'react';
import {
  useNavigation,
  usePreventRemove,
  type NavigationProp,
  type ParamListBase,
} from '@react-navigation/native';

type NavAction = Parameters<Parameters<typeof usePreventRemove>[1]>[0]['data']['action'];

/**
 * Blocks leaving a Save-button screen while there are unsaved edits.
 * Back / close is held until the user discards or we skip the prompt
 * after a successful save / delete.
 */
export function useUnsavedChangesGuard(isDirty: boolean, busy = false) {
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const [discardVisible, setDiscardVisible] = useState(false);
  const [skip, setSkip] = useState(false);
  const pendingActionRef = useRef<NavAction | null>(null);
  const afterSkipRef = useRef<(() => void) | null>(null);

  usePreventRemove((isDirty || busy) && !skip, ({ data }) => {
    if (busy) return;
    pendingActionRef.current = data.action;
    setDiscardVisible(true);
  });

  /** Call before an intentional leave (save success, confirmed delete). */
  const skipPrompt = useCallback((then?: () => void) => {
    if (then) afterSkipRef.current = then;
    setDiscardVisible(false);
    setSkip(true);
  }, []);

  useEffect(() => {
    if (!skip) return;
    const then = afterSkipRef.current;
    afterSkipRef.current = null;
    if (then) {
      then();
      return;
    }
    const action = pendingActionRef.current;
    pendingActionRef.current = null;
    if (action) navigation.dispatch(action);
  }, [skip, navigation]);

  const onDiscard = useCallback(() => {
    setDiscardVisible(false);
    setSkip(true);
  }, []);

  const onStay = useCallback(() => {
    pendingActionRef.current = null;
    setDiscardVisible(false);
  }, []);

  return { discardVisible, onDiscard, onStay, skipPrompt };
}
