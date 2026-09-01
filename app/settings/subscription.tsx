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
import { useFocusEffect } from '@react-navigation/native';
import HeaderScrollLayout from '@/components/ui/HeaderScrollLayout';
import { PAGE_HORIZONTAL_PADDING } from '@/constants/layout';
import { PRIMARY_BUTTON } from '@/constants/buttons';
import { Ionicons } from '@expo/vector-icons';
import { type ThemeColors } from '@/constants/theme';
import { t } from '@/i18n';
import { useColors, useThemedStyles } from '@/context/ThemeContext';
import SettingsHeader from '@/components/settings/SettingsHeader';
import PremiumSuccessModal from '@/components/settings/PremiumSuccessModal';
import {
  getMyProfile,
  isPremiumPlan,
  openManageSubscriptions,
} from '@/services/subscription';
import {
  getLocalizedPriceString,
  getPremiumWillRenewFromStore,
  purchasePremium,
  syncPurchasesWithStore,
} from '@/services/purchases';
import { formatDisplayDateLong, formatDisplayHourMinute } from '@/utils/calendar';
import type { UserSubscription } from '@/types/api';

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
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [priceLabel, setPriceLabel] = useState(t('settings.plan_premium_price'));
  const [successVisible, setSuccessVisible] = useState(false);

  const refresh = useCallback(async () => {
    await syncPurchasesWithStore();
    try {
      const profile = await getMyProfile();
      const sub = profile.subscription ?? null;
      const storeWillRenew = await getPremiumWillRenewFromStore();
      if (sub && storeWillRenew !== null) {
        setSubscription({ ...sub, will_renew: storeWillRenew });
      } else {
        setSubscription(sub);
      }
      setPlan(isPremiumPlan(sub) ? 'premium' : 'free');
    } catch {
      setSubscription(null);
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

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const openSubscriptionSettings = useCallback(async () => {
    setBusy(true);
    try {
      await openManageSubscriptions(subscription?.product_id);
    } catch {
      Alert.alert(t('common.error'), t('settings.manage_subscription_failed'));
    } finally {
      setBusy(false);
    }
  }, [subscription?.product_id]);

  const handleSelectFree = () => {
    if (plan !== 'premium') return;

    if (subscription?.will_renew === false) {
      Alert.alert(t('settings.subscription'), t('settings.downgrade_already_scheduled'));
      return;
    }

    Alert.alert(t('settings.downgrade_title'), t('settings.downgrade_body'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('settings.downgrade_confirm'),
        onPress: () => {
          void openSubscriptionSettings();
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
      if (result.premium) setPlan('premium');
      setSuccessVisible(true);
      setTimeout(() => {
        void refresh();
      }, 1500);
    } finally {
      setBusy(false);
    }
  };

  const expiresAtDate = subscription?.expires_at ? new Date(subscription.expires_at) : null;
  const expiryLabel =
    expiresAtDate && !Number.isNaN(expiresAtDate.getTime())
      ? `${formatDisplayDateLong(expiresAtDate)}, ${formatDisplayHourMinute(
          expiresAtDate.getHours(),
          expiresAtDate.getMinutes(),
        )}`
      : null;
  const downgradePending = plan === 'premium' && subscription?.will_renew === false;

  return (
    <>
      <PremiumSuccessModal
        visible={successVisible}
        onClose={() => setSuccessVisible(false)}
      />
      <HeaderScrollLayout header={<SettingsHeader title={t('settings.subscription')} />}>
        {({ paddingTop, paddingBottom }) =>
          loading ? (
            <View style={[styles.loadingWrap, { paddingTop: paddingTop + 12 }]}>
              <ActivityIndicator color={colors.brand} />
            </View>
          ) : (
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={[
                styles.content,
                { paddingTop: paddingTop + 12, paddingBottom: paddingBottom + 40 },
              ]}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.cardWrap}>
                {plan === 'free' ? <CurrentPlanBadge /> : null}
                <Pressable
                  style={[styles.freeCard, plan === 'free' && styles.cardCurrent]}
                  onPress={handleSelectFree}
                  disabled={busy || plan !== 'premium'}
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

              {plan === 'premium' && expiryLabel ? (
                <View style={styles.statusBlock}>
                  <Text style={styles.statusNote}>
                    {downgradePending
                      ? `${t('settings.downgrade_scheduled')} ${expiryLabel}`
                      : `${t('settings.subscription_renews_on')} ${expiryLabel}`}
                  </Text>
                  {downgradePending ? (
                    <>
                      <Text style={styles.statusHint}>{t('settings.keep_premium_hint')}</Text>
                      <Pressable
                        style={styles.keepPremiumBtn}
                        onPress={() => {
                          void openSubscriptionSettings();
                        }}
                        disabled={busy}
                      >
                        {busy ? (
                          <ActivityIndicator color={colors.button.primaryText} />
                        ) : (
                          <Text style={styles.keepPremiumText}>{t('settings.keep_premium')}</Text>
                        )}
                      </Pressable>
                    </>
                  ) : null}
                </View>
              ) : null}
            </ScrollView>
          )
        }
      </HeaderScrollLayout>
    </>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    scroll: {
      flex: 1,
    },
    loadingWrap: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    content: {
      paddingHorizontal: PAGE_HORIZONTAL_PADDING,
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
      backgroundColor: c.brandDark,
      alignItems: 'center',
      justifyContent: 'center',
    },
    badgeText: {
      fontFamily: 'Rubik-Medium',
      fontSize: 12,
      lineHeight: 16,
      color: c.button.primaryText,
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
    statusBlock: {
      gap: 12,
      marginTop: -8,
    },
    statusNote: {
      fontFamily: 'Rubik-Regular',
      fontSize: 12,
      lineHeight: 16,
      color: c.secondaryText,
      textAlign: 'center',
    },
    statusHint: {
      fontFamily: 'Rubik-Regular',
      fontSize: 12,
      lineHeight: 16,
      color: c.secondaryText,
      textAlign: 'center',
    },
    keepPremiumBtn: {
      ...PRIMARY_BUTTON,
      backgroundColor: c.brand,
      alignSelf: 'center',
      alignItems: 'center',
      justifyContent: 'center',
    },
    keepPremiumText: {
      fontFamily: 'Rubik-Medium',
      fontSize: 16,
      color: c.button.primaryText,
    },
  });
