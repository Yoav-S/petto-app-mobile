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
import { Colors, Radius, Spacing } from '@/constants/theme';

interface GoogleSignInButtonProps {
  label?: string;
}

export default function GoogleSignInButton({
  label = 'Continue with Google',
}: GoogleSignInButtonProps) {
  const { signInWithGoogle, isGoogleLoading, googleAuthError } = useAuth();

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
          <ActivityIndicator color={Colors.primaryText} />
        ) : (
          <>
            <Ionicons
              name="logo-google"
              size={20}
              color={Colors.primaryText}
              style={styles.icon}
            />
            <Text style={styles.buttonText}>{label}</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  errorText: {
    fontFamily: 'Rubik-Regular',
    color: Colors.error,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  button: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  icon: {
    marginRight: Spacing.sm,
  },
  buttonText: {
    fontFamily: 'Rubik-Medium',
    fontSize: 16,
    color: Colors.primaryText,
  },
});
