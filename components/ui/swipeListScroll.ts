type Listener = () => void;

const listeners = new Set<Listener>();
let scrolling = false;
let endTimer: ReturnType<typeof setTimeout> | null = null;

/** True while a swipe-to-delete list is moving. A resting finger must not mark rows. */
export function isSwipeListScrolling(): boolean {
  return scrolling;
}

export function subscribeSwipeListScroll(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notify(): void {
  listeners.forEach((listener) => listener());
}

function clearEndTimer(): void {
  if (!endTimer) return;
  clearTimeout(endTimer);
  endTimer = null;
}

/** Call when a list that contains swipe rows starts moving. */
export function notifySwipeListScrollStart(): void {
  clearEndTimer();
  scrolling = true;
  notify();
}

/** Call when that list has stopped. */
export function notifySwipeListScrollEnd(): void {
  clearEndTimer();
  if (!scrolling) return;
  scrolling = false;
  notify();
}

/**
 * The drag ended, but a flick may still be decelerating. Keep the guard up
 * until momentum claims the gesture, then release it.
 */
export function notifySwipeListDragEnd(): void {
  clearEndTimer();
  endTimer = setTimeout(() => {
    endTimer = null;
    if (!scrolling) return;
    scrolling = false;
    notify();
  }, 140);
}

/** Spread onto each FlatList that renders swipe-to-delete rows. */
export const swipeListScrollHandlers = {
  onScrollBeginDrag: notifySwipeListScrollStart,
  onMomentumScrollBegin: notifySwipeListScrollStart,
  onScrollEndDrag: notifySwipeListDragEnd,
  onMomentumScrollEnd: notifySwipeListScrollEnd,
};
