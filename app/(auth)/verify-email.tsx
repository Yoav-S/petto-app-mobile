import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  getPendingEmail,
  clearPendingEmail,
  verifyOtpAndSignIn,
  resendOtp,
} from '@/services/auth';
import { Colors, Radius, Spacing } from '@/constants/theme';

const OTP_LENGTH = 6;
const RESEND_COOLDOWN_SEC = 20;

export default function VerifyEmailScreen() {
  const router = useRouter();
  const email = getPendingEmail() ?? '';
  const inputRef = useRef<TextInput>(null);

  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SEC);

  useEffect(() => {
    if (!email) {
      router.replace('/(auth)/login' as any);
    }
  }, [email, router]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const handleVerify = async () => {
    if (otp.length !== OTP_LENGTH) {
      setError('Enter the 6-digit code from your email.');
      return;
    }

    setIsVerifying(true);
    setError('');
    try {
      await verifyOtpAndSignIn(email, otp);
      router.replace('/(tabs)' as any);
    } catch (err: any) {
      console.error(err);
      setError('Invalid or expired code. Try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || !email) return;
    setIsSending(true);
    setError('');
    try {
      await resendOtp(email);
      setCooldown(RESEND_COOLDOWN_SEC);
    } catch (err: any) {
      if (String(err.message).includes('429')) {
        setError('Please wait before requesting a new code.');
      } else {
        setError('Something went wrong. Check your connection.');
      }
    } finally {
      setIsSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.title}>Verify your email</Text>
          <Text style={styles.subtitle}>
            We sent a 6-digit code to{'\n'}
            <Text style={styles.email}>{email}</Text>
          </Text>

          <View style={styles.otpRow}>
            {Array.from({ length: OTP_LENGTH }).map((_, i) => (
              <View
                key={i}
                style={[styles.otpBox, otp[i] ? styles.otpBoxFilled : null]}
              >
                <Text style={styles.otpDigit}>{otp[i] ?? ''}</Text>
              </View>
            ))}
          </View>

          <TextInput
            ref={inputRef}
            style={styles.hiddenInput}
            keyboardType="number-pad"
            maxLength={OTP_LENGTH}
            value={otp}
            onChangeText={(v) => {
              setOtp(v.replace(/\D/g, '').slice(0, OTP_LENGTH));
              if (error) setError('');
            }}
            autoFocus
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity
            style={[
              styles.button,
              (otp.length !== OTP_LENGTH || isVerifying) && styles.buttonDisabled,
            ]}
            onPress={handleVerify}
            disabled={otp.length !== OTP_LENGTH || isVerifying}
          >
            {isVerifying ? (
              <ActivityIndicator color={Colors.surface} />
            ) : (
              <Text style={styles.buttonText}>Verify</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleResend}
            disabled={cooldown > 0 || isSending}
            style={styles.resendRow}
          >
            <Text style={[styles.resendText, cooldown > 0 && styles.resendMuted]}>
              {cooldown > 0
                ? `Resend code 00:${String(cooldown).padStart(2, '0')}`
                : isSending
                  ? 'Sending…'
                  : 'Resend code'}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            clearPendingEmail();
            router.back();
          }}
        >
          <Text style={styles.backText}>Change email</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
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
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontFamily: 'Rubik-Regular',
    fontSize: 15,
    color: Colors.secondaryText,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  email: {
    fontFamily: 'Rubik-Medium',
    color: Colors.primaryText,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  otpBox: {
    width: 44,
    height: 52,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  otpBoxFilled: { borderColor: Colors.primaryText },
  otpDigit: {
    fontFamily: 'Rubik-SemiBold',
    fontSize: 22,
    color: Colors.primaryText,
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    height: 0,
    width: 0,
  },
  errorText: {
    fontFamily: 'Rubik-Regular',
    color: Colors.error,
    textAlign: 'center',
    marginBottom: Spacing.md,
    fontSize: 13,
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
  resendRow: { alignItems: 'center', marginTop: Spacing.lg },
  resendText: {
    fontFamily: 'Rubik-Medium',
    fontSize: 14,
    color: Colors.primaryText,
  },
  resendMuted: { color: Colors.secondaryText },
  backButton: { alignItems: 'center', marginTop: Spacing.xl },
  backText: {
    fontFamily: 'Rubik-Regular',
    fontSize: 14,
    color: Colors.secondaryText,
  },
});
