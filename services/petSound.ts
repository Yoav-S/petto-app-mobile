import AsyncStorage from '@react-native-async-storage/async-storage';

const SOURCES = {
  dog: require('@/assets/sounds/dog.wav'),
  cat: require('@/assets/sounds/cat.wav'),
} as const;

const PREF_KEY = 'ragly.petSounds.enabled';

type PetSoundType = keyof typeof SOURCES;
type ExpoAudio = typeof import('expo-audio');
type Player = ReturnType<ExpoAudio['createAudioPlayer']>;

let modeReady = false;
let warming = false;
let enabled = false;
let prefReady = false;
const cache: Partial<Record<PetSoundType, Player>> = {};

export function petSoundsEnabled(): boolean {
  return enabled;
}

export async function hydratePetSoundsPref(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(PREF_KEY);
    if (raw === '0') enabled = false;
    if (raw === '1') enabled = true;
  } catch {
    // Keep the last in-memory value.
  }
  prefReady = true;
  return enabled;
}

export async function setPetSoundsEnabled(next: boolean): Promise<void> {
  enabled = next;
  if (!next) {
    for (const player of Object.values(cache)) {
      if (!player) continue;
      try {
        player.loop = false;
        player.pause();
        player.seekTo(0);
      } catch {
        // Ignore a missing native player.
      }
    }
  }
  try {
    await AsyncStorage.setItem(PREF_KEY, next ? '1' : '0');
  } catch {
    // Preference still applies for this session.
  }
}

function soundType(type?: string | null): PetSoundType | null {
  if (type === 'cat' || type === 'dog') return type;
  return null;
}

function loadAudio(): ExpoAudio | null {
  try {
    return require('expo-audio') as ExpoAudio;
  } catch {
    return null;
  }
}

async function ensureMode(audio: ExpoAudio) {
  if (modeReady) return;
  await audio.setAudioModeAsync({
    playsInSilentMode: true,
    shouldPlayInBackground: false,
    allowsRecording: false,
    interruptionMode: 'mixWithOthers',
  });
  modeReady = true;
}

function loadPlayer(audio: ExpoAudio, kind: PetSoundType): Player {
  const existing = cache[kind];
  if (existing) return existing;
  const player = audio.createAudioPlayer(SOURCES[kind]);
  player.loop = false;
  player.volume = 0.9;
  cache[kind] = player;
  return player;
}

function playOnce(player: Player) {
  player.loop = false;
  player.pause();
  player.seekTo(0);
  player.play();
}

/** Decode both clips so the first tap is not waiting on the file. */
export function warmupPetSounds() {
  if (!prefReady) {
    void hydratePetSoundsPref().then((on) => {
      if (on) warmupPetSounds();
    });
    return;
  }
  if (!enabled || warming) return;
  const audio = loadAudio();
  if (!audio) return;
  warming = true;
  void (async () => {
    try {
      await ensureMode(audio);
      loadPlayer(audio, 'dog');
      loadPlayer(audio, 'cat');
    } catch {
      warming = false;
    }
  })();
}

/** One bark or one meow. Safe if expo-audio is not in this native build yet. */
export function playPetSound(type?: string | null) {
  const kind = soundType(type);
  if (!kind) return;
  const audio = loadAudio();
  if (!audio) return;
  warmupPetSounds();
  void (async () => {
    try {
      if (!prefReady) await hydratePetSoundsPref();
      if (!enabled) return;
      await ensureMode(audio);
      const other = kind === 'dog' ? cache.cat : cache.dog;
      if (other) {
        other.loop = false;
        other.pause();
        other.seekTo(0);
      }
      playOnce(loadPlayer(audio, kind));
    } catch {
      // Missing native module or playback error — never block the tap.
    }
  })();
}
