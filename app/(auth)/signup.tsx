import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import auth from '@/services/firebaseAuth';
import { Colors, Radius, Spacing } from '@/constants/theme';

export default function SignupScreen() {
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = async () => {
    if (!email || !password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(credential.user);
      router.replace('/(auth)/verify-email' as any);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to create an account.');
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
          <View style={styles.header}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Sign up to get started</Text>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={Colors.secondaryText}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={Colors.secondaryText}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              placeholderTextColor={Colors.secondaryText}
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />

            <TouchableOpacity 
              style={[styles.button, isLoading && styles.buttonDisabled]} 
              onPress={handleSignup}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={Colors.surface} />
              ) : (
                <Text style={styles.buttonText}>Sign up</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.footerLink}>Log in</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    justifyContent: 'center',
  },
  header: {
    marginBottom: Spacing.xl * 2,
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Rubik-SemiBold',
    fontSize: 28,
    color: Colors.primaryText,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontFamily: 'Rubik-Regular',
    fontSize: 16,
    color: Colors.secondaryText,
  },
  errorText: {
    fontFamily: 'Rubik-Regular',
    color: Colors.error,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  form: {
    gap: Spacing.md,
  },
  input: {
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderRadius: Radius.md,
    fontFamily: 'Rubik-Regular',
    fontSize: 16,
    color: Colors.primaryText,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  button: {
    backgroundColor: Colors.primaryText,
    padding: Spacing.lg,
    borderRadius: Radius.md,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    fontFamily: 'Rubik-Medium',
    fontSize: 16,
    color: Colors.surface,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.xl * 2,
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
});
