import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import BottomSheetModal from '@/components/ui/BottomSheetModal';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { type ThemeColors } from '@/constants/theme';
import { useColors, useThemedStyles } from '@/context/ThemeContext';
import { t } from '@/i18n';
import type { MedicalRecord } from '@/types/api';

interface HealthRecordPickerSheetProps {
  visible: boolean;
  records: MedicalRecord[];
  onClose: () => void;
  onSelect: (record: MedicalRecord) => void;
}

/** Bottom sheet to pick which health record a new note belongs to. */
export default function HealthRecordPickerSheet({
  visible,
  records,
  onClose,
  onSelect,
}: HealthRecordPickerSheetProps) {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();

  return (
    <BottomSheetModal visible={visible} onClose={onClose}>
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.header}>
            <View style={styles.headerSpacer} />
            <Text style={styles.title}>{t('health.pick_record_title')}</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={22} color={colors.primaryText} />
            </TouchableOpacity>
          </View>

          {records.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>{t('health.pick_record_empty_title')}</Text>
              <Text style={styles.emptySubtitle}>{t('health.pick_record_empty_subtitle')}</Text>
            </View>
          ) : (
            <FlatList
              data={records}
              keyExtractor={(item) => item.id}
              style={styles.list}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.row}
                  onPress={() => onSelect(item)}
                  activeOpacity={0.75}
                >
                  <View style={styles.rowText}>
                    <Text style={styles.rowTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    {item.latest_note_preview ? (
                      <Text style={styles.rowSubtitle} numberOfLines={1}>
                        {item.latest_note_preview}
                      </Text>
                    ) : null}
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.secondaryText} />
                </TouchableOpacity>
              )}
            />
          )}
        </View>
    </BottomSheetModal>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: c.overlay,
      justifyContent: 'flex-end',
    },
    sheet: {
      maxHeight: '70%',
      backgroundColor: c.panel,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingTop: 20,
      paddingHorizontal: 20,
      gap: 12,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 32,
      marginBottom: 8,
    },
    headerSpacer: { width: 32 },
    title: {
      flex: 1,
      textAlign: 'center',
      fontFamily: 'Rubik-Medium',
      fontSize: 18,
      color: c.primaryText,
    },
    closeButton: {
      width: 32,
      height: 32,
      borderRadius: 10,
      backgroundColor: c.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    list: {
      flexGrow: 0,
    },
    listContent: {
      paddingBottom: 8,
      gap: 8,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: c.surface,
      borderRadius: 12,
      paddingVertical: 14,
      paddingHorizontal: 16,
    },
    rowText: {
      flex: 1,
      gap: 4,
    },
    rowTitle: {
      fontFamily: 'Rubik-Medium',
      fontSize: 16,
      color: c.primaryText,
    },
    rowSubtitle: {
      fontFamily: 'Rubik-Regular',
      fontSize: 14,
      color: c.secondaryText,
    },
    empty: {
      paddingVertical: 28,
      paddingHorizontal: 8,
      gap: 8,
      alignItems: 'center',
    },
    emptyTitle: {
      fontFamily: 'Rubik-Medium',
      fontSize: 16,
      color: c.primaryText,
      textAlign: 'center',
    },
    emptySubtitle: {
      fontFamily: 'Rubik-Regular',
      fontSize: 14,
      color: c.secondaryText,
      textAlign: 'center',
    },
  });
