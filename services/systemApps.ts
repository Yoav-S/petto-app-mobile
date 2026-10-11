import { ActionSheetIOS, Alert, Linking, Platform } from 'react-native';
import { waitForBottomSheetsToSettle } from '@/components/ui/BottomSheetModal';
import { t } from '@/i18n';

type MapTarget = {
  address?: string | null;
  city?: string | null;
  location?: { coordinates: [number, number] } | null;
};

function addressQuery(target: MapTarget): string {
  const line = target.address?.trim() ?? '';
  const town = target.city?.trim() ?? '';
  if (town && line && !line.toLowerCase().includes(town.toLowerCase())) {
    return `${line}, ${town}`;
  }
  return line || town;
}

function dialable(phone: string): string {
  return phone.replace(/[^\d+]/g, '');
}

function pointOf(target: MapTarget): { lat: number; lng: number } | null {
  const point = target.location?.coordinates;
  if (!point) return null;
  const [lng, lat] = point;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

/** Opens the system phone UI. One number goes straight to the dialer. */
export async function openSystemPhones(phones: string[]): Promise<void> {
  const list = phones.map((phone) => phone.trim()).filter(Boolean);
  if (!list.length) return;
  await waitForBottomSheetsToSettle();
  const open = (phone: string) => {
    const number = dialable(phone);
    if (number) void Linking.openURL(`tel:${number}`);
  };
  if (list.length === 1) {
    open(list[0]);
    return;
  }
  if (Platform.OS === 'ios') {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: [...list, t('common.cancel')],
        cancelButtonIndex: list.length,
        title: t('business.call'),
      },
      (index) => {
        if (index >= 0 && index < list.length) open(list[index]);
      },
    );
    return;
  }
  Alert.alert(t('business.call'), undefined, [
    ...list.map((phone) => ({ text: phone, onPress: () => open(phone) })),
    { text: t('common.cancel'), style: 'cancel' },
  ]);
}

/**
 * Opens the system app chooser. Android's geo intent shows the installed map
 * apps with their real icons. iOS uses the system action sheet.
 */
export async function openSystemDirections(target: MapTarget | null | undefined): Promise<void> {
  if (!target) return;
  const query = addressQuery(target);
  const point = pointOf(target);
  if (!query && !point) return;
  await waitForBottomSheetsToSettle();

  if (Platform.OS === 'android') {
    const geo = point
      ? `geo:${point.lat},${point.lng}?q=${point.lat},${point.lng}`
      : `geo:0,0?q=${encodeURIComponent(query)}`;
    try {
      await Linking.openURL(geo);
      return;
    } catch {
      const web = point
        ? `https://www.google.com/maps/dir/?api=1&destination=${point.lat},${point.lng}`
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
      await Linking.openURL(web);
      return;
    }
  }

  const apple = point
    ? `http://maps.apple.com/?daddr=${point.lat},${point.lng}`
    : `http://maps.apple.com/?q=${encodeURIComponent(query)}`;
  const google = point
    ? `https://www.google.com/maps/dir/?api=1&destination=${point.lat},${point.lng}`
    : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`;
  const waze = point
    ? `https://waze.com/ul?ll=${point.lat},${point.lng}&navigate=yes`
    : `https://waze.com/ul?q=${encodeURIComponent(query)}&navigate=yes`;
  const options = [
    { label: t('business.apple_maps'), url: apple },
    { label: t('business.google_maps'), url: google },
    { label: t('business.waze'), url: waze },
  ];
  ActionSheetIOS.showActionSheetWithOptions(
    {
      options: [...options.map((option) => option.label), t('common.cancel')],
      cancelButtonIndex: options.length,
      title: t('business.directions'),
    },
    (index) => {
      const choice = options[index];
      if (choice) void Linking.openURL(choice.url);
    },
  );
}
