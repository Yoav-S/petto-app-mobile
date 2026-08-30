import React from 'react';
import { View, StyleSheet } from 'react-native';

interface ListLoadMoreFooterProps {
  loading: boolean;
  hasMore: boolean;
}

/** Keeps a 1px trigger at the list tail so onEndReached can fire. No spinner. */
export default function ListLoadMoreFooter({ loading, hasMore }: ListLoadMoreFooterProps) {
  if (!loading && !hasMore) return null;
  return <View style={styles.triggerSpacer} />;
}

const styles = StyleSheet.create({
  triggerSpacer: {
    height: 1,
  },
});
