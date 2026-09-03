import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { type ThemeColors } from '@/constants/theme';
import { useColors, useThemedStyles } from '@/context/ThemeContext';
import { t } from '@/i18n';
import { getErrorMessage } from '@/services/errors';
import { guardAddPet, guardSelectPet } from '@/services/subscription';
import { useActivePet } from '@/store/petStore';
import { usePetsQuery } from '@/hooks/useCachedQueries';
import SettingsHeader from '@/components/settings/SettingsHeader';
import HeaderScrollLayout from '@/components/ui/HeaderScrollLayout';
import { PAGE_HORIZONTAL_PADDING } from '@/constants/layout';
import { AddPetRow, PetSwitcherRow } from '@/components/home/PetSwitcherRows';

export default function PetsListScreen() {
  const styles = useThemedStyles(makeStyles);
  const colors = useColors();
  const router = useRouter();
  const { activePetId, setActivePetId } = useActivePet();

  const query = usePetsQuery();
  const pets = query.data ?? [];
  const loading = query.isLoading && !query.data;
  const error = query.error ? getErrorMessage(query.error) : null;

  useFocusEffect(
    useCallback(() => {
      void query.refetch();
    }, [query.refetch]),
  );

  const handleSelect = async (petId: string) => {
    const nextPet = pets.find((p) => p.id === petId);
    if (!(await guardSelectPet(router, nextPet))) return;
    if (petId !== activePetId) {
      await setActivePetId(petId);
    }
    router.back();
  };

  const handleAddPet = async () => {
    if (!(await guardAddPet(router, pets.length))) return;
    router.push('/pets/add' as never);
  };

  return (
    <HeaderScrollLayout header={<SettingsHeader title={t('home.pets_title')} />} topFade bottomFade fadeMode="scroll">
      {({ paddingTop, paddingBottom }) =>
        loading ? (
          <View style={[styles.centered, { paddingTop }]}>
            <ActivityIndicator color={colors.brand} />
          </View>
        ) : error && !pets.length ? (
          <View style={[styles.centered, { paddingTop }]}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={() => void query.refetch()}>
              <Text style={styles.retry}>{t('common.retry')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={[
              styles.content,
              { paddingTop, paddingBottom: paddingBottom + 40 },
            ]}
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
        )
      }
    </HeaderScrollLayout>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
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
    scroll: {
      flex: 1,
    },
    content: {
      paddingHorizontal: PAGE_HORIZONTAL_PADDING,
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
