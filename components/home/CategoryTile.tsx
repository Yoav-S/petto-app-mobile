import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Image, type ImageSource } from 'expo-image';
import { type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/context/ThemeContext';
import CategoryLabel from '@/components/home/CategoryLabel';

/** Exact Figma category tile — never shrinks in the horizontal scroller. */
export const CATEGORY_TILE = {
  width: 126,
  height: 154,
  gap: 10,
  radius: 12,
  padTop: 12,
  padBottom: 12,
  padLeft: 12,
  padRight: 0,
  artW: 46,
  artH: 61,
} as const;

type Props = {
  label: string;
  art: ImageSource;
  onPress: () => void;
  backgroundColor?: string;
};

export default function CategoryTile({ label, art, onPress, backgroundColor }: Props) {
  const styles = useThemedStyles(makeStyles);

  return (
    // Outer shell owns the fixed 126×154. Pressable only fills it — so padding
    // cannot change the tile’s outer size, and Yoga cannot flex-shrink it.
    <View
      style={[styles.shell, backgroundColor ? { backgroundColor } : null]}
      collapsable={false}
    >
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        style={({ pressed }) => [styles.hit, pressed ? styles.hitPressed : null]}
      >
        <Image source={art} style={styles.art} contentFit="contain" />
        <View style={styles.labelWrap}>
          <CategoryLabel
            maxWidth={CATEGORY_TILE.width - CATEGORY_TILE.padLeft - CATEGORY_TILE.padRight}
          >
            {label}
          </CategoryLabel>
        </View>
      </Pressable>
    </View>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    shell: {
      width: CATEGORY_TILE.width,
      height: CATEGORY_TILE.height,
      minWidth: CATEGORY_TILE.width,
      maxWidth: CATEGORY_TILE.width,
      minHeight: CATEGORY_TILE.height,
      maxHeight: CATEGORY_TILE.height,
      flexGrow: 0,
      flexShrink: 0,
      borderRadius: CATEGORY_TILE.radius,
      backgroundColor: c.background,
      overflow: 'hidden',
    },
    hit: {
      flex: 1,
      width: '100%',
      height: '100%',
      paddingTop: CATEGORY_TILE.padTop,
      paddingBottom: CATEGORY_TILE.padBottom,
      paddingLeft: CATEGORY_TILE.padLeft,
      paddingRight: CATEGORY_TILE.padRight,
      justifyContent: 'flex-start',
      gap: CATEGORY_TILE.gap,
    },
    hitPressed: {
      opacity: 0.85,
    },
    art: {
      width: CATEGORY_TILE.artW,
      height: CATEGORY_TILE.artH,
      flexGrow: 0,
      flexShrink: 0,
    },
    labelWrap: {
      marginTop: 'auto',
      alignSelf: 'stretch',
      width: '100%',
      flexGrow: 0,
      flexShrink: 0,
    },
  });
