import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { type ThemeColors } from '@/constants/theme';
import { useColors, useThemedStyles } from '@/context/ThemeContext';
import { useLocale, useT } from '@/context/LocaleContext';
import { useToast } from '@/context/ToastContext';
import SettingsHeader from '@/components/settings/SettingsHeader';
import { HeaderScrollScreen } from '@/components/ui/HeaderScrollLayout';
import { getErrorMessage } from '@/services/errors';
import { listBlockedUsers, unblockUser, type BlockedUser } from '@/services/places';

export default function BlockedUsersScreen() {
  const { locale } = useLocale();
  const t = useT();
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const toast = useToast();
  const [users, setUsers] = useState<BlockedUser[] | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      listBlockedUsers()
        .then((rows) => {
          if (!cancelled) setUsers(rows);
        })
        .catch((err) => {
          if (cancelled) return;
          setUsers([]);
          toast.showError(getErrorMessage(err));
        });
      return () => {
        cancelled = true;
      };
    }, [toast]),
  );

  const unblock = async (user: BlockedUser) => {
    setUsers((prev) => (prev ?? []).filter((item) => item.id !== user.id));
    try {
      await unblockUser(user.id);
    } catch (err) {
      setUsers((prev) => [user, ...(prev ?? [])]);
      toast.showError(getErrorMessage(err));
    }
  };

  return (
    <HeaderScrollScreen
      header={<SettingsHeader key={locale} title={t('settings.blocked_users')} rounded />}
      contentGap={4}
      chromePaddingBottom={0}
      contentContainerStyle={styles.content}
    >
      <View style={styles.card}>
        {users === null ? (
          <ActivityIndicator color={colors.brand} />
        ) : users.length === 0 ? (
          <Text style={styles.empty}>{t('settings.blocked_users_empty')}</Text>
        ) : (
          users.map((user) => (
            <View key={user.id} style={styles.row}>
              <Text style={styles.name} numberOfLines={1}>
                {user.name || t('settings.blocked_user_unnamed')}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  void unblock(user);
                }}
                accessibilityRole="button"
                hitSlop={8}
              >
                <Text style={styles.unblock}>{t('settings.unblock')}</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>
    </HeaderScrollScreen>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    content: {
      flexGrow: 1,
    },
    card: {
      backgroundColor: c.surface,
      borderRadius: 24,
      paddingTop: 22,
      paddingRight: 20,
      paddingBottom: 22,
      paddingLeft: 20,
      gap: 4,
    },
    row: {
      height: 56,
      boxSizing: 'border-box',
      borderRadius: 16,
      padding: 16,
      backgroundColor: c.background,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    name: {
      flexShrink: 1,
      fontFamily: 'Rubik-Medium',
      fontSize: 16,
      lineHeight: 20,
      color: c.primaryText,
    },
    unblock: {
      fontFamily: 'Rubik-Medium',
      fontSize: 14,
      lineHeight: 20,
      color: c.brand,
    },
    empty: {
      fontFamily: 'Rubik-Regular',
      fontSize: 14,
      lineHeight: 20,
      color: c.secondaryText,
      textAlign: 'center',
    },
  });
