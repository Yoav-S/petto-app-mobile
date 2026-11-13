package expo.modules.applocales

import android.app.LocaleManager
import android.os.Build
import android.os.LocaleList
import androidx.appcompat.app.AppCompatDelegate
import androidx.core.os.LocaleListCompat
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/** Fallback Expo module — primary implementation lives in the app package. */
class AppLocalesModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("AppLocales")

    AsyncFunction("setAppLocale") { languageTag: String ->
      val tag = languageTag.trim()
      if (tag.isEmpty()) return@AsyncFunction false

      AppCompatDelegate.setApplicationLocales(LocaleListCompat.forLanguageTags(tag))

      val context = appContext.reactContext
      if (context != null && Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        val localeManager = context.getSystemService(LocaleManager::class.java)
        localeManager?.applicationLocales = LocaleList.forLanguageTags(tag)
      }

      true
    }
  }
}
