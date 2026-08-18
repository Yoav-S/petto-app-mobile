import React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Spacing, type ThemeColors } from '@/constants/theme';
import { useColors, useThemedStyles } from '@/context/ThemeContext';
import { useSettledModalVisible } from '@/components/ui/BottomSheetModal';
import HeaderIconButton, { HEADER_ICON_BTN } from '@/components/ui/HeaderIconButton';
import { t } from '@/i18n';

interface VaccinePhotoViewerProps {
  visible: boolean;
  uri?: string | null;
  onClose: () => void;
}

export default function VaccinePhotoViewer({ visible, uri, onClose }: VaccinePhotoViewerProps) {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const presented = useSettledModalVisible(visible);

  if (!presented || !uri) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityRole="button" />
        <View
          pointerEvents="box-none"
          style={[styles.closeWrap, { top: insets.top + Spacing.sm, right: Spacing.lg }]}
        >
          <HeaderIconButton onPress={onClose} accessibilityLabel={t('petOnboarding.photo_close_a11y')}>
            <Ionicons name="close" size={HEADER_ICON_BTN.iconSize} color={colors.primaryText} />
          </HeaderIconButton>
        </View>
        <View pointerEvents="box-none" style={styles.imageStage}>
          <Pressable onPress={() => {}}>
            <Image
              source={{ uri }}
              style={{ width: width * 0.92, height: height * 0.72 }}
              contentFit="contain"
            />
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: c.background,
    },
    closeWrap: {
      position: 'absolute',
      zIndex: 2,
    },
    imageStage: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
