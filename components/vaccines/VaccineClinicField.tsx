import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  Keyboard,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { type ThemeColors } from '@/constants/theme';
import { useColors, useThemedStyles } from '@/context/ThemeContext';
import { t } from '@/i18n';

interface VaccineClinicFieldProps {
  value: string;
  onChangeText: (text: string) => void;
  onBlur?: () => void;
  style?: StyleProp<ViewStyle>;
}

/** Idle: label sits in the input. Focus or value: label floats above. */
export default function VaccineClinicField({
  value,
  onChangeText,
  onBlur,
  style,
}: VaccineClinicFieldProps) {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const [focused, setFocused] = useState(false);
  const floated = focused || value.trim().length > 0;
  const label = t('vaccines.vet_clinic');

  return (
    <View style={[styles.card, style]}>
      <View style={[styles.inner, !floated && styles.innerCentered]}>
        {floated ? <Text style={styles.label}>{label}</Text> : null}
        <TextInput
          style={[styles.input, !floated && styles.inputCentered]}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            onBlur?.();
          }}
          placeholder={floated ? undefined : label}
          placeholderTextColor={colors.secondaryText}
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
    innerCentered: {
      flex: 1,
      justifyContent: 'center',
    },
    label: {
      fontFamily: 'Rubik-Regular',
      fontWeight: '400',
      fontSize: 14,
      lineHeight: 20,
      color: c.secondaryText,
    },
    input: {
      fontFamily: 'Rubik-Regular',
      fontSize: 16,
      lineHeight: 24,
      color: c.primaryText,
      padding: 0,
      margin: 0,
    },
    inputCentered: {
      minHeight: 24,
      textAlignVertical: 'center',
    },
  });
