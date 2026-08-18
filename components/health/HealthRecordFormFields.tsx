import React from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import { type ThemeColors } from '@/constants/theme';
import { useColors, useThemedStyles } from '@/context/ThemeContext';

const CARD_SHADOW = {
  shadowColor: '#2D2D2A',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.04,
  shadowRadius: 20,
  elevation: 3,
};

interface FieldCardShellProps {
  cardStyle: {
    width: number;
    borderRadius: number;
    paddingHorizontal: number;
    paddingVertical: number;
    minHeight: number;
  };
  children: React.ReactNode;
}

function FieldCardShell({ cardStyle, children }: FieldCardShellProps) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View
      style={[
        styles.card,
        CARD_SHADOW,
        {
          width: cardStyle.width,
          borderRadius: cardStyle.borderRadius,
          paddingHorizontal: cardStyle.paddingHorizontal,
          paddingVertical: cardStyle.paddingVertical,
          minHeight: cardStyle.minHeight,
        },
      ]}
    >
      {children}
    </View>
  );
}

interface NameFieldCardProps {
  value: string;
  onChangeText: (text: string) => void;
  label: string;
  placeholder: string;
  focused: boolean;
  onFocus: () => void;
  onBlur: () => void;
  cardStyle: {
    width: number;
    borderRadius: number;
    paddingHorizontal: number;
    paddingVertical: number;
    minHeight: number;
  };
  autoFocus?: boolean;
}

/** Name: single placeholder when idle; it disappears on focus — no top label. */
function NameFieldCard({
  value,
  onChangeText,
  placeholder,
  focused,
  onFocus,
  onBlur,
  cardStyle,
  autoFocus = false,
}: Omit<NameFieldCardProps, 'label'>) {
  const styles = useThemedStyles(makeStyles);
  const colors = useColors();
  return (
    <FieldCardShell cardStyle={cardStyle}>
      <View style={[styles.inner, styles.nameInnerCentered]}>
        <TextInput
          style={[styles.input, styles.nameInput, styles.nameInputUnfocused]}
          value={value}
          onChangeText={onChangeText}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholder={focused ? undefined : placeholder}
          placeholderTextColor={colors.secondaryText}
          textAlignVertical="center"
          autoFocus={autoFocus}
        />
      </View>
    </FieldCardShell>
  );
}

interface DescriptionFieldCardProps {
  value: string;
  onChangeText: (text: string) => void;
  label: string;
  placeholder: string;
  focused: boolean;
  onFocus: () => void;
  onBlur: () => void;
  cardStyle: {
    width: number;
    borderRadius: number;
    paddingHorizontal: number;
    paddingVertical: number;
    minHeight: number;
  };
}

/** Description: always-visible top label; placeholder lives in the input. */
function DescriptionFieldCard({
  value,
  onChangeText,
  label,
  placeholder,
  onFocus,
  onBlur,
  cardStyle,
}: DescriptionFieldCardProps) {
  const styles = useThemedStyles(makeStyles);
  const colors = useColors();

  return (
    <FieldCardShell cardStyle={cardStyle}>
      <View style={[styles.inner, styles.descriptionInner]}>
        <Text style={styles.floatingLabel}>{label}</Text>
        <TextInput
          style={[styles.input, styles.descriptionInput, styles.descriptionInputFocused]}
          value={value}
          onChangeText={onChangeText}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholder={placeholder}
          placeholderTextColor={colors.secondaryText}
          multiline
          textAlignVertical="top"
        />
      </View>
    </FieldCardShell>
  );
}

interface HealthRecordFormFieldsProps {
  name: string;
  onNameChange: (text: string) => void;
  namePlaceholder: string;
  nameFocused: boolean;
  onNameFocus: () => void;
  onNameBlur: () => void;
  description: string;
  onDescriptionChange: (text: string) => void;
  descriptionLabel: string;
  descriptionPlaceholder: string;
  descriptionFocused: boolean;
  onDescriptionFocus: () => void;
  onDescriptionBlur: () => void;
  layout: {
    cardWidth: number;
    cardRadius: number;
    cardPadH: number;
    cardPadV: number;
    nameHeight: number;
    descriptionHeight: number;
    gap: number;
  };
  autoFocusName?: boolean;
}

export default function HealthRecordFormFields({
  name,
  onNameChange,
  namePlaceholder,
  nameFocused,
  onNameFocus,
  onNameBlur,
  description,
  onDescriptionChange,
  descriptionLabel,
  descriptionPlaceholder,
  descriptionFocused,
  onDescriptionFocus,
  onDescriptionBlur,
  layout,
  autoFocusName = true,
}: HealthRecordFormFieldsProps) {
  const styles = useThemedStyles(makeStyles);
  const cardBase = {
    width: layout.cardWidth,
    borderRadius: layout.cardRadius,
    paddingHorizontal: layout.cardPadH,
    paddingVertical: layout.cardPadV,
  };

  return (
    <View style={[styles.wrap, { width: layout.cardWidth, gap: layout.gap }]}>
      <NameFieldCard
        value={name}
        onChangeText={onNameChange}
        placeholder={namePlaceholder}
        focused={nameFocused}
        onFocus={onNameFocus}
        onBlur={onNameBlur}
        cardStyle={{ ...cardBase, minHeight: layout.nameHeight }}
        autoFocus={autoFocusName}
      />
      <DescriptionFieldCard
        value={description}
        onChangeText={onDescriptionChange}
        label={descriptionLabel}
        placeholder={descriptionPlaceholder}
        focused={descriptionFocused}
        onFocus={onDescriptionFocus}
        onBlur={onDescriptionBlur}
        cardStyle={{ ...cardBase, minHeight: layout.descriptionHeight }}
      />
    </View>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  wrap: {
    alignSelf: 'center',
  },
  card: {
    backgroundColor: c.surface,
    justifyContent: 'center',
  },
  inner: {
    gap: 6,
    width: '100%',
  },
  nameInnerCentered: {
    flex: 1,
    justifyContent: 'center',
  },
  descriptionInner: {
    flex: 1,
    minHeight: 50,
    justifyContent: 'flex-start',
  },
  floatingLabel: {
    fontFamily: 'Rubik-Regular',
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
  nameInput: {
    fontFamily: 'Rubik-Medium',
    fontSize: 16,
    lineHeight: 20,
    minHeight: 20,
  },
  nameInputUnfocused: {
    textAlignVertical: 'center',
  },
  descriptionInput: {
    fontFamily: 'Rubik-Regular',
    fontSize: 16,
    lineHeight: 24,
    minHeight: 24,
    color: c.primaryText,
  },
  descriptionInputFocused: {
    textAlignVertical: 'top',
    flex: 1,
  },
});
