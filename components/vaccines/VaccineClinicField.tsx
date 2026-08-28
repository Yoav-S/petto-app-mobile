import React from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  Keyboard,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { type ThemeColors } from '@/constants/theme';
import { useColors, useThemedStyles } from '@/context/ThemeContext';
import { centeredInputText } from '@/constants/textField';
import { t } from '@/i18n';

interface VaccineClinicFieldProps {
  value: string;
  onChangeText: (text: string) => void;
  onBlur?: () => void;
  onFocus?: TextInputProps['onFocus'];
  style?: StyleProp<ViewStyle>;
}

/** Static label + placeholder that only disappears when the user types. */
export default function VaccineClinicField({
  value,
  onChangeText,
  onBlur,
  onFocus,
  style,
}: VaccineClinicFieldProps) {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const label = t('vaccines.vet_clinic');

  return (
    <View style={[styles.card, style]}>
      <View style={styles.inner}>
        <Text style={styles.label}>{label}</Text>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          onBlur={onBlur}
          onFocus={onFocus}
          placeholder={t('vaccines.vet_clinic_placeholder')}
          placeholderTextColor={colors.secondaryText}
          textAlignVertical="center"
          returnKeyType="done"
          onSubmitEditing={() => Keyboard.dismiss()}
        />
      </View>
    </View>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: c.surface,
      justifyContent: 'center',
    },
    inner: {
      width: '100%',
      gap: 6,
    },
    label: {
      fontFamily: 'Rubik-Regular',
      fontWeight: '400',
      fontSize: 14,
      lineHeight: 20,
      color: c.secondaryText,
    },
    input: {
      ...centeredInputText({
        fontFamily: 'Rubik-Regular',
        fontSize: 16,
        lineHeight: 24,
        color: c.primaryText,
      }),
    },
  });
