import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { LIST_LOAD_MORE_SPINNER_PADDING } from '@/constants/pagination';
import { useColors } from '@/context/ThemeContext';

interface ListLoadMoreFooterProps {
  loading: boolean;
  hasMore: boolean;
}

/** Centered spinner shown while fetching the next page — padded away from rows and edges. */
export default function ListLoadMoreFooter({ loading, hasMore }: ListLoadMoreFooterProps) {
  const colors = useColors();

  if (!loading && !hasMore) {
    return null;
  }

  if (!loading) {
    return <View style={styles.triggerSpacer} />;
  }

  return (
    <View style={styles.wrap}>
      <ActivityIndicator color={colors.primaryText} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingVertical: LIST_LOAD_MORE_SPINNER_PADDING,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: LIST_LOAD_MORE_SPINNER_PADDING * 2 + 24,
  },
  triggerSpacer: {
    height: 1,
  },
});
