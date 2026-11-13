const {
  withAndroidManifest,
  AndroidConfig,
  withDangerousMod,
} = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

const LOCALES = ['en', 'ro', 'ru', 'he'];

function ensureLocalesConfigXml(projectRoot) {
  const xmlDir = path.join(projectRoot, 'android', 'app', 'src', 'main', 'res', 'xml');
  fs.mkdirSync(xmlDir, { recursive: true });
  const xmlPath = path.join(xmlDir, 'locales_config.xml');
  const body = [
    '<?xml version="1.0" encoding="utf-8"?>',
    '<locale-config xmlns:android="http://schemas.android.com/apk/res/android">',
    ...LOCALES.map((locale) => `  <locale android:name="${locale}"/>`),
    '</locale-config>',
    '',
  ].join('\n');
  fs.writeFileSync(xmlPath, body);
}

/**
 * Keep Android localeConfig + AppCompat autoStoreLocales after prebuild,
 * so soft keyboards can follow the in-app language.
 */
function withAppLocales(config) {
  config = withDangerousMod(config, [
    'android',
    async (mod) => {
      ensureLocalesConfigXml(mod.modRequest.projectRoot);
      return mod;
    },
  ]);

  return withAndroidManifest(config, (mod) => {
    const manifest = mod.modResults.manifest;
    const application = manifest.application?.[0];
    if (!application) return mod;

    application.$['android:localeConfig'] = '@xml/locales_config';

    application.service = application.service ?? [];
    const already = application.service.some(
      (service) =>
        service.$?.['android:name'] ===
        'androidx.appcompat.app.AppLocalesMetadataHolderService',
    );
    if (!already) {
      application.service.push({
        $: {
          'android:name': 'androidx.appcompat.app.AppLocalesMetadataHolderService',
          'android:enabled': 'false',
          'android:exported': 'false',
        },
        'meta-data': [
          {
            $: {
              'android:name': 'autoStoreLocales',
              'android:value': 'true',
            },
          },
        ],
      });
    }

    AndroidConfig.Manifest.getMainApplicationOrThrow(mod.modResults);
    return mod;
  });
}

module.exports = withAppLocales;
