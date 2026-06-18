import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ApiError } from '@/services/api';
import { getErrorMessage } from '@/services/errors';
import { sendOtp, setPendingEmail, setVerifyScreenMessage } from '@/services/auth';
import { t } from '@/i18n';
import { Colors, Radius, Spacing } from '@/constants/theme';
import GoogleSignInButton from '@/components/auth/GoogleSignInButton';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignupScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const isValidEmail = EMAIL_REGEX.test(email.trim());

  const handleContinue = async () => {
    if (!isValidEmail) {
      setError(t('errors.invalid_email'));
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const normalizedEmail = email.trim().toLowerCase();
      await sendOtp(normalizedEmail);
      setPendingEmail(normalizedEmail);
      router.replace('/(auth)/verify-email' as any);
    } catch (err: unknown) {
      console.error(err);
      if (err instanceof ApiError && err.status === 429) {
        const normalizedEmail = email.trim().toLowerCase();
        setPendingEmail(normalizedEmail);
        setVerifyScreenMessage(err.message);
        router.replace('/(auth)/verify-email' as any);
        return;
      }
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.content}>
          <View style={styles.card}>
            <Text style={styles.title}>What&apos;s your email address?</Text>
            <Text style={styles.subtitle}>We&apos;ll send you a verification code.</Text>

            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, error ? styles.inputError : null]}
              placeholder="Enter your email"
              placeholderTextColor={Colors.secondaryText}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={(v) => {
                setEmail(v);
                if (error) setError('');
              }}
            />
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity
              style={[
                styles.button,
                (!isValidEmail || isLoading) && styles.buttonDisabled,
              ]}
              onPress={handleContinue}
              disabled={!isValidEmail || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={Colors.surface} />
              ) : (
                <Text style={styles.buttonText}>Continue</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.divider} />
          </View>

          <GoogleSignInButton label="Sign up with Google" />

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.footerLink}>Log in</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.legal}>
            By continuing, you agree to our Terms and Privacy Policy.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1 },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg ?? Radius.md,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  title: {
    fontFamily: 'Rubik-SemiBold',
    fontSize: 22,
    color: Colors.primaryText,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontFamily: 'Rubik-Regular',
    fontSize: 15,
    color: Colors.secondaryText,
    marginBottom: Spacing.lg,
  },
  label: {
    fontFamily: 'Rubik-Regular',
    fontSize: 13,
    color: Colors.secondaryText,
    marginBottom: Spacing.xs,
  },
  input: {
    backgroundColor: Colors.background,
    padding: Spacing.lg,
    borderRadius: Radius.md,
    fontFamily: 'Rubik-Regular',
    fontSize: 16,
    color: Colors.primaryText,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  inputError: { borderColor: Colors.error },
  errorText: {
    fontFamily: 'Rubik-Regular',
    color: Colors.error,
    fontSize: 13,
    marginBottom: Spacing.sm,
  },
  button: {
    backgroundColor: Colors.primaryText,
    padding: Spacing.lg,
    borderRadius: Radius.md,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: {
    fontFamily: 'Rubik-Medium',
    fontSize: 16,
    color: Colors.surface,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.lg,
  },
  divider: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: {
    fontFamily: 'Rubik-Medium',
    color: Colors.secondaryText,
    paddingHorizontal: Spacing.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.md,
  },
  footerText: {
    fontFamily: 'Rubik-Regular',
    color: Colors.secondaryText,
    fontSize: 14,
  },
  footerLink: {
    fontFamily: 'Rubik-Medium',
    color: Colors.primaryText,
    fontSize: 14,
  },
  legal: {
    fontFamily: 'Rubik-Regular',
    fontSize: 12,
    color: Colors.secondaryText,
    textAlign: 'center',
    marginTop: Spacing.xl,
    lineHeight: 18,
  },
});
