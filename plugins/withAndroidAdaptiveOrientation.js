const { withAndroidManifest } = require('expo/config-plugins');

/**
 * Play / Android 16 ignore portrait locks on large screens (sw >= 600dp).
 * Declare the activity as user-resizable so the store listing is honest,
 * then JS locks portrait only on compact phones.
 */
function withAndroidAdaptiveOrientation(config) {
  return withAndroidManifest(config, (mod) => {
    const application = mod.modResults.manifest.application?.[0];
    if (!application) return mod;

    application.$['android:resizeableActivity'] = 'true';

    for (const activity of application.activity ?? []) {
      const name = activity.$?.['android:name'] ?? '';
      if (!name.endsWith('.MainActivity') && name !== '.MainActivity') continue;
      activity.$['android:screenOrientation'] = 'fullUser';
      activity.$['android:resizeableActivity'] = 'true';
    }

    return mod;
  });
}

module.exports = withAndroidAdaptiveOrientation;
