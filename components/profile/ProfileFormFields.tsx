import React from 'react';
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
import { centeredInputText } from '@/constants/textField';
import type { TextFieldFocusHandler } from '@/hooks/useKeyboardAwareScroll';

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

type FocusHandler = TextFieldFocusHandler;

/** Pet name — always present, Rubik Medium 20/24, no floating label. */
export function ProfileNameField({
  value,
  onChangeText,
  onFocus,
}: {
  value: string;
  onChangeText: (text: string) => void;
  onFocus?: FocusHandler;
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
        onFocus={onFocus}
      />
    </CardShell>
  );
}

/**
 * Optional text field with a static top label. The input stays still;
 * only the placeholder disappears when the user types.
 */
export function ProfileTextField({
  label,
  value,
  onChangeText,
  keyboardType,
  autoCapitalize = 'sentences',
  minHeight = 78,
  onFocus,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  minHeight?: number;
  onFocus?: FocusHandler;
}) {
  const styles = useThemedStyles(makeStyles);

  return (
    <CardShell minHeight={minHeight}>
      <View style={styles.inner}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <TextInput
          style={styles.textInput}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          textAlignVertical="center"
          onFocus={onFocus}
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
  showIcon = true,
}: {
  label: string;
  valueText: string | null;
  onPress: () => void;
  showIcon?: boolean;
}) {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  return (
    <Pressable onPress={onPress} accessibilityRole="button">
      <CardShell minHeight={78}>
        <View style={styles.selectRow}>
          <View style={[styles.inner, styles.selectTextWrap]}>
            <Text style={styles.fieldLabel}>{label}</Text>
            <Text
              style={[valueText ? styles.selectValue : styles.selectPlaceholder]}
              numberOfLines={1}
            >
              {valueText ?? ' '}
            </Text>
          </View>
          {showIcon ? (
            <Ionicons name="calendar-outline" size={20} color={colors.secondaryText} />
          ) : null}
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
  layout = 'default',
}: {
  label: string;
  options: PillOption[];
  value: string | null;
  onChange: (value: string) => void;
  /** Figma sex row: 170×36, gap 16; male 67×36, female 87×36, pill padding 12. */
  layout?: 'default' | 'sex';
}) {
  const styles = useThemedStyles(makeStyles);
  return (
    <CardShell minHeight={90}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={[styles.pillRow, layout === 'sex' && styles.pillRowSex]}>
        {options.map((option) => {
          const selected = value === option.value;
          const pillSizeStyle =
            layout === 'sex'
              ? option.value === 'male'
                ? styles.pillSexMale
                : option.value === 'female'
                  ? styles.pillSexFemale
                  : styles.pillDefault
              : styles.pillDefault;
          return (
            <TouchableOpacity
              key={option.value}
              style={[
                pillSizeStyle,
                selected ? styles.pillSelected : styles.pillUnselected,
              ]}
              onPress={() => onChange(option.value)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityState={{ selected }}
            >
              <Text
                style={[
                  styles.pillText,
                  selected ? styles.pillTextSelected : styles.pillTextUnselected,
                ]}
                numberOfLines={1}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </CardShell>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
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
    fieldLabel: {
      fontFamily: 'Rubik-Regular',
      fontSize: 14,
      lineHeight: 20,
      color: c.secondaryText,
    },
    nameInput: {
      ...centeredInputText({
        fontFamily: 'Rubik-Medium',
        fontSize: 20,
        lineHeight: 24,
        color: c.primaryText,
      }),
    },
    textInput: {
      ...centeredInputText({
        fontFamily: 'Rubik-Regular',
        fontSize: 16,
        lineHeight: 24,
        color: c.primaryText,
      }),
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
      alignItems: 'center',
      gap: 12,
      marginTop: 10,
    },
    pillRowSex: {
      width: 170,
      height: 36,
      gap: 16,
    },
    pillDefault: {
      width: 87,
      height: 36,
      borderRadius: 12,
      paddingVertical: 6,
      paddingHorizontal: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pillSexMale: {
      width: 67,
      height: 36,
      borderRadius: 12,
      paddingVertical: 6,
      paddingHorizontal: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pillSexFemale: {
      width: 87,
      height: 36,
      borderRadius: 12,
      paddingVertical: 6,
      paddingHorizontal: 12,
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
      backgroundColor: c.inactiveControl,
    },
    pillText: {
      fontFamily: 'Rubik-Regular',
      fontSize: 16,
      lineHeight: 20,
      textAlign: 'center',
    },
    pillTextSelected: {
      fontFamily: 'Rubik-Medium',
      color: c.button.primaryText,
    },
    pillTextUnselected: {
      color: c.primaryText,
    },
  });
