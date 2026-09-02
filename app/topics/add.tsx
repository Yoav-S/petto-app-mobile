import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  View,
  Keyboard,
} from 'react-native';
import HeaderScrollLayout from '@/components/ui/HeaderScrollLayout';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { type ThemeColors } from '@/constants/theme';
import { useColors, useThemedStyles } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';
import VaccineScreenHeader from '@/components/vaccines/VaccineScreenHeader';
import HealthRecordFormFields from '@/components/health/HealthRecordFormFields';
import { HealthFormScreen } from '@/components/health/HealthKeyboardFooter';
import EmptyState from '@/components/ui/EmptyState';
import { t } from '@/i18n';
import { useActivePet } from '@/store/petStore';
import { createRecord, getRecord, updateRecord } from '@/services/health';
import { getErrorMessage } from '@/services/errors';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { normalizeRouteParam } from '@/utils/routeParams';

export default function AddHealthScreen() {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const toast = useToast();
  const router = useRouter();
  const { id: idParam } = useLocalSearchParams<{ id?: string }>();
  const recordId = normalizeRouteParam(idParam);
  const isEditing = Boolean(recordId);
  const { activePetId } = useActivePet();
  const { contentWidth } = useResponsiveLayout();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [nameFocused, setNameFocused] = useState(false);
  const [descriptionFocused, setDescriptionFocused] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(isEditing);
  const [notFound, setNotFound] = useState(false);

  const layout = useMemo(
    () => ({
      formTop: 16,
      cardWidth: contentWidth,
      cardRadius: 12,
      cardPadH: 16,
      cardPadV: 14,
      nameHeight: 52,
      descriptionHeight: 78,
      gap: 22,
    }),
    [contentWidth],
  );

  useEffect(() => {
    if (!isEditing) return;
    let cancelled = false;
    (async () => {
      if (!activePetId || !recordId) {
        if (!cancelled) {
          setNotFound(true);
          setLoading(false);
        }
        return;
      }
      try {
        const record = await getRecord(activePetId, recordId);
        if (cancelled) return;
        setName(record.title ?? '');
        setDescription(record.description ?? '');
        setNotFound(false);
      } catch {
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activePetId, isEditing, recordId]);

  const canSave = name.trim().length > 0 && !submitting && !loading;

  const handleSave = async () => {
    Keyboard.dismiss();
    if (!canSave || !activePetId) return;
    try {
      setSubmitting(true);
      const payload = {
        title: name.trim(),
        description: description.trim() || null,
      };
      if (isEditing && recordId) {
        await updateRecord(activePetId, recordId, payload);
      } else {
        await createRecord(activePetId, payload);
      }
      router.back();
    } catch (err) {
      toast.showError(getErrorMessage(err));
      setSubmitting(false);
    }
  };

  const screenTitle = isEditing ? t('topics.edit_topic') : t('topics.add_health');

  const header = <VaccineScreenHeader title={screenTitle} icon="close" />;

  if (isEditing && loading) {
    return (
      <HeaderScrollLayout header={header} edges={['left', 'right']}>
        {({ paddingTop }) => (
          <View style={[styles.centered, { paddingTop }]}>
            <ActivityIndicator color={colors.primaryText} />
          </View>
        )}
      </HeaderScrollLayout>
    );
  }

  if (isEditing && notFound) {
    return (
      <HeaderScrollLayout header={header} edges={['left', 'right']}>
        {({ paddingTop }) => (
          <View style={[styles.centered, { paddingTop }]}>
            <EmptyState
              title={t('topics.not_found_title')}
              subtitle={t('topics.not_found_subtitle')}
              actionTitle={t('reminders.back')}
              onAction={() => router.back()}
            />
          </View>
        )}
      </HeaderScrollLayout>
    );
  }

  return (
    <HeaderScrollLayout header={header} edges={['left', 'right']} topFade bottomFade>
      {({ paddingTop }) => (
        <HealthFormScreen
          scrollInsetTop={paddingTop}
          contentContainerStyle={{ paddingTop: layout.formTop }}
          footer={{
            label: t('common.save'),
            disabled: !canSave,
            loading: submitting,
            onPress: handleSave,
            fullWidth: true,
          }}
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
            descriptionPlaceholder={t('topics.description_placeholder')}
            descriptionFocused={descriptionFocused}
            onDescriptionFocus={() => setDescriptionFocused(true)}
            onDescriptionBlur={() => setDescriptionFocused(false)}
            layout={layout}
            autoFocusName={!isEditing}
          />
        </HealthFormScreen>
      )}
    </HeaderScrollLayout>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
