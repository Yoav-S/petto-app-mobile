import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BottomSheetModal, { waitForBottomSheetsToSettle } from '@/components/ui/BottomSheetModal';
import { type ThemeColors } from '@/constants/theme';
import { useColors, useThemedStyles } from '@/context/ThemeContext';
import { t } from '@/i18n';

export interface PlaceChoice {
  key: string;
  label: string;
  url: string;
}

interface PlaceChoiceSheetProps {
  visible: boolean;
  title: string;
  options: PlaceChoice[];
  onClose: () => void;
}

export default function PlaceChoiceSheet({
  visible,
  title,
  options,
  onClose,
}: PlaceChoiceSheetProps) {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();

  const choose = (url: string) => {
    onClose();
    void waitForBottomSheetsToSettle().then(() => {
      void Linking.openURL(url);
    });
  };

  return (
    <BottomSheetModal visible={visible} onClose={onClose}>
      <View style={styles.sheet}>
        <View style={styles.header}>
          <View style={styles.headerSide} />
          <Text style={styles.title}>{title}</Text>
          <TouchableOpacity
            style={styles.close}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel={t('common.close')}
          >
            <Ionicons name="close" size={20} color={colors.primaryText} />
          </TouchableOpacity>
        </View>
        <View style={[styles.body, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          {options.map((option) => (
            <TouchableOpacity
              key={option.key}
              style={styles.option}
              onPress={() => choose(option.url)}
              accessibilityRole="button"
            >
              <Text style={styles.optionText}>{option.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </BottomSheetModal>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    sheet: {
      backgroundColor: c.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
    },
    header: {
      paddingTop: 32,
      paddingHorizontal: 20,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    headerSide: {
      width: 32,
      height: 32,
    },
    title: {
      flex: 1,
      fontFamily: 'Rubik-Medium',
      fontSize: 20,
      lineHeight: 24,
      textAlign: 'center',
      color: c.primaryText,
    },
    close: {
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
    },
    body: {
      paddingTop: 22,
      paddingHorizontal: 20,
      gap: 8,
    },
    option: {
      height: 48,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 16,
    },
    optionText: {
      fontFamily: 'Rubik-Medium',
      fontSize: 16,
      lineHeight: 24,
      color: c.primaryText,
      textAlign: 'center',
    },
  });
