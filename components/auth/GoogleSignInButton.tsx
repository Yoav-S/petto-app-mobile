import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { Radius, Spacing, type ThemeColors } from '@/constants/theme';
import { PRIMARY_BUTTON } from '@/constants/buttons';
import { useColors, useThemedStyles } from '@/context/ThemeContext';

interface GoogleSignInButtonProps {
  label?: string;
}

export default function GoogleSignInButton({
  label = 'Continue with Google',
}: GoogleSignInButtonProps) {
  const { signInWithGoogle, isGoogleLoading, googleAuthError } = useAuth();
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);

  return (
    <View>
      {googleAuthError ? (
        <Text style={styles.errorText}>{googleAuthError}</Text>
      ) : null}
      <TouchableOpacity
        style={[styles.button, isGoogleLoading && styles.buttonDisabled]}
        onPress={signInWithGoogle}
        disabled={isGoogleLoading}
        activeOpacity={0.8}
      >
        {isGoogleLoading ? (
          <ActivityIndicator color={colors.primaryText} />
        ) : (
          <>
            <Ionicons
              name="logo-google"
              size={20}
              color={colors.primaryText}
            />
            <Text style={styles.buttonText}>{label}</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  errorText: {
    fontFamily: 'Rubik-Regular',
    color: c.error,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  button: {
    ...PRIMARY_BUTTON,
    flexDirection: 'row',
    backgroundColor: c.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: c.border,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    fontFamily: 'Rubik-Medium',
    fontSize: 16,
    color: c.primaryText,
  },
});
