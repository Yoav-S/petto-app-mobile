import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Modal, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useActivePet } from '@/store/petStore';
import { Colors, Spacing } from '@/constants/theme';
import { apiGet } from '@/services/api';
import { getErrorMessage } from '@/services/errors';
import { t } from '@/i18n';
import { useAuth } from '@/context/AuthContext';
import type { Pet, Vaccination, Reminder, MedicalRecord } from '@/types/api';
import { enrichRecordsWithLatestNoteReminders } from '@/services/health';
import { isIsoDateToday, normalizeToDatePart, todayIsoDate, truncateHealthDescription } from '@/utils/calendar';

import PetHeader, { PANEL_BACKGROUND } from '@/components/home/PetHeader';
import VaccinesCard from '@/components/home/VaccinesCard';
import RemindersCard from '@/components/home/RemindersCard';
import HealthCard from '@/components/home/HealthCard';
import HealthReminderLine from '@/components/health/HealthReminderLine';
import FABMenu from '@/components/home/FABMenu';

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
  // Skip reminders whose date has already passed (health-linked only).
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
  const router = useRouter();
  const { user, isLoading: authLoading, syncError, retryBackendSync, isSyncing, signOut } = useAuth();
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
    reminder_date?: string;
    reminder_time?: string;
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [fabOpen, setFabOpen] = useState(false);
  const [switchVisible, setSwitchVisible] = useState(false);

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

      const enrichedRecords = await enrichRecordsWithLatestNoteReminders(currentPetId, records);

      setLatestVaccine(vaccinations[0] ?? null);

      const { next, count } = pickNextReminder(todayReminders, upcomingReminders, enrichedRecords);
      if (next) {
        setNextReminder({
          title: next.title,
          scheduled_at: next.scheduled_at,
          status: next.status,
        });
      } else {
        setNextReminder(null);
      }

      setUpcomingCount(count);

      const record = pickLatestHealthRecord(enrichedRecords);
      if (record) {
        setLatestRecord({
          type: record.title,
          description: truncateHealthDescription(record.description) || undefined,
          date: record.created_at,
          reminder_date: record.linked_reminder_date ?? undefined,
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

  // Refresh cards when returning from a create/edit flow.
  useFocusEffect(
    useCallback(() => {
      if (authLoading) return;
      fetchData();
    }, [fetchData, authLoading]),
  );

  const handleSelectPet = async (petId: string) => {
    setSwitchVisible(false);
    if (petId !== activePetId) {
      await setActivePetId(petId);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
      <View style={styles.screen}>
        <View style={styles.homeFrame}>
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
            onSwitchPress={() => setSwitchVisible(true)}
            onLogout={() => {
              void signOut();
            }}
          >
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
                  onPress={() => router.push('/health' as never)}
                />
                <FABMenu
                  open={fabOpen}
                  onOpenChange={setFabOpen}
                  onVaccinePress={() => router.push('/vaccines' as never)}
                  onHealthPress={() => router.push('/health/add' as never)}
                  onReminderPress={() => router.push('/reminders' as never)}
                />
              </View>
            </View>
          </PetHeader>
        </View>
      </View>

      <Modal
        visible={switchVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSwitchVisible(false)}
      >
        <Pressable style={styles.switchOverlay} onPress={() => setSwitchVisible(false)}>
          <Pressable style={styles.switchSheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.switchTitle}>{t('home.switch')}</Text>
            {pets.map((p) => {
              const isActive = p.id === activePetId;
              return (
                <TouchableOpacity
                  key={p.id}
                  style={styles.switchRow}
                  onPress={() => handleSelectPet(p.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.switchName}>{p.name}</Text>
                  {isActive ? (
                    <Ionicons name="checkmark" size={20} color={Colors.primaryText} />
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: PANEL_BACKGROUND,
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
    gap: Spacing.md,
    overflow: 'visible',
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  healthWrap: {
    position: 'relative',
    overflow: 'visible',
    zIndex: 50,
  },
  switchOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  switchSheet: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.lg,
  },
  switchTitle: {
    fontFamily: 'Rubik-Medium',
    fontSize: 18,
    color: Colors.primaryText,
    marginBottom: Spacing.sm,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  switchName: {
    fontFamily: 'Rubik-Regular',
    fontSize: 16,
    color: Colors.primaryText,
  },
});
