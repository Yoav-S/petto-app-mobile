import { router, type Href } from 'expo-router';

/**
 * Push a nested screen (e.g. `/vaccines/add`) without first showing that
 * stack's list. iOS otherwise mounts the nested navigator on its index route.
 */
export function pushDirect(href: Href): void {
  router.push(href, { withAnchor: true });
}
