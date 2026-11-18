const fs = require('fs');
const path = require('path');
const { withDangerousMod } = require('expo/config-plugins');

/**
 * Create screens use react-native-screens' `slide_from_bottom`, which on
 * Android is fixed to config_mediumAnimTime (400ms). App resources override
 * library ones with the same name, so these copies set the duration.
 * Keep in sync with ANDROID_FOCUS_DELAY_MS in hooks/useDeferredFocus.ts.
 */
const DURATION_MS = 500;

const FILES = {
  'rns_slide_in_from_bottom.xml': `<?xml version="1.0" encoding="utf-8"?>
<translate xmlns:android="http://schemas.android.com/apk/res/android"
    android:fromYDelta="100%"
    android:toYDelta="0%"
    android:duration="${DURATION_MS}" />
`,
  'rns_slide_out_to_bottom.xml': `<?xml version="1.0" encoding="utf-8"?>
<translate xmlns:android="http://schemas.android.com/apk/res/android"
    android:fromYDelta="0%"
    android:toYDelta="100%"
    android:duration="${DURATION_MS}" />
`,
  'rns_no_animation_medium.xml': `<?xml version="1.0" encoding="utf-8"?>
<alpha xmlns:android="http://schemas.android.com/apk/res/android"
    android:fromAlpha="1.0"
    android:toAlpha="1.0"
    android:duration="${DURATION_MS}" />
`,
};

function withCreateScreenAnimDuration(config) {
  return withDangerousMod(config, [
    'android',
    async (mod) => {
      const animDir = path.join(
        mod.modRequest.platformProjectRoot,
        'app',
        'src',
        'main',
        'res',
        'anim',
      );
      fs.mkdirSync(animDir, { recursive: true });
      for (const [name, contents] of Object.entries(FILES)) {
        fs.writeFileSync(path.join(animDir, name), contents);
      }
      return mod;
    },
  ]);
}

module.exports = withCreateScreenAnimDuration;
