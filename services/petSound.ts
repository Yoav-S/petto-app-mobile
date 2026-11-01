const SOURCES = {
  dog: require('@/assets/sounds/dog.wav'),
  cat: require('@/assets/sounds/cat.wav'),
} as const;

type PetSoundType = keyof typeof SOURCES;

type ExpoAv = typeof import('expo-av');

let modeReady = false;

function soundType(type?: string | null): PetSoundType | null {
  if (type === 'cat' || type === 'dog') return type;
  return null;
}

function loadAv(): ExpoAv | null {
  try {
    return require('expo-av') as ExpoAv;
  } catch {
    return null;
  }
}

/** Short bark or meow. Safe if expo-av is not in this native build yet. */
export function playPetSound(type?: string | null) {
  const kind = soundType(type);
  if (!kind) return;
  const av = loadAv();
  if (!av) return;
  void (async () => {
    try {
      if (!modeReady) {
        await av.Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          interruptionModeIOS: av.InterruptionModeIOS.MixWithOthers,
          interruptionModeAndroid: av.InterruptionModeAndroid.DuckOthers,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
        modeReady = true;
      }
      const { sound } = await av.Audio.Sound.createAsync(SOURCES[kind], {
        shouldPlay: true,
        volume: 0.85,
      });
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          void sound.unloadAsync();
        }
      });
    } catch {
      // Missing native module or playback error — never block the tap.
    }
  })();
}
