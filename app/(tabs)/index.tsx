import React, { useState, useEffect } from 'react';
import { View, ScrollView, SafeAreaView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useActivePet } from '@/store/petStore';
import { Colors } from '@/constants/theme';
import { apiGet } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { TouchableOpacity, Text } from 'react-native';

import PetHeader from '@/components/home/PetHeader';
import VaccinesCard from '@/components/home/VaccinesCard';
import RemindersCard from '@/components/home/RemindersCard';
import HealthCard from '@/components/home/HealthCard';
import FABMenu from '@/components/home/FABMenu';

export default function HomeScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { activePetId, setActivePetId } = useActivePet();
  
  const [pet, setPet] = useState<any>(null);
  const [pets, setPets] = useState<any[]>([]);
  const [latestVaccine, setLatestVaccine] = useState<any>(null);
  const [nextReminder, setNextReminder] = useState<any>(null);
  const [upcomingCount, setUpcomingCount] = useState(0);
  const [latestRecord, setLatestRecord] = useState<any>(null);
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        // Note: Real API fetch logic would go here.
        // For Phase 01 implementation structure, we will use mock structure based on the spec
        // since the backend might not be fully seeded.
        
        // Example mock data setup for now to fulfill the UI structure:
        const mockPets = [
          {
            id: '1',
            name: 'Archie',
            breed: 'Labrador',
            birth_date: '2023-01-01T00:00:00.000Z',
            photo_url: 'https://images.unsplash.com/photo-1544568100-847a948585b9?w=500&auto=format&fit=crop&q=60'
          }
        ];
        
        setPets(mockPets);
        
        const currentPetId = activePetId || mockPets[0]?.id;
        if (currentPetId && currentPetId !== activePetId) {
          await setActivePetId(currentPetId);
        }
        
        setPet(mockPets.find(p => p.id === currentPetId) || mockPets[0]);
        
        // Mock data logic simulating endpoint responses
        setLatestVaccine({
          name: 'Rabies',
          date: '2026-04-10T00:00:00.000Z',
          next_date: '2027-04-10T00:00:00.000Z'
        });
        
        setNextReminder({
          title: 'Vet visit today',
          scheduled_at: new Date().toISOString(),
          status: 'today'
        });
        setUpcomingCount(2);
        
        setLatestRecord({
          type: 'Allergy',
          description: 'Less itching today after medication.',
          date: new Date().toISOString(),
          reminder_time: '20:00'
        });
        
      } catch (error) {
        console.error('Error fetching home data:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [activePetId]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ alignItems: 'flex-end', paddingRight: 16, paddingTop: 8 }}>
          <TouchableOpacity onPress={signOut} style={{ padding: 8, backgroundColor: Colors.surface, borderRadius: 8 }}>
            <Text style={{ fontFamily: 'Rubik-Medium', color: Colors.error }}>Log out (Test)</Text>
          </TouchableOpacity>
        </View>

        <PetHeader 
          pet={pet} 
          petCount={pets.length} 
          loading={loading} 
          onSwitchPress={() => console.log('Open switch pet sheet')} 
        />
        
        <View style={styles.cardsGrid}>
          <View style={styles.row}>
            <VaccinesCard 
              latestVaccine={latestVaccine} 
              loading={loading} 
              onPress={() => console.log('Nav to vaccines')} 
            />
            <RemindersCard 
              nextReminder={nextReminder} 
              upcomingCount={upcomingCount} 
              loading={loading} 
              onPress={() => router.push('/reminders' as never)} 
            />
          </View>
          
          <HealthCard 
            latestRecord={latestRecord} 
            loading={loading} 
            onPress={() => router.push('/health' as never)} 
          />
        </View>
      </ScrollView>
      
      <FABMenu 
        onVaccinePress={() => console.log('Nav to add vaccine')}
        onHealthPress={() => console.log('Nav to add health')}
        onReminderPress={() => console.log('Nav to add reminder')}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  cardsGrid: {
    padding: 16,
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
});
