import React, { useState, useEffect, useCallback } from 'react';
import { View, ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useActivePet } from '@/store/petStore';
import { Colors, Spacing } from '@/constants/theme';
import { apiGet } from '@/services/api';
import { getErrorMessage } from '@/services/errors';
import { t } from '@/i18n';
import { useAuth } from '@/context/AuthContext';
import type { Pet, Vaccination, Reminder, MedicalRecord } from '@/types/api';

import PetHeader from '@/components/home/PetHeader';
import VaccinesCard from '@/components/home/VaccinesCard';
import RemindersCard from '@/components/home/RemindersCard';
import HealthCard from '@/components/home/HealthCard';
import FABMenu, { FAB_SIZE } from '@/components/home/FABMenu';

function reminderToScheduledAt(reminder: Reminder): string {
  return `${reminder.date}T${reminder.time}:00`;
}

export default function HomeScreen() {
  const router = useRouter();
  const { user, isLoading: authLoading, syncError, retryBackendSync, isSyncing } = useAuth();
  const { activePetId, setActivePetId } = useActivePet();

  const [pet, setPet] = useState<Pet | null>(null);
  const [pets, setPets] = useState<Pet[]>([]);
  const [latestVaccine, setLatestVaccine] = useState<Vaccination | null>(null);
  const [nextReminder, setNextReminder] = useState<{
    title: string;
    scheduled_at: string;
    status: 'today' | 'scheduled' | 'missed' | 'completed';
  } | null>(null);
  const [upcomingCount, setUpcomingCount] = useState(0);
  const [latestRecord, setLatestRecord] = useState<{
    type: string;
    description?: string;
    date: string;
    reminder_time?: string;
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) {
      setFetchError(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setFetchError(null);

      const petList = await apiGet<Pet[]>('/pets');
      setPets(petList);

      if (petList.length === 0) {
        setPet(null);
        setLatestVaccine(null);
        setNextReminder(null);
        setUpcomingCount(0);
        setLatestRecord(null);
        return;
      }

      const currentPetId =
        activePetId && petList.some((p) => p.id === activePetId) ? activePetId : petList[0].id;

      if (currentPetId !== activePetId) {
        await setActivePetId(currentPetId);
      }

      const currentPet = petList.find((p) => p.id === currentPetId) ?? petList[0];
      setPet(currentPet);

      const [vaccinations, todayReminders, upcomingReminders, records] = await Promise.all([
        apiGet<Vaccination[]>(`/pets/${currentPetId}/vaccinations`),
        apiGet<Reminder[]>(`/pets/${currentPetId}/reminders?tab=today`),
        apiGet<Reminder[]>(`/pets/${currentPetId}/reminders?tab=upcoming`),
        apiGet<MedicalRecord[]>(`/pets/${currentPetId}/medical-records?status=active`),
      ]);

      setLatestVaccine(vaccinations[0] ?? null);

      const next = todayReminders[0] ?? upcomingReminders[0] ?? null;
      if (next) {
        setNextReminder({
          title: next.title,
          scheduled_at: reminderToScheduledAt(next),
          status: next.status === 'today' ? 'today' : 'scheduled',
        });
      } else {
        setNextReminder(null);
      }

      setUpcomingCount(todayReminders.length + upcomingReminders.length);

      const record = records[0];
      if (record) {
        setLatestRecord({
          type: record.title,
          description: record.latest_note_preview ?? undefined,
          date: record.created_at,
          reminder_time: record.linked_reminder_time ?? undefined,
        });
      } else {
        setLatestRecord(null);
      }
    } catch (error) {
      console.error('Error fetching home data:', error);
      setFetchError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [activePetId, setActivePetId, user]);

  useEffect(() => {
    if (authLoading) return;
    fetchData();
  }, [fetchData, authLoading]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
      <View style={styles.screen}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {(syncError || fetchError) && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{syncError ?? fetchError}</Text>
              <TouchableOpacity
                onPress={() => {
                  if (syncError) retryBackendSync();
                  else fetchData();
                }}
                disabled={isSyncing}
              >
                <Text style={styles.errorBannerAction}>
                  {isSyncing ? t('common.loading') : t('common.retry')}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <PetHeader
            pet={pet}
            petCount={pets.length}
            loading={loading}
            onSwitchPress={() => {}}
            onSettingsPress={() => {}}
          />

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

            <View style={styles.healthFabAnchor}>
              <HealthCard
                latestRecord={latestRecord}
                loading={loading}
                onPress={() => router.push('/health' as never)}
              />
              <FABMenu
                anchored
                onVaccinePress={() => router.push('/vaccines' as never)}
                onHealthPress={() => router.push('/health/add-note' as never)}
                onReminderPress={() => router.push('/reminders' as never)}
              />
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  screen: {
    flex: 1,
    overflow: 'visible',
  },
  scrollContent: {
    paddingBottom: Spacing.xl,
  },
  errorBanner: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  errorBannerText: {
    fontFamily: 'Rubik-Regular',
    fontSize: 13,
    color: Colors.secondaryText,
    marginBottom: 4,
  },
  errorBannerAction: {
    fontFamily: 'Rubik-Medium',
    fontSize: 14,
    color: Colors.primaryText,
  },
  cardsGrid: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    gap: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  healthFabAnchor: {
    position: 'relative',
    overflow: 'visible',
    marginBottom: FAB_SIZE / 2,
  },
});
