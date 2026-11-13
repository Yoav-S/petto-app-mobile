import ExpoModulesCore

public class AppLocalesModule: Module {
  public func definition() -> ModuleDefinition {
    Name("AppLocales")

    AsyncFunction("setAppLocale") { (languageTag: String) -> Bool in
      // Prefer this language for the app process. Soft keyboard language still
      // requires the layout to be enabled in system settings; after reload iOS
      // usually opens the matching input if the user has it installed.
      UserDefaults.standard.set([languageTag], forKey: "AppleLanguages")
      UserDefaults.standard.set(languageTag, forKey: "AppleLocale")
      UserDefaults.standard.synchronize()
      return true
    }
  }
}
