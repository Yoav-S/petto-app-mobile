import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
  type Edge,
} from 'react-native-safe-area-context';
import {
  HEADER_CHROME_BOTTOM_RADIUS,
  HEADER_SCROLL_GAP,
} from '@/constants/layout';
import { type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/context/ThemeContext';

export interface HeaderScrollInsets {
  /** Padding for scroll content below the floating header chrome. */
  paddingTop: number;
  paddingBottom: number;
}

interface HeaderScrollLayoutProps {
  header: React.ReactNode;
  children: (insets: HeaderScrollInsets) => React.ReactNode;
  edges?: Edge[];
  style?: StyleProp<ViewStyle>;
}

/**
 * Floating header chrome + scroll content underneath.
 * Content gets paddingTop = chrome height + HEADER_SCROLL_GAP (10px).
 */
export default function HeaderScrollLayout({
  header,
  children,
  edges = ['left', 'right'],
  style,
}: HeaderScrollLayoutProps) {
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const [chromeHeight, setChromeHeight] = useState(0);

  const paddingTop = chromeHeight + HEADER_SCROLL_GAP;
  const paddingBottom = Math.max(insets.bottom, 8);

  return (
    <SafeAreaView style={[styles.safeArea, style]} edges={edges}>
      <View style={styles.body}>
        {children({ paddingTop, paddingBottom })}
        <View
          style={styles.chrome}
          onLayout={(e) => setChromeHeight(e.nativeEvent.layout.height)}
          pointerEvents="box-none"
        >
          {header}
        </View>
      </View>
    </SafeAreaView>
  );
}

interface HeaderScrollScreenProps {
  header: React.ReactNode;
  children: React.ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
  edges?: Edge[];
}

/** Convenience wrapper: header + vertical ScrollView with standard insets. */
export function HeaderScrollScreen({
  header,
  children,
  contentContainerStyle,
  edges = ['left', 'right'],
}: HeaderScrollScreenProps) {
  return (
    <HeaderScrollLayout header={header} edges={edges}>
      {({ paddingTop, paddingBottom }) => (
        <ScrollView
          style={stylesScroll.scroll}
          contentContainerStyle={[
            { paddingTop, paddingBottom: paddingBottom + 16 },
            contentContainerStyle,
          ]}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      )}
    </HeaderScrollLayout>
  );
}

const stylesScroll = StyleSheet.create({
  scroll: {
    flex: 1,
  },
});

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: c.background,
    },
    body: {
      flex: 1,
      position: 'relative',
    },
    chrome: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 2,
      backgroundColor: c.background,
      borderBottomLeftRadius: HEADER_CHROME_BOTTOM_RADIUS,
      borderBottomRightRadius: HEADER_CHROME_BOTTOM_RADIUS,
      shadowColor: '#1E1E1E',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 10,
      elevation: 4,
    },
  });
