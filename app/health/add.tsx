import React, { useMemo, useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/context/ThemeContext';
import VaccineScreenHeader from '@/components/vaccines/VaccineScreenHeader';
import HealthRecordFormFields from '@/components/health/HealthRecordFormFields';
import HealthKeyboardFooter, {
  HealthKeyboardAvoidingView,
  healthKeyboardScrollPadding,
} from '@/components/health/HealthKeyboardFooter';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { t } from '@/i18n';
import { useActivePet } from '@/store/petStore';
import { createRecord } from '@/services/health';
import { getErrorMessage } from '@/services/errors';

const DESIGN_WIDTH = 375;
const DESIGN_HEIGHT = 812;

export default function AddHealthScreen() {
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const { activePetId } = useActivePet();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const sx = width / DESIGN_WIDTH;
  const sy = height / DESIGN_HEIGHT;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [nameFocused, setNameFocused] = useState(false);
  const [descriptionFocused, setDescriptionFocused] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const layout = useMemo(
    () => ({
      formTop: 16 * sy,
      cardWidth: 335 * sx,
      cardRadius: 12 * sx,
      cardPadH: 16 * sx,
      cardPadV: 14 * sy,
      nameHeight: 48 * sy,
      descriptionHeight: 78 * sy,
      gap: 22 * sy,
    }),
    [sx, sy],
  );

  const canSave = name.trim().length > 0 && !submitting;

  const handleSave = async () => {
    if (!canSave || !activePetId) return;
    try {
      setSubmitting(true);
      await createRecord(activePetId, {
        title: name.trim(),
        description: description.trim() || null,
      });
      router.back();
    } catch (err) {
      Alert.alert(t('common.error'), getErrorMessage(err));
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <VaccineScreenHeader
        title={t('health.add_health')}
        icon="close"
        extraTopOffset={44 * sy}
      />

      <HealthKeyboardAvoidingView>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.content,
            {
              paddingTop: layout.formTop,
              paddingBottom: healthKeyboardScrollPadding(sy, insets.bottom),
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <HealthRecordFormFields
            name={name}
            onNameChange={setName}
            namePlaceholder={t('health.health_name_placeholder')}
            nameFocused={nameFocused}
            onNameFocus={() => setNameFocused(true)}
            onNameBlur={() => setNameFocused(false)}
            description={description}
            onDescriptionChange={setDescription}
            descriptionLabel={t('health.field_description')}
            descriptionFocused={descriptionFocused}
            onDescriptionFocus={() => setDescriptionFocused(true)}
            onDescriptionBlur={() => setDescriptionFocused(false)}
            layout={layout}
          />
        </ScrollView>

        <HealthKeyboardFooter
          label={t('common.save')}
          disabled={!canSave}
          loading={submitting}
          onPress={handleSave}
          fullWidth
        />
      </HealthKeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: c.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
  },
});
