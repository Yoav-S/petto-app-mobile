import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  ScrollView, 
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Keyboard
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing } from '@/constants/theme';
import ScreenHeader from '@/components/ui/ScreenHeader';
import Snackbar from '@/components/ui/Snackbar';

// Action Sheets
import EditPhotoSheet from '@/components/health/EditPhotoSheet';
import PhotoPickerSheet from '@/components/health/PhotoPickerSheet';
import ReminderPickerSheet from '@/components/health/ReminderPickerSheet';

export default function EditNoteScreen() {
  const router = useRouter();
  
  const [noteText, setNoteText] = useState('');
  const [hasPhoto, setHasPhoto] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [hasReminder, setHasReminder] = useState(false);
  const [reminderLabel, setReminderLabel] = useState('');
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  
  // Sheet states
  const [editPhotoSheetVisible, setEditPhotoSheetVisible] = useState(false);
  const [photoPickerSheetVisible, setPhotoPickerSheetVisible] = useState(false);
  const [reminderSheetVisible, setReminderSheetVisible] = useState(false);

  // Snackbar states
  const [snackbarConfig, setSnackbarConfig] = useState<{ visible: boolean; message: string; type: 'photo' | 'reminder' | null }>({
    visible: false,
    message: '',
    type: null,
  });

  React.useEffect(() => {
    const showSub = Keyboard.addListener('keyboardWillShow', () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener('keyboardWillHide', () => setKeyboardVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handleDeletePhoto = () => {
    setHasPhoto(false);
    setPhotoUrl(null);
    setSnackbarConfig({ visible: true, message: 'Photo removed', type: 'photo' });
  };

  const handleDeleteReminder = () => {
    setHasReminder(false);
    setSnackbarConfig({ visible: true, message: 'Reminder removed', type: 'reminder' });
  };

  const handleUndo = () => {
    if (snackbarConfig.type === 'photo') {
      setHasPhoto(true);
    } else if (snackbarConfig.type === 'reminder') {
      setHasReminder(true);
    }
    setSnackbarConfig({ ...snackbarConfig, visible: false });
  };

  const handleDeleteNote = () => {
    router.replace({ pathname: '/health', params: { deletedNote: 'true' } } as any);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader title="Edit note" />
      
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          
          {/* Editable Card */}
          <View style={styles.card}>
            {hasPhoto && photoUrl && (
              <TouchableOpacity activeOpacity={0.9} onPress={handleDeletePhoto}>
                <Image 
                  source={{ uri: photoUrl }} 
                  style={styles.image} 
                  contentFit="cover" 
                />
              </TouchableOpacity>
            )}
            
            <TextInput
              style={[styles.textInput, hasPhoto && photoUrl ? styles.textInputWithImage : null]}
              value={noteText}
              onChangeText={setNoteText}
              multiline
              scrollEnabled={false}
              placeholder="What's changed?"
              placeholderTextColor={Colors.secondaryText}
            />
            
            {hasReminder && reminderLabel ? (
              <TouchableOpacity style={styles.reminderRow} activeOpacity={0.8} onPress={handleDeleteReminder}>
                <Text style={styles.reminderLabel}>Reminder:</Text>
                <Text style={styles.reminderValue}> {reminderLabel}</Text>
              </TouchableOpacity>
            ) : null}
            
            <View style={styles.iconRow}>
              <TouchableOpacity 
                style={styles.iconButton} 
                onPress={() => setEditPhotoSheetVisible(true)}
              >
                <Ionicons name="image-outline" size={24} color={Colors.secondaryText} />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.iconButton} 
                onPress={() => setReminderSheetVisible(true)}
              >
                <Ionicons name="notifications-outline" size={24} color={Colors.secondaryText} />
              </TouchableOpacity>
            </View>
          </View>

        </ScrollView>

        {/* Dynamic Footer: "Delete Note" OR "Done" */}
        <View style={styles.footer}>
          {isKeyboardVisible ? (
            <View style={styles.doneButtonContainer}>
              <TouchableOpacity 
                style={styles.doneButton} 
                onPress={() => Keyboard.dismiss()}
                activeOpacity={0.8}
              >
                <Text style={styles.doneButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteNote} activeOpacity={0.7}>
              <Text style={styles.deleteText}>Delete note</Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>

      <Snackbar 
        visible={snackbarConfig.visible}
        message={snackbarConfig.message}
        actionText="Undo"
        onAction={handleUndo}
        onHide={() => setSnackbarConfig({ ...snackbarConfig, visible: false })}
      />

      {/* Bottom Sheets */}
      <EditPhotoSheet 
        visible={editPhotoSheetVisible} 
        onClose={() => setEditPhotoSheetVisible(false)} 
        onTake={() => setEditPhotoSheetVisible(false)}
        onChoose={() => {
          setEditPhotoSheetVisible(false);
          // Wait slightly for modal transition
          setTimeout(() => setPhotoPickerSheetVisible(true), 300);
        }}
      />

      <PhotoPickerSheet 
        visible={photoPickerSheetVisible}
        onClose={() => setPhotoPickerSheetVisible(false)}
        onAdd={() => {
          setPhotoPickerSheetVisible(false);
          setHasPhoto(true);
          // Photo URL will be set when real upload is wired up
        }}
      />

      <ReminderPickerSheet 
        visible={reminderSheetVisible}
        onClose={() => setReminderSheetVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  image: {
    width: '100%',
    height: 180,
    borderRadius: Radius.md,
    marginBottom: Spacing.md,
  },
  textInput: {
    fontFamily: 'Rubik-Regular',
    fontSize: 16,
    color: Colors.primaryText,
    lineHeight: 22,
    padding: 0, // Reset default padding
    marginBottom: Spacing.md,
  },
  textInputWithImage: {
    marginTop: 4,
  },
  reminderRow: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  reminderLabel: {
    fontFamily: 'Rubik-Medium',
    fontSize: 14,
    color: Colors.primaryText,
  },
  reminderValue: {
    fontFamily: 'Rubik-Regular',
    fontSize: 14,
    color: Colors.primaryText,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  iconButton: {
    marginRight: Spacing.md,
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  deleteButton: {
    padding: Spacing.md,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  deleteText: {
    fontFamily: 'Rubik-Medium',
    fontSize: 16,
    color: Colors.error,
  },
  doneButtonContainer: {
    alignItems: 'flex-end', // Aligns to the right
  },
  doneButton: {
    backgroundColor: Colors.primaryText,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: Radius.md,
  },
  doneButtonText: {
    fontFamily: 'Rubik-Medium',
    fontSize: 16,
    color: '#FFFFFF',
  },
});
