require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'AppLocales'
  s.version        = package['version']
  s.summary        = 'Sync in-app language to OS app locales for soft keyboard'
  s.description    = 'Sync in-app language to OS app locales for soft keyboard'
  s.license        = 'MIT'
  s.author         = 'Ragly'
  s.homepage       = 'https://ragly.cloud'
  s.platforms      = { :ios => '15.1' }
  s.swift_version  = '5.9'
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  s.source_files = '**/*.{h,m,mm,swift,hpp,cpp}'
end
