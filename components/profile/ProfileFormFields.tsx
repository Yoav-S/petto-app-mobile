import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  TouchableOpacity,
  type KeyboardTypeOptions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { type ThemeColors } from '@/constants/theme';
import { useColors, useThemedStyles } from '@/context/ThemeContext';

const CARD_SHADOW = {
  shadowColor: '#2D2D2A',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.04,
  shadowRadius: 20,
  elevation: 3,
};

interface CardShellProps {
  minHeight: number;
  children: React.ReactNode;
}

function CardShell({ minHeight, children }: CardShellProps) {
  const styles = useThemedStyles(makeStyles);
  return <View style={[styles.card, CARD_SHADOW, { minHeight }]}>{children}</View>;
}

/** Pet name — always present, Rubik Medium 20/24, no floating label. */
export function ProfileNameField({
  value,
  onChangeText,
}: {
  value: string;
  onChangeText: (text: string) => void;
}) {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  return (
    <CardShell minHeight={52}>
      <TextInput
        style={styles.nameInput}
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor={colors.secondaryText}
        textAlignVertical="center"
      />
    </CardShell>
  );
}

/**
 * Optional text field with a floating label:
 * empty + unfocused -> label acts as centered placeholder;
 * focused or filled -> label floats to the top, value below.
 */
export function ProfileTextField({
  label,
  value,
  onChangeText,
  keyboardType,
  autoCapitalize = 'sentences',
  minHeight = 78,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  minHeight?: number;
}) {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const [focused, setFocused] = useState(false);
  const floated = focused || value.trim().length > 0;

  return (
    <CardShell minHeight={minHeight}>
      <View style={[styles.inner, !floated && styles.innerCentered]}>
        {floated ? <Text style={styles.fieldLabel}>{label}</Text> : null}
        <TextInput
          style={[styles.textInput, !floated && styles.textInputCentered]}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={floated ? undefined : label}
          placeholderTextColor={colors.secondaryText}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
        />
      </View>
    </CardShell>
  );
}

/** Read-only card that opens a picker (e.g. birth date). */
export function ProfileSelectField({
  label,
  valueText,
  onPress,
  icon = 'calendar-outline',
}: {
  label: string;
  valueText: string | null;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const floated = !!valueText;
  return (
    <Pressable onPress={onPress} accessibilityRole="button">
      <CardShell minHeight={78}>
        <View style={styles.selectRow}>
          <View style={[styles.inner, !floated && styles.innerCentered, styles.selectTextWrap]}>
            {floated ? <Text style={styles.fieldLabel}>{label}</Text> : null}
            <Text style={[floated ? styles.selectValue : styles.selectPlaceholder]}>
              {valueText ?? label}
            </Text>
          </View>
          <Ionicons name={icon} size={20} color={colors.secondaryText} />
        </View>
      </CardShell>
    </Pressable>
  );
}

export interface PillOption {
  value: string;
  label: string;
}

/** Title + a row of selectable pills (sex, neutered). */
export function ProfilePillField({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: PillOption[];
  value: string | null;
  onChange: (value: string) => void;
}) {
  const styles = useThemedStyles(makeStyles);
  return (
    <CardShell minHeight={90}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.pillRow}>
        {options.map((option) => {
          const selected = value === option.value;
          return (
            <TouchableOpacity
              key={option.value}
              style={[styles.pill, selected ? styles.pillSelected : styles.pillUnselected]}
              onPress={() => onChange(option.value)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityState={{ selected }}
            >
              <Text style={[styles.pillText, selected ? styles.pillTextSelected : styles.pillTextUnselected]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </CardShell>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: c.surface,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  inner: {
    gap: 6,
    width: '100%',
  },
  innerCentered: {
    flex: 1,
    justifyContent: 'center',
  },
  fieldLabel: {
    fontFamily: 'Rubik-Regular',
    fontSize: 14,
    lineHeight: 20,
    color: c.secondaryText,
  },
  nameInput: {
    fontFamily: 'Rubik-Medium',
    fontSize: 20,
    lineHeight: 24,
    color: c.primaryText,
    padding: 0,
    margin: 0,
  },
  textInput: {
    fontFamily: 'Rubik-Regular',
    fontSize: 16,
    lineHeight: 24,
    color: c.primaryText,
    padding: 0,
    margin: 0,
  },
  textInputCentered: {
    minHeight: 24,
  },
  selectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  selectTextWrap: {
    flex: 1,
  },
  selectValue: {
    fontFamily: 'Rubik-Regular',
    fontSize: 16,
    lineHeight: 24,
    color: c.primaryText,
  },
  selectPlaceholder: {
    fontFamily: 'Rubik-Regular',
    fontSize: 16,
    lineHeight: 24,
    color: c.secondaryText,
  },
  pillRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  pill: {
    height: 36,
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillSelected: {
    backgroundColor: c.brand,
    shadowColor: '#1E1E1E',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  pillUnselected: {
    backgroundColor: c.track,
  },
  pillText: {
    fontFamily: 'Rubik-Medium',
    fontSize: 14,
    lineHeight: 18,
  },
  pillTextSelected: {
    color: c.button.primaryText,
  },
  pillTextUnselected: {
    color: c.primaryText,
  },
});
