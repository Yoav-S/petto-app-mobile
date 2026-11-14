import { Keyboard } from 'react-native';
import { router, type Href } from 'expo-router';

/**
 * Push a nested screen (e.g. `/vaccines/add`) without first showing that
 * stack's list. iOS otherwise mounts the nested navigator on its index route.
 * Dismiss any open keyboard first so the next screen's focus does not race
 * a leftover IME animation from the previous surface.
 */
export function pushDirect(href: Href): void {
  Keyboard.dismiss();
  router.push(href, { withAnchor: true });
}
