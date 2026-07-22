import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { type ThemeColors } from '@/constants/theme';
import { useColors, useThemedStyles } from '@/context/ThemeContext';
import { t } from '@/i18n';
import { apiGet } from '@/services/api';
import { getErrorMessage } from '@/services/errors';
import { guardAddPet } from '@/services/subscription';
import { useActivePet } from '@/store/petStore';
import type { Pet } from '@/types/api';
import SettingsHeader from '@/components/settings/SettingsHeader';
import { AddPetRow, PetSwitcherRow } from '@/components/home/PetSwitcherRows';

export default function PetsListScreen() {
  const styles = useThemedStyles(makeStyles);
  const colors = useColors();
  const router = useRouter();
  const { activePetId, setActivePetId } = useActivePet();

  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await apiGet<Pet[]>('/pets');
      setPets(list);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const handleSelect = async (petId: string) => {
    if (petId !== activePetId) {
      await setActivePetId(petId);
    }
    router.back();
  };

  const handleAddPet = async () => {
    if (!(await guardAddPet(router, pets.length))) return;
    router.push('/(onboarding)/name' as never);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <SettingsHeader title={t('home.pets_title')} />

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.brand} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => void load()}>
            <Text style={styles.retry}>{t('common.retry')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.list}>
            {pets.map((pet) => (
              <PetSwitcherRow
                key={pet.id}
                pet={pet}
                selected={pet.id === activePetId}
                onPress={() => {
                  void handleSelect(pet.id);
                }}
              />
            ))}
          </View>

          <View style={styles.divider} />
          <AddPetRow
            onPress={() => {
              void handleAddPet();
            }}
          />
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
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      gap: 12,
    },
    errorText: {
      fontFamily: 'Rubik-Regular',
      fontSize: 14,
      lineHeight: 20,
      color: c.secondaryText,
      textAlign: 'center',
    },
    retry: {
      fontFamily: 'Rubik-Medium',
      fontSize: 14,
      color: c.brand,
    },
    content: {
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 40,
      gap: 16,
    },
    list: {
      gap: 16,
    },
    divider: {
      width: '100%',
      height: 1,
      backgroundColor: c.border,
    },
  });
