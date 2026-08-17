import React, { useMemo, useState } from 'react';
import {
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';
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
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';

export default function AddHealthScreen() {
  const styles = useThemedStyles(makeStyles);
  const toast = useToast();
  const router = useRouter();
  const { activePetId } = useActivePet();
  const insets = useSafeAreaInsets();
  const { contentWidth } = useResponsiveLayout();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [nameFocused, setNameFocused] = useState(false);
  const [descriptionFocused, setDescriptionFocused] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const layout = useMemo(
    () => ({
      formTop: 16,
      cardWidth: contentWidth,
      cardRadius: 12,
      cardPadH: 16,
      cardPadV: 14,
      nameHeight: 48,
      descriptionHeight: 78,
      gap: 22,
    }),
    [contentWidth],
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
      toast.showError(getErrorMessage(err));
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
      <VaccineScreenHeader title={t('topics.add_health')} icon="close" />

      <HealthKeyboardAvoidingView>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.content,
            {
              paddingTop: layout.formTop,
              paddingBottom: healthKeyboardScrollPadding(1, insets.bottom),
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <HealthRecordFormFields
            name={name}
            onNameChange={setName}
            namePlaceholder={t('topics.health_name_placeholder')}
            nameFocused={nameFocused}
            onNameFocus={() => setNameFocused(true)}
            onNameBlur={() => setNameFocused(false)}
            description={description}
            onDescriptionChange={setDescription}
            descriptionLabel={t('topics.field_description')}
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
