import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { type ThemeColors } from '@/constants/theme';
import { t } from '@/i18n';
import { useColors, useThemedStyles } from '@/context/ThemeContext';
import SettingsHeader from '@/components/settings/SettingsHeader';
import {
  getMyProfile,
  isPremiumPlan,
  openManageSubscriptions,
} from '@/services/subscription';
import {
  getLocalizedPriceString,
  purchasePremium,
  restorePremium,
} from '@/services/purchases';

type PlanId = 'free' | 'premium';

function CurrentPlanBadge() {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.badge} pointerEvents="none">
      <Text style={styles.badgeText}>{t('settings.current_plan')}</Text>
    </View>
  );
}

function PlanCheckbox({ selected }: { selected: boolean }) {
  const styles = useThemedStyles(makeStyles);
  const colors = useColors();
  return (
    <View style={[styles.checkbox, selected && styles.checkboxChecked]}>
      {selected ? (
        <Ionicons name="checkmark" size={16} color={colors.button.primaryText} />
      ) : null}
    </View>
  );
}

export default function SubscriptionSettingsScreen() {
  const styles = useThemedStyles(makeStyles);
  const colors = useColors();

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [plan, setPlan] = useState<PlanId>('free');
  const [priceLabel, setPriceLabel] = useState(t('settings.plan_premium_price'));

  const refresh = useCallback(async () => {
    try {
      const profile = await getMyProfile();
      setPlan(isPremiumPlan(profile.subscription) ? 'premium' : 'free');
    } catch {
      setPlan('free');
    }
    try {
      const live = await getLocalizedPriceString();
      if (live) setPriceLabel(`${live}/${t('settings.plan_month_short')}`);
    } catch {
      // Keep fallback translated price.
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      await refresh();
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  const handleSelectFree = async () => {
    if (plan === 'free') return;
    Alert.alert(t('settings.manage_subscription'), t('settings.manage_subscription_body'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('settings.manage_subscription'),
        onPress: () => {
          void openManageSubscriptions();
        },
      },
    ]);
  };

  const handleSelectPremium = async () => {
    if (plan === 'premium') return;
    setBusy(true);
    try {
      const result = await purchasePremium();
      if (result.status === 'cancelled') {
        Alert.alert(t('settings.subscription'), t('settings.purchase_cancelled'));
        return;
      }
      if (result.status === 'unavailable') {
        Alert.alert(t('settings.subscription'), result.message);
        return;
      }
      if (result.status === 'error') {
        Alert.alert(t('common.error'), result.message);
        return;
      }
      if (result.status !== 'success') return;
      // Webhook may lag — optimistically show premium if entitlement is active.
      if (result.premium) setPlan('premium');
      Alert.alert(t('settings.subscription'), t('settings.purchase_success'));
      // Soft refresh after a short delay for webhook.
      setTimeout(() => {
        void refresh();
      }, 1500);
    } finally {
      setBusy(false);
    }
  };

  const handleRestore = async () => {
    setBusy(true);
    try {
      const result = await restorePremium();
      if (result.status === 'unavailable') {
        Alert.alert(t('settings.subscription'), result.message);
        return;
      }
      if (result.status === 'error') {
        Alert.alert(t('common.error'), result.message);
        return;
      }
      if (result.status !== 'success') return;
      if (result.premium) {
        setPlan('premium');
        Alert.alert(t('settings.subscription'), t('settings.restore_success'));
        setTimeout(() => {
          void refresh();
        }, 1500);
      } else {
        Alert.alert(t('settings.subscription'), t('settings.restore_none'));
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <SettingsHeader title={t('settings.subscription')} />

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.brand} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Free plan */}
          <View style={styles.cardWrap}>
            {plan === 'free' ? <CurrentPlanBadge /> : null}
            <Pressable
              style={[styles.freeCard, plan === 'free' && styles.cardCurrent]}
              onPress={() => {
                void handleSelectFree();
              }}
              disabled={busy}
              accessibilityRole="radio"
              accessibilityState={{ selected: plan === 'free' }}
            >
              <View style={styles.freeLeft}>
                <Text style={styles.planTitle}>{t('settings.plan_free')}</Text>
                <View style={styles.freeBullets}>
                  <Text style={styles.bullet}>{t('settings.plan_free_pets')}</Text>
                  <Text style={styles.bullet}>{t('settings.plan_free_reminders')}</Text>
                </View>
              </View>
              <PlanCheckbox selected={plan === 'free'} />
            </Pressable>
          </View>

          {/* Premium plan */}
          <View style={[styles.cardWrap, styles.premiumWrap]}>
            {plan === 'premium' ? <CurrentPlanBadge /> : null}
            <Pressable
              style={[styles.premiumCard, plan === 'premium' && styles.cardCurrent]}
              onPress={() => {
                void handleSelectPremium();
              }}
              disabled={busy}
              accessibilityRole="radio"
              accessibilityState={{ selected: plan === 'premium' }}
            >
              <View style={styles.premiumInner}>
                <View style={styles.premiumCopy}>
                  <View style={styles.premiumHead}>
                    <View style={styles.premiumTitles}>
                      <Text style={styles.planTitle}>{t('settings.plan_premium')}</Text>
                      <Text style={styles.price}>{priceLabel}</Text>
                    </View>
                    <Text style={styles.tagline}>{t('settings.plan_premium_tagline')}</Text>
                  </View>
                  <View style={styles.premiumBullets}>
                    <Text style={styles.bullet}>{t('settings.plan_premium_pets')}</Text>
                    <Text style={styles.bullet}>{t('settings.plan_premium_reminders')}</Text>
                  </View>
                </View>
                <PlanCheckbox selected={plan === 'premium'} />
              </View>
            </Pressable>
          </View>

          <Pressable
            style={styles.restoreBtn}
            onPress={() => {
              void handleRestore();
            }}
            disabled={busy}
          >
            {busy ? (
              <ActivityIndicator color={colors.secondaryText} />
            ) : (
              <Text style={styles.restoreText}>{t('settings.restore_purchases')}</Text>
            )}
          </Pressable>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: c.background,
    },
    loadingWrap: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    content: {
      paddingHorizontal: 20,
      paddingTop: 28,
      paddingBottom: 40,
      gap: 22,
    },
    cardWrap: {
      position: 'relative',
    },
    premiumWrap: {
      marginTop: 0,
    },
    badge: {
      position: 'absolute',
      top: -12,
      right: 16,
      zIndex: 2,
      height: 24,
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 8,
      backgroundColor: '#1F2937',
      alignItems: 'center',
      justifyContent: 'center',
    },
    badgeText: {
      fontFamily: 'Rubik-Medium',
      fontSize: 12,
      lineHeight: 16,
      color: '#FFFFFF',
      textAlign: 'center',
    },
    freeCard: {
      backgroundColor: c.surface,
      borderRadius: 12,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: 106,
      // box-shadow: 0px 4px 20px 0px #2D2D2A0A
      shadowColor: '#2D2D2A',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.04,
      shadowRadius: 20,
      elevation: 2,
    },
    premiumCard: {
      backgroundColor: c.surface,
      borderRadius: 12,
      padding: 16,
      minHeight: 150,
      shadowColor: '#2D2D2A',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.04,
      shadowRadius: 20,
      elevation: 2,
    },
    cardCurrent: {
      borderWidth: 1,
      borderColor: c.border,
    },
    freeLeft: {
      width: 196,
      gap: 12,
    },
    freeBullets: {
      gap: 6,
    },
    planTitle: {
      fontFamily: 'Rubik-Medium',
      fontSize: 20,
      lineHeight: 24,
      color: c.primaryText,
    },
    bullet: {
      fontFamily: 'Rubik-Regular',
      fontSize: 12,
      lineHeight: 16,
      color: c.primaryText,
    },
    premiumInner: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 10,
    },
    premiumCopy: {
      flex: 1,
      maxWidth: 264,
      gap: 12,
    },
    premiumHead: {
      gap: 6,
    },
    premiumTitles: {
      gap: 2,
    },
    price: {
      fontFamily: 'Rubik-Medium',
      fontSize: 16,
      lineHeight: 20,
      color: c.primaryText,
    },
    tagline: {
      fontFamily: 'Rubik-Regular',
      fontSize: 12,
      lineHeight: 16,
      color: c.secondaryText,
    },
    premiumBullets: {
      gap: 6,
    },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: 999,
      borderWidth: 2,
      borderColor: c.border,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    checkboxChecked: {
      backgroundColor: c.brand,
      borderColor: c.brand,
    },
    restoreBtn: {
      alignSelf: 'center',
      paddingVertical: 12,
      minHeight: 44,
      justifyContent: 'center',
    },
    restoreText: {
      fontFamily: 'Rubik-Medium',
      fontSize: 14,
      lineHeight: 18,
      color: c.secondaryText,
      textAlign: 'center',
    },
  });
