import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Pressable } from 'react-native';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { t } from '@/i18n';

interface ReminderActionSheetProps {
  visible: boolean;
  title?: string;
  subtitle?: string;
  time?: string;
  context?: string;
  currentIndex?: number;
  totalCount?: number;
  /** When false, the card is display-only (no navigation to edit). */
  showDetailsLink?: boolean;
  onClose: () => void;
  onDetailsPress?: () => void;
  onDone: () => void;
  onMissed: () => void;
}

export default function ReminderActionSheet({
  visible,
  title,
  subtitle,
  time,
  context,
  currentIndex,
  totalCount,
  showDetailsLink = false,
  onClose,
  onDetailsPress,
  onDone,
  onMissed,
}: ReminderActionSheetProps) {
  const CardWrapper = showDetailsLink && onDetailsPress ? TouchableOpacity : View;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.dragHandle} />

          <View style={styles.header}>
            <View style={styles.headerSpacer}>
              {currentIndex !== undefined && totalCount !== undefined ? (
                <Text style={styles.paginationText}>
                  {currentIndex}/{totalCount}
                </Text>
              ) : null}
            </View>
            <Text style={styles.title}>{t('reminders.action_sheet_title')}</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={20} color={Colors.primaryText} />
            </TouchableOpacity>
          </View>

          <CardWrapper
            style={styles.card}
            activeOpacity={0.8}
            onPress={showDetailsLink ? onDetailsPress : undefined}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{title}</Text>
              <Text style={styles.cardTime}>{time}</Text>
            </View>
            {subtitle ? <Text style={styles.cardSubtitle}>{subtitle}</Text> : null}
            {context ? <Text style={styles.cardContext}>{context}</Text> : null}
          </CardWrapper>

          <TouchableOpacity style={styles.doneButton} onPress={onDone} activeOpacity={0.8}>
            <Text style={styles.doneText}>{t('reminders.mark_done')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.missedButton} onPress={onMissed} activeOpacity={0.8}>
            <Text style={styles.missedText}>{t('reminders.mark_missed')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
    paddingHorizontal: Spacing.xl,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
  },
  headerSpacer: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paginationText: {
    fontFamily: 'Rubik-Regular',
    fontSize: 14,
    color: Colors.primaryText,
  },
  title: {
    fontFamily: 'Rubik-Medium',
    fontSize: 18,
    color: Colors.primaryText,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  cardTitle: {
    fontFamily: 'Rubik-Medium',
    fontSize: 18,
    color: Colors.primaryText,
    flex: 1,
    marginRight: Spacing.md,
  },
  cardTime: {
    fontFamily: 'Rubik-Regular',
    fontSize: 20,
    color: Colors.primaryText,
  },
  cardSubtitle: {
    fontFamily: 'Rubik-Regular',
    fontSize: 14,
    color: Colors.primaryText,
    marginBottom: 8,
  },
  cardContext: {
    fontFamily: 'Rubik-Regular',
    fontSize: 14,
    color: Colors.secondaryText,
  },
  doneButton: {
    backgroundColor: Colors.primaryText,
    borderRadius: Radius.md,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  doneText: {
    fontFamily: 'Rubik-Medium',
    fontSize: 16,
    color: '#FFFFFF',
  },
  missedButton: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  missedText: {
    fontFamily: 'Rubik-Medium',
    fontSize: 16,
    color: Colors.primaryText,
  },
});
