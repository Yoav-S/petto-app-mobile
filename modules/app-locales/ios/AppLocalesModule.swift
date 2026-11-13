import ExpoModulesCore

public class AppLocalesModule: Module {
  public func definition() -> ModuleDefinition {
    Name("AppLocales")

    AsyncFunction("setAppLocale") { (languageTag: String) -> Bool in
      let tag = languageTag.trimmingCharacters(in: .whitespacesAndNewlines)
      guard !tag.isEmpty else { return false }
      let previous = UserDefaults.standard.string(forKey: "AppleLocale") ?? ""
      UserDefaults.standard.set([tag], forKey: "AppleLanguages")
      UserDefaults.standard.set(tag, forKey: "AppleLocale")
      UserDefaults.standard.synchronize()
      let prevLang = String(previous.prefix(while: { $0 != "-" && $0 != "_" }))
      let nextLang = String(tag.prefix(while: { $0 != "-" && $0 != "_" }))
      return prevLang.caseInsensitiveCompare(nextLang) != .orderedSame
    }

    AsyncFunction("restartApp") { () -> Bool in
      // JS uses Updates.reloadAsync on iOS; kept for API parity.
      return false
    }
  }
}
