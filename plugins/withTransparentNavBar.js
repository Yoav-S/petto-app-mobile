const {
  withMainActivity,
  withAndroidStyles,
  AndroidConfig,
} = require('expo/config-plugins');

const CLEAR_MARKER = 'clearNavigationBarScrim';

const CLEAR_FN = `
  private fun clearNavigationBarScrim() {
    window.decorView.setBackgroundColor(android.graphics.Color.TRANSPARENT)
    if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.Q) {
      window.isStatusBarContrastEnforced = false
      window.isNavigationBarContrastEnforced = false
    }
  }
`;

/**
 * Kill Android's white 3-button navigation scrim (edge-to-edge contrast).
 * Survives `expo prebuild` so local MainActivity edits are not lost.
 */
function withTransparentNavBar(config) {
  config.androidNavigationBar = {
    ...(config.androidNavigationBar || {}),
    enforceContrast: false,
  };

  config = withAndroidStyles(config, (mod) => {
    for (const parent of ['AppTheme', 'Theme.App.SplashScreen']) {
      mod.modResults = AndroidConfig.Styles.assignStylesValue(mod.modResults, {
        add: true,
        parent: { name: parent },
        name: 'android:enforceNavigationBarContrast',
        value: 'false',
      });
      mod.modResults = AndroidConfig.Styles.assignStylesValue(mod.modResults, {
        add: true,
        parent: { name: parent },
        name: 'android:enforceStatusBarContrast',
        value: 'false',
      });
    }
    // Hide Android 12+ splash icon plate (white circle) by matching the canvas.
    mod.modResults = AndroidConfig.Styles.assignStylesValue(mod.modResults, {
      add: true,
      parent: { name: 'Theme.App.SplashScreen' },
      name: 'windowSplashScreenIconBackgroundColor',
      value: '@color/splashscreen_background',
    });
    return mod;
  });

  config = withMainActivity(config, (mod) => {
    let src = mod.modResults.contents;
    if (src.includes(CLEAR_MARKER)) {
      return mod;
    }

    if (!src.includes('super.onCreate(null)') && !src.includes('super.onCreate(savedInstanceState)')) {
      return mod;
    }

    const onCreateCall = src.includes('super.onCreate(null)')
      ? 'super.onCreate(null)'
      : 'super.onCreate(savedInstanceState)';

    src = src.replace(
      onCreateCall,
      `${onCreateCall}
    clearNavigationBarScrim()
    window.decorView.post { clearNavigationBarScrim() }
    window.decorView.postDelayed({ clearNavigationBarScrim() }, 300)`,
    );

    if (!src.includes('override fun onResume()')) {
      src = src.replace(
        /override fun getMainComponentName/,
        `override fun onResume() {
    super.onResume()
    clearNavigationBarScrim()
  }

  override fun onWindowFocusChanged(hasFocus: Boolean) {
    super.onWindowFocusChanged(hasFocus)
    if (hasFocus) clearNavigationBarScrim()
  }

  override fun getMainComponentName`,
      );
    }

    if (!src.includes(CLEAR_MARKER + '() {') && !src.includes('private fun clearNavigationBarScrim')) {
      src = src.replace(
        /override fun getMainComponentName/,
        `${CLEAR_FN}\n  override fun getMainComponentName`,
      );
    }

    mod.modResults.contents = src;
    return mod;
  });

  return config;
}

module.exports = withTransparentNavBar;
