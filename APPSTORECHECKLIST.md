# Substrack App Store Checklist

Last checked: 2026-06-01

Legend:

- ✅ Done or locally verified
- ❌ Not done, not verified, or must be completed outside the repo

## Local Technical Checks

- ✅ TypeScript check passes: `npx tsc --noEmit`.
- ✅ Lint passes: `npm run lint`.
- ✅ iOS plist files pass `plutil -lint`.
- ✅ iOS workspace build passes for device target with signing disabled:
  `xcodebuild -workspace ios/subscriptiontracker.xcworkspace -scheme subscriptiontracker -configuration Debug -destination generic/platform=iOS CODE_SIGNING_ALLOWED=NO build`.
- ✅ App icon asset exists and is square.
- ✅ Native iOS widget target is present in the Xcode project.
- ✅ Native widget files are no longer hidden by the root `/ios` gitignore rule.
- ✅ `ios/Pods/`, `ios/build/`, `ios/DerivedData/`, and archive outputs remain ignored.
- ✅ App version is set to `1.0.0`.
- ✅ Bundle identifier is set to `com.barisgunduz.substrack`.
- ✅ Display name is set to `Substrack`.
- ✅ App uses HTTPS for the exchange-rate request to `api.frankfurter.dev`.
- ✅ App does not define `NSUserTrackingUsageDescription`.
- ✅ App does not include analytics, ad tracking, or account login code in the reviewed codebase.

## App Functionality

- ✅ App has local-first subscription storage.
- ✅ Add, edit, pause, restart, and delete subscription flows exist.
- ✅ Home dashboard, subscriptions list, stats, settings, support, language, and privacy screens exist.
- ✅ Subscription detail back navigation has been fixed to use real back behavior with a subscriptions fallback.
- ✅ Settings child pages use real back behavior with a settings fallback.
- ✅ Light and dark theme selection exists in Settings.
- ✅ Language selection exists.
- ✅ Display currency selection exists.
- ✅ Currency conversion uses Frankfurter exchange rates and falls back to default rates if the request fails.
- ✅ Subscription export exists for JSON, CSV, and PDF.
- ✅ Billing reminders are opt-in and can be turned off.
- ✅ Billing reminders are scheduled as local notifications for one day before and the renewal day at 09:00.
- ✅ iOS WidgetKit extension exists for upcoming payments.
- ❌ Full physical-device QA pass is still needed on a real iPhone.
- ❌ iPad QA pass is still needed because `supportsTablet` is enabled.
- ❌ Real-device notification permission, scheduling, and delivery should be tested.
- ❌ Real-device widget add, refresh, and day-rollover behavior should be tested.
- ❌ Fresh install, app update, app delete/reinstall, and empty-state flows should be tested.
- ❌ Export/share flows should be tested on a real device.
- ❌ Light/dark theme readability should be checked on real device and simulator.
- ❌ Turkish and English UI text should be checked for clipping on small and large devices.

## Privacy And Data

- ✅ In-app Privacy Policy screen exists and is reachable from Settings.
- ✅ Privacy copy states that subscription data is stored locally.
- ✅ Privacy copy states that `api.frankfurter.dev` is used for exchange-rate refreshes.
- ✅ Privacy copy states that saved subscription details are not sent with exchange-rate requests.
- ✅ Privacy copy states that there is no analytics, advertising tracking, or crash reporting SDK for now.
- ✅ iOS `PrivacyInfo.xcprivacy` exists.
- ✅ Privacy manifest declares no collected data through `NSPrivacyCollectedDataTypes`.
- ✅ Privacy manifest declares tracking as false.
- ✅ Required-reason API categories are declared in `PrivacyInfo.xcprivacy`.
- ❌ A public Privacy Policy URL must be created and entered in App Store Connect.
- ❌ A public Support URL with real contact information must be created and entered in App Store Connect.
- ❌ App Store Connect App Privacy answers must be completed and published.
- ❌ Confirm whether App Store Connect can be answered as "No, we do not collect data from this app" after reviewing any third-party service logging by Frankfurter and any future SDKs.
- ❌ If analytics, crash reporting, ads, account sync, or backend storage are added later, Privacy Policy and App Privacy answers must be updated before submission.

## Apple Developer Account And Signing

- ❌ Apple Developer Program membership must be active.
- ❌ App Store Connect app record must be created for `Substrack`.
- ❌ Bundle ID `com.barisgunduz.substrack` must exist in Apple Developer portal.
- ❌ Widget extension bundle ID must exist in Apple Developer portal.
- ❌ App Group `group.com.barisgunduz.substrack` must be created/enabled in Apple Developer portal.
- ❌ App Group must be enabled for both the main app target and the widget extension target.
- ❌ Xcode Signing & Capabilities must show the correct team for both targets.
- ❌ Distribution certificate and provisioning profiles must be valid.
- ❌ Archive validation must pass in Xcode Organizer.
- ❌ Upload to App Store Connect/TestFlight must be completed.
- ❌ Processed build must appear in App Store Connect.

## App Store Connect Metadata

- ❌ App name must be set to `Substrack`.
- ❌ Subtitle must be written.
- ❌ Description must be written and must match current app behavior.
- ❌ Keywords must be written without competitor or trademark stuffing.
- ❌ Category must be selected.
- ❌ Age rating questionnaire must be completed.
- ❌ Copyright field must be completed.
- ❌ Developer contact/support details must be completed.
- ❌ Pricing and availability must be selected.
- ❌ Review notes should explain that the app is local-first and that exchange rates come from `api.frankfurter.dev`.
- ❌ Review notes should mention there is no login or test account required.
- ❌ If the reviewer should test notifications/widgets, provide clear steps in Review Notes.
- ❌ Privacy Policy URL must be entered.
- ❌ Support URL must be entered.
- ❌ Marketing URL is optional, but should be added if a product page exists.

## Screenshots And Store Assets

- ✅ App icon source is available at `assets/images/Substrack-Logo.png`.
- ✅ iOS app icon exists at `ios/subscriptiontracker/Images.xcassets/AppIcon.appiconset/App-Icon-1024x1024@1x.png`.
- ❌ App Store screenshots must be captured and uploaded.
- ❌ At least one screenshot is required; recommended set should cover Home, Subscriptions, Add/Edit, Stats, Settings, and Widget.
- ❌ iPhone screenshot set must be prepared.
- ❌ iPad screenshot set must be prepared because iPad support is enabled.
- ❌ Screenshots must not show debug logs, placeholder content, broken UI, or private personal data.
- ❌ App preview video is optional and not required.

## Notifications

- ✅ Notifications are not required for the app to function.
- ✅ Notifications require user permission.
- ✅ Notifications are reminders, not advertising or direct marketing.
- ✅ Notifications can be disabled from Settings.
- ✅ Notification content avoids sensitive financial detail beyond service name and due timing.
- ❌ Notification permission prompt and Settings toggle should be tested on real device.
- ❌ Scheduled notification list should be checked in development logs after enabling reminders.

## WidgetKit

- ✅ Widget extension source exists in `ios/UpcomingPaymentsWidget`.
- ✅ Widget supports small, medium, and large layouts.
- ✅ Widget reads shared data through App Group.
- ✅ Widget recalculates day labels from saved dates.
- ✅ Widget timeline refresh is scheduled around the next day boundary.
- ❌ Widget target signing must be verified in Xcode.
- ❌ Widget App Group entitlement must be verified in the Apple Developer portal.
- ❌ Widget should be manually tested on real iPhone home screen.
- ❌ Widget should be tested after app data changes, after midnight/day rollover, and after app restart.

## Export Compliance

- ✅ App uses HTTPS networking.
- ✅ No custom cryptography was found in the reviewed app code.
- ❌ Export compliance questions must be answered in App Store Connect.
- ❌ If Apple asks about encryption, answer based on standard Apple/HTTPS usage and current dependencies.
- ❌ If any custom encryption or VPN/security functionality is added later, re-check export compliance.

## Review Guideline Risks

- ✅ App does not require login for core functionality.
- ✅ App does not include in-app purchases at this time.
- ✅ App does not include ads.
- ✅ App does not include user-generated public content.
- ✅ App does not include medical, gambling, crypto trading, or regulated financial services.
- ✅ Push/local notifications are optional and user-controlled.
- ❌ Avoid claiming bank-level finance, budgeting automation, account sync, or automatic cancellation features in metadata unless implemented.
- ❌ Avoid using third-party subscription service logos/trademarks in App Store screenshots or metadata unless rights are clear.
- ❌ Verify all bundled service logos are permitted for app use or replace with generic/fallback icons where needed.
- ❌ Confirm app name/icon does not conflict with existing trademarks before submission.

## Release Workflow

- ✅ Repository now keeps custom native iOS source files needed for the widget.
- ❌ Commit current app, README, checklist, iOS native files, and lockfile changes.
- ❌ Do not commit `ios/Pods/`, `ios/build/`, `.expo/`, `node_modules/`, `.DS_Store`, or local env files.
- ❌ Run `npm install` after clone.
- ❌ Run `cd ios && pod install` after clone or dependency changes.
- ❌ Open `ios/subscriptiontracker.xcworkspace` in Xcode.
- ❌ Select the correct Apple team for app and widget targets.
- ❌ Enable App Groups for app and widget targets.
- ❌ Product > Archive.
- ❌ Validate archive in Organizer.
- ❌ Distribute App > App Store Connect > Upload.
- ❌ Wait for App Store Connect processing email.
- ❌ Attach processed build to the app version.
- ❌ Complete metadata, privacy, age rating, pricing, and review information.
- ❌ Submit for review.

## Official References Checked

- Apple App Review Guidelines: https://developer.apple.com/app-store/review/guidelines/
- App Store Connect privacy management: https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy
- Required reason API privacy manifest: https://developer.apple.com/documentation/BundleResources/describing-use-of-required-reason-api
- App Store Connect build upload: https://developer.apple.com/help/app-store-connect/manage-builds/upload-builds/
- App Store Connect screenshots/app previews: https://developer.apple.com/help/app-store-connect/manage-app-information/upload-app-previews-and-screenshots
- App Store Connect platform metadata fields: https://developer.apple.com/help/app-store-connect/reference/app-information/platform-version-information
