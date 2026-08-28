import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useActivePet } from '@/store/petStore';
import { PAGE_HORIZONTAL_PADDING } from '@/constants/layout';
import { Spacing, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/context/ThemeContext';
import { getErrorMessage } from '@/services/errors';
import { t } from '@/i18n';
import { useAuth } from '@/context/AuthContext';
import { guardAddPet, guardAddReminder } from '@/services/subscription';
import type { MedicalRecord, Reminder } from '@/types/api';
import { isIsoDateToday, normalizeToDatePart, todayIsoDate, truncateHealthDescription } from '@/utils/calendar';
import { prefetchPetPhoto } from '@/utils/petPhotoSource';
import {
  usePetsQuery,
  useVaccinationsQuery,
  useRemindersQuery,
  useRecordsQuery,
} from '@/hooks/useCachedQueries';

import PetHeader from '@/components/home/PetHeader';
import VaccinesCard from '@/components/home/VaccinesCard';
import RemindersCard from '@/components/home/RemindersCard';
import HealthCard from '@/components/home/HealthCard';
import FABMenu from '@/components/home/FABMenu';
import PetProfilePanel from '@/components/home/PetProfilePanel';
import PetSwitcherSheet from '@/components/home/PetSwitcherSheet';

function reminderToScheduledAt(reminder: Reminder): string {
  return `${reminder.date}T${reminder.time}:00`;
}

type HomeReminder = {
  title: string;
  scheduled_at: string;
  status: 'today' | 'scheduled';
};

function healthRecordToReminder(record: MedicalRecord): HomeReminder | null {
  const date = normalizeToDatePart(record.linked_reminder_date ?? undefined);
  const time = record.linked_reminder_time?.trim();
  if (!date || !time) return null;
  if (date < todayIsoDate()) return null;
  return {
    title: record.title,
    scheduled_at: `${date}T${time}:00`,
    status: isIsoDateToday(date) ? 'today' : 'scheduled',
  };
}

function dedupeReminders(items: HomeReminder[]): HomeReminder[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.scheduled_at}|${item.title}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function sortByScheduledAt(items: HomeReminder[]): HomeReminder[] {
  return [...items].sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at));
}

function pickNextReminder(
  apiToday: Reminder[],
  apiUpcoming: Reminder[],
  healthRecords: MedicalRecord[],
): { next: HomeReminder | null; count: number } {
  const healthReminders = healthRecords
    .map(healthRecordToReminder)
    .filter((r): r is HomeReminder => r != null);

  const today = dedupeReminders(
    sortByScheduledAt([
      ...apiToday.map((r) => ({
        title: r.title,
        scheduled_at: reminderToScheduledAt(r),
        status: 'today' as const,
      })),
      ...healthReminders.filter((r) => r.status === 'today'),
    ]),
  );

  const upcoming = dedupeReminders(
    sortByScheduledAt([
      ...apiUpcoming.map((r) => ({
        title: r.title,
        scheduled_at: reminderToScheduledAt(r),
        status: 'scheduled' as const,
      })),
      ...healthReminders.filter((r) => r.status === 'scheduled'),
    ]),
  );

  return {
    next: today[0] ?? upcoming[0] ?? null,
    count: today.length + upcoming.length,
  };
}

function pickLatestHealthRecord(records: MedicalRecord[]): MedicalRecord | null {
  if (!records.length) return null;
  return (
    [...records].sort((a, b) => {
      const aTime = a.updated_at ?? a.created_at;
      const bTime = b.updated_at ?? b.created_at;
      return bTime.localeCompare(aTime);
    })[0] ?? null
  );
}

export default function HomeScreen() {
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const { user, isLoading: authLoading, syncError, retryBackendSync, isSyncing, signOut } = useAuth();
  const { activePetId, setActivePetId } = useActivePet();

  const [fabOpen, setFabOpen] = useState(false);
  const [switchVisible, setSwitchVisible] = useState(false);
  const [panelMode, setPanelMode] = useState<'home' | 'profile'>('home');

  const petsQuery = usePetsQuery(Boolean(user) && !authLoading);
  const pets = petsQuery.data ?? [];

  const resolvedPetId = useMemo(() => {
    if (!pets.length) return null;
    if (activePetId && pets.some((p) => p.id === activePetId)) return activePetId;
    return pets[0].id;
  }, [activePetId, pets]);

  useEffect(() => {
    if (resolvedPetId && resolvedPetId !== activePetId) {
      void setActivePetId(resolvedPetId);
    }
  }, [resolvedPetId, activePetId, setActivePetId]);

  const pet = useMemo(
    () => (resolvedPetId ? pets.find((p) => p.id === resolvedPetId) ?? pets[0] ?? null : null),
    [pets, resolvedPetId],
  );

  const vaccinesQuery = useVaccinationsQuery(resolvedPetId);
  const todayQuery = useRemindersQuery(resolvedPetId, 'today');
  const upcomingQuery = useRemindersQuery(resolvedPetId, 'upcoming');
  const recordsQuery = useRecordsQuery(resolvedPetId, 'active');

  const latestVaccine = vaccinesQuery.data?.[0] ?? null;
  const { nextReminder, upcomingCount, latestRecord } = useMemo(() => {
    const today = todayQuery.data ?? [];
    const upcoming = upcomingQuery.data ?? [];
    const records = recordsQuery.data ?? [];
    const { next, count } = pickNextReminder(today, upcoming, records);
    const record = pickLatestHealthRecord(records);
    return {
      nextReminder: next
        ? {
            title: next.title,
            scheduled_at: next.scheduled_at,
            status: next.status as 'today' | 'scheduled' | 'missed' | 'completed',
          }
        : null,
      upcomingCount: count,
      latestRecord: record
        ? {
            type: record.title,
            description: truncateHealthDescription(record.description) || undefined,
            date: record.created_at,
            reminder_date: record.linked_reminder_date ?? undefined,
            reminder_time: record.linked_reminder_time ?? undefined,
          }
        : null,
    };
  }, [todayQuery.data, upcomingQuery.data, recordsQuery.data]);

  const domainFetching =
    Boolean(resolvedPetId) &&
    (vaccinesQuery.isFetching ||
      todayQuery.isFetching ||
      upcomingQuery.isFetching ||
      recordsQuery.isFetching);

  const hasCachedHome =
    petsQuery.isSuccess ||
    Boolean(vaccinesQuery.data) ||
    Boolean(todayQuery.data) ||
    Boolean(recordsQuery.data);

  /** Only block UI on first load with no cache — otherwise show stale data. */
  const loading =
    authLoading ||
    (petsQuery.isLoading && !petsQuery.data) ||
    (Boolean(resolvedPetId) && !hasCachedHome && domainFetching);

  const fetchError = petsQuery.error
    ? getErrorMessage(petsQuery.error)
    : vaccinesQuery.error
      ? getErrorMessage(vaccinesQuery.error)
      : todayQuery.error
        ? getErrorMessage(todayQuery.error)
        : recordsQuery.error
          ? getErrorMessage(recordsQuery.error)
          : null;

  const refetchHome = useCallback(() => {
    void vaccinesQuery.refetch();
    void todayQuery.refetch();
    void upcomingQuery.refetch();
    void recordsQuery.refetch();
  }, [
    vaccinesQuery.refetch,
    todayQuery.refetch,
    upcomingQuery.refetch,
    recordsQuery.refetch,
  ]);

  useFocusEffect(
    useCallback(() => {
      setSwitchVisible(false);
      setFabOpen(false);
      if (authLoading || !user) return;
      // Background refresh — cache paints instantly.
      refetchHome();
    }, [authLoading, user, refetchHome]),
  );

  const effectiveMode = pet ? panelMode : 'home';

  useEffect(() => {
    if (effectiveMode === 'profile' && fabOpen) setFabOpen(false);
  }, [effectiveMode, fabOpen]);

  const handleSelectPet = async (petId: string) => {
    setSwitchVisible(false);
    if (petId !== activePetId) {
      const nextPet = pets.find((p) => p.id === petId);
      void prefetchPetPhoto(nextPet?.photo_url);
      await setActivePetId(petId);
    }
  };

  const handleAddPet = async () => {
    setSwitchVisible(false);
    if (!(await guardAddPet(router, pets.length))) return;
    router.push('/pets/add' as never);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
      <View style={styles.screen}>
        <View style={styles.homeFrame}>
          <PetHeader
            pet={pet}
            petCount={pets.length}
            loading={loading}
            onSwitchPress={() => setSwitchVisible(true)}
            onLogout={() => {
              void signOut();
            }}
            onCoverPress={
              pet
                ? () => setPanelMode((mode) => (mode === 'home' ? 'profile' : 'home'))
                : undefined
            }
            onSettingsPress={() => router.push('/settings' as never)}
            onReturnHome={() => setPanelMode('home')}
            onEditProfile={() => router.push('/profile/edit' as never)}
            profileActive={effectiveMode === 'profile'}
          >
            {effectiveMode === 'profile' ? (
              <PetProfilePanel pet={pet} />
            ) : (
              <View style={styles.cardsGrid}>
                <View style={styles.row}>
                  <VaccinesCard
                    latestVaccine={
                      latestVaccine
                        ? {
                            name: latestVaccine.name,
                            date: latestVaccine.date,
                            next_date: latestVaccine.next_date ?? undefined,
                          }
                        : null
                    }
                    loading={loading}
                    onPress={() => router.push('/vaccines' as never)}
                  />
                  <RemindersCard
                    nextReminder={nextReminder}
                    upcomingCount={upcomingCount}
                    loading={loading}
                    onPress={() => router.push('/reminders' as never)}
                  />
                </View>

                <View style={styles.healthWrap}>
                  <HealthCard
                    latestRecord={latestRecord}
                    loading={loading}
                    onPress={() => router.push('/topics' as never)}
                  />
                </View>
              </View>
            )}
          </PetHeader>

          {(syncError || fetchError) ? (
            <View style={styles.errorBanner} pointerEvents="box-none">
              <View style={styles.errorBannerCard}>
                <Text style={styles.errorBannerText}>{syncError ?? fetchError}</Text>
                <TouchableOpacity
                  onPress={() => {
                    if (syncError) retryBackendSync();
                    else refetchHome();
                  }}
                  disabled={isSyncing}
                >
                  <Text style={styles.errorBannerAction}>
                    {isSyncing ? t('common.loading') : t('common.retry')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}
        </View>

        {pet && effectiveMode !== 'profile' ? (
          <FABMenu
            open={fabOpen}
            onOpenChange={setFabOpen}
            onVaccinePress={() => router.push('/vaccines/add' as never)}
            onHealthPress={() => router.push('/topics/add' as never)}
            onReminderPress={() => {
              void (async () => {
                if (!(await guardAddReminder(router, pets))) return;
                router.push('/reminders/add' as never);
              })();
            }}
          />
        ) : null}
      </View>

      <PetSwitcherSheet
        visible={switchVisible}
        pets={pets}
        activePetId={activePetId}
        onClose={() => setSwitchVisible(false)}
        onSelectPet={(petId) => {
          void handleSelectPet(petId);
        }}
        onAddPet={() => {
          void handleAddPet();
        }}
      />
    </SafeAreaView>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: c.panel,
    },
    screen: {
      flex: 1,
      overflow: 'visible',
      position: 'relative',
    },
    homeFrame: {
      flex: 1,
      position: 'relative',
      width: '100%',
      overflow: 'visible',
    },
    errorBanner: {
      position: 'absolute',
      top: Spacing.sm,
      left: PAGE_HORIZONTAL_PADDING,
      right: PAGE_HORIZONTAL_PADDING,
      zIndex: 100,
      elevation: 8,
    },
    errorBannerCard: {
      padding: Spacing.md,
      backgroundColor: c.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.12,
      shadowRadius: 6,
      elevation: 4,
    },
    errorBannerText: {
      fontFamily: 'Rubik-Regular',
      fontSize: 13,
      color: c.secondaryText,
      marginBottom: 4,
    },
    errorBannerAction: {
      fontFamily: 'Rubik-Medium',
      fontSize: 14,
      color: c.primaryText,
    },
    cardsGrid: {
      width: '100%',
      gap: Spacing.sm,
      overflow: 'visible',
    },
    row: {
      flexDirection: 'row',
      gap: 8,
    },
    healthWrap: {
      position: 'relative',
      overflow: 'visible',
      zIndex: 50,
    },
  });
