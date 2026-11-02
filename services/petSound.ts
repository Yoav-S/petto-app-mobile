const SOURCES = {
  dog: require('@/assets/sounds/dog.wav'),
  cat: require('@/assets/sounds/cat.wav'),
} as const;

type PetSoundType = keyof typeof SOURCES;
type ExpoAudio = typeof import('expo-audio');
type Player = ReturnType<ExpoAudio['createAudioPlayer']>;

let modeReady = false;
let warming = false;
const cache: Partial<Record<PetSoundType, Player>> = {};

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
  if (warming) return;
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
