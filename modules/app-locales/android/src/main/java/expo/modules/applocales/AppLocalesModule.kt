package expo.modules.applocales

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * iOS-oriented Expo stub. Android keyboard locale lives in the app package
 * (com.yoav.petto.AppLocalesModule) — do not call LocaleManager here.
 */
class AppLocalesModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("AppLocales")

    AsyncFunction("setAppLocale") { _: String -> false }
    AsyncFunction("isImeLanguageEnabled") { _: String -> true }
    AsyncFunction("openImeSubtypeSettings") { false }
    AsyncFunction("restartFocusedInput") { false }
  }
}
