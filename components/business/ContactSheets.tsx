import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BottomSheetModal, { waitForBottomSheetsToSettle } from '@/components/ui/BottomSheetModal';
import { type ThemeColors } from '@/constants/theme';
import { useColors, useThemedStyles } from '@/context/ThemeContext';
import { t } from '@/i18n';

type AppIcon = 'phone' | 'google' | 'waze' | 'apple';

interface Choice {
  key: string;
  label: string;
  url: string;
  icon: AppIcon;
}

const APP_ICON: Record<AppIcon, { name: string; color: string; background: string }> = {
  phone: { name: 'phone', color: '#F6F7F9', background: '#004741' },
  google: { name: 'google', color: '#FFFFFF', background: '#4285F4' },
  waze: { name: 'waze', color: '#FFFFFF', background: '#33CCFF' },
  apple: { name: 'apple', color: '#FFFFFF', background: '#1F2937' },
};

function Sheet({
  visible,
  title,
  choices,
  onClose,
}: {
  visible: boolean;
  title: string;
  choices: Choice[];
  onClose: () => void;
}) {
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
          {choices.map((choice) => (
            <TouchableOpacity
              key={choice.key}
              style={styles.choice}
              onPress={() => choose(choice.url)}
              accessibilityRole="button"
            >
              <View style={[styles.appIcon, { backgroundColor: APP_ICON[choice.icon].background }]}>
                {choice.icon === 'phone' ? (
                  <Ionicons name="call" size={18} color={APP_ICON.phone.color} />
                ) : (
                  <FontAwesome5
                    name={APP_ICON[choice.icon].name}
                    brand
                    size={18}
                    color={APP_ICON[choice.icon].color}
                  />
                )}
              </View>
              <Text style={styles.choiceLabel}>{choice.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </BottomSheetModal>
  );
}

export function PhoneSheet({
  visible,
  phones,
  onClose,
}: {
  visible: boolean;
  phones: string[];
  onClose: () => void;
}) {
  return (
    <Sheet
      visible={visible}
      title={t('business.call')}
      choices={phones.map((phone) => ({
        key: phone,
        label: phone,
        url: `tel:${phone}`,
        icon: 'phone',
      }))}
      onClose={onClose}
    />
  );
}

export function LocationSheet({
  visible,
  options,
  onClose,
}: {
  visible: boolean;
  options: Omit<Choice, 'icon'>[];
  onClose: () => void;
}) {
  return (
    <Sheet
      visible={visible}
      title={t('business.directions')}
      choices={options.map((option) => ({
        ...option,
        icon: option.key === 'waze' ? 'waze' : option.key === 'apple' ? 'apple' : 'google',
      }))}
      onClose={onClose}
    />
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
    choice: {
      height: 56,
      borderRadius: 12,
      backgroundColor: c.background,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 12,
    },
    appIcon: {
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    choiceLabel: {
      flex: 1,
      fontFamily: 'Rubik-Medium',
      fontSize: 16,
      lineHeight: 24,
      color: c.primaryText,
    },
  });
