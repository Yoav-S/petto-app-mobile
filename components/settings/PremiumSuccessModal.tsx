import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Platform,
  Pressable,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { type ThemeColors } from '@/constants/theme';
import { PRIMARY_BUTTON } from '@/constants/buttons';
import { useColors, useThemedStyles } from '@/context/ThemeContext';
import { useSettledModalVisible } from '@/components/ui/BottomSheetModal';
import { t } from '@/i18n';

interface PremiumSuccessModalProps {
  visible: boolean;
  onClose: () => void;
}

const BENEFIT_KEYS = [
  'settings.plan_premium_pets',
  'settings.plan_premium_reminders',
] as const;

export default function PremiumSuccessModal({ visible, onClose }: PremiumSuccessModalProps) {
  const styles = useThemedStyles(makeStyles);
  const colors = useColors();
  const presented = useSettledModalVisible(visible);

  if (!presented) return null;

  return (
    <Modal
      transparent
      visible
      animationType="fade"
      onRequestClose={onClose}
      presentationStyle={Platform.OS === 'ios' ? 'overFullScreen' : undefined}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.card}>
              <View style={styles.iconWrap}>
                <Ionicons name="checkmark-circle" size={40} color={colors.success} />
              </View>

              <Text style={styles.title}>{t('settings.purchase_success_title')}</Text>
              <Text style={styles.message}>{t('settings.purchase_success_body')}</Text>

              <View style={styles.benefits}>
                {BENEFIT_KEYS.map((key) => (
                  <View key={key} style={styles.benefitRow}>
                    <Ionicons name="checkmark" size={18} color={colors.brand} />
                    <Text style={styles.benefitText}>{t(key)}</Text>
                  </View>
                ))}
              </View>

              <Pressable style={styles.cta} onPress={onClose} accessibilityRole="button">
                <Text style={styles.ctaText}>{t('settings.purchase_success_cta')}</Text>
              </Pressable>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: c.overlay,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 24,
    },
    card: {
      width: '100%',
      maxWidth: 340,
      backgroundColor: c.surface,
      borderRadius: 16,
      paddingHorizontal: 24,
      paddingTop: 28,
      paddingBottom: 24,
      alignItems: 'center',
      gap: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 8,
    },
    iconWrap: {
      marginBottom: 4,
    },
    title: {
      fontFamily: 'Rubik-Medium',
      fontSize: 20,
      lineHeight: 26,
      color: c.primaryText,
      textAlign: 'center',
    },
    message: {
      fontFamily: 'Rubik-Regular',
      fontSize: 14,
      lineHeight: 20,
      color: c.secondaryText,
      textAlign: 'center',
    },
    benefits: {
      alignSelf: 'stretch',
      marginTop: 8,
      gap: 10,
      paddingVertical: 4,
    },
    benefitRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    benefitText: {
      flex: 1,
      fontFamily: 'Rubik-Regular',
      fontSize: 15,
      lineHeight: 20,
      color: c.primaryText,
    },
    cta: {
      ...PRIMARY_BUTTON,
      alignSelf: 'stretch',
      marginTop: 12,
      backgroundColor: c.button.primaryBg,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    ctaText: {
      fontFamily: 'Rubik-Medium',
      fontSize: 16,
      lineHeight: 20,
      color: c.button.primaryText,
    },
  });
