# Substrack App Store Release Checklist

Last checked: 2026-06-03

Legend:
- [x] Done / locally verified
- [ ] Not verified yet / must be completed before release
- [ ] External check: cannot be proven from repository alone

## Critical Issues - Before App Store Review

- [ ] External check: create and enable App Group `group.com.barisgunduz.substrack` in Apple Developer for both the app target and widget extension. Local code has the entitlement, but Apple Developer provisioning must be verified in Xcode.
- [ ] External check: archive the app in Xcode using App Store distribution signing and confirm both targets sign successfully: `subscriptiontracker` and `UpcomingPaymentsWidget`.
- [ ] External check: upload a build to App Store Connect and confirm processing completes without entitlement, privacy manifest, icon, or extension errors.
- [ ] External check: install the TestFlight build on a real iPhone and test add/edit/delete subscription, notifications, widget small/medium/large, export, language, and theme.
- [ ] External check: confirm App Store Connect App Privacy answer matches the current app behavior. Current code supports "No, we do not collect data from this app", assuming no extra SDKs are added by the final build.
- [ ] External check: confirm Support URL and Privacy Policy URL are live, public, and contain contact details plus the current privacy policy.
- [ ] External check: confirm App Store screenshots use iPhone-only assets and do not show unlicensed third-party branding in a promotional way.

## Completed Local Technical Checks

- [x] `npm run lint` completed with exit code 0 on 2026-06-03.
- [x] `npx tsc --noEmit` completed with exit code 0 on 2026-06-03.
- [x] Native plist/entitlement files passed `plutil -lint`: app Info.plist, widget Info.plist, privacy manifest, app entitlement, widget entitlement.
- [x] App config uses `name: Substrack`.
- [x] App config uses `version: 1.0.0`.
- [x] App config uses iOS bundle identifier `com.barisgunduz.substrack`.
- [x] Xcode project uses app bundle identifier `com.barisgunduz.substrack`.
- [x] Xcode project uses widget bundle identifier `com.barisgunduz.substrack.UpcomingPaymentsWidget`.
- [x] Xcode project uses `MARKETING_VERSION = 1.0.0` and `CURRENT_PROJECT_VERSION = 1`.
- [x] iPhone-only release is configured: Expo `ios.supportsTablet` is false and Xcode `TARGETED_DEVICE_FAMILY = 1`.
- [x] App icon points to `assets/images/Substrack-Logo.png`.
- [x] Splash screen points to `assets/images/Substrack-Logo.png`.
- [x] App Transport Security arbitrary loads are disabled.
- [x] No camera, photo library, contacts, location, microphone, Bluetooth, calendar, tracking, analytics, crash reporting, advertising, or login permission strings were found in app config/native plist files.
- [x] No `NSUserTrackingUsageDescription` is defined.
- [x] No analytics, crash reporting, advertising SDK, backend URL, or account/login implementation was found in the reviewed source.
- [x] Runtime network usage found in source is the HTTPS Frankfurter exchange-rate request.
- [x] Only environment reads found are Expo platform checks: `process.env.EXPO_OS`.

## Widget, App Group, And Push Notifications

- [x] App Group id is consistent in Expo config, app entitlement, widget entitlement, Swift widget code, and native bridge: `group.com.barisgunduz.substrack`.
- [x] Widget data is written by the app to App Group `UserDefaults`.
- [x] Widget reads App Group `UserDefaults` and refreshes its timeline after midnight.
- [x] Widget supports small, medium, and large families.
- [x] Widget sync component runs from root layout when subscriptions, currency, exchange rates, or language change.
- [ ] External check: verify widget appears in the iOS widget picker after TestFlight install.
- [ ] External check: verify widget shows placeholder/empty state before any subscription is added.
- [ ] External check: verify widget day labels update after the date changes without opening the app.
- [ ] External check: verify widget monthly total matches the app's selected display currency.
- [x] Notification permission is requested only when the user enables reminders in Settings.
- [x] Notifications are local scheduled notifications, not remote push notifications from a backend.
- [x] Notification scheduling skips inactive subscriptions.
- [x] Notification scheduling creates one-day-before and due-day reminders at 09:00.
- [x] Notification scheduling is bounded to about 370 days and max 60 scheduled notifications.
- [x] Notifications are cancelled when reminders are disabled.
- [ ] External check: verify the iOS notification permission prompt copy and Settings behavior on a real device.
- [ ] External check: verify scheduled notifications in a development/TestFlight build with a near-future billing date.

## Privacy, Data, And App Store Connect Answers

- [x] Subscription records are stored locally with AsyncStorage/Zustand.
- [x] Preferences, selected theme, selected language, display currency, exchange rates, and notification preference are stored locally.
- [x] Privacy Policy states the app is local-first and does not operate a server for subscription data.
- [x] Privacy Policy states Frankfurter API is used for exchange rates and saved subscription details are not sent with that request.
- [x] Privacy Policy includes a Frankfurter/Cloudflare technical request note.
- [x] Privacy Policy states there is currently no analytics, advertising tracker, crash reporting SDK, account system, or backend sync.
- [x] iOS privacy manifest declares no collected data and no tracking.
- [x] Required reason API categories are present in the iOS privacy manifest.
- [ ] External check: verify App Store Connect App Privacy answers match the final archived binary and published Privacy Policy URL.
- [ ] If analytics, crash reporting, ads, account sync, backend storage, or extra SDKs are added later, update Privacy Policy, App Privacy answers, and privacy manifest before submission.

## App Store Metadata

- [ ] External check: App Store name is set to `Substrack - Subscription Tracker`.
- [ ] External check: subtitle is concise and does not overclaim features.
- [ ] External check: promotional text is final.
- [ ] External check: description is final and matches implemented features only.
- [ ] External check: keywords are final and avoid competitor trademark stuffing.
- [ ] External check: support URL is live.
- [ ] External check: marketing URL is either blank or live.
- [ ] External check: privacy policy URL is live and matches in-app policy.
- [ ] External check: review notes explain local-first storage, local notifications, widget/App Group, and Frankfurter exchange rates.
- [ ] External check: age rating is complete and appropriate for a utility app.
- [ ] External check: export compliance answer is complete. Current code uses standard HTTPS only, with no custom cryptography found.

## Screenshots, Branding, And Assets

- [x] iPad support is intentionally disabled for this first release.
- [ ] External check: upload only required iPhone screenshots for selected display sizes.
- [ ] External check: screenshots show real implemented screens and match the current app name/design.
- [ ] External check: screenshots do not imply account sync, backend features, analytics, or automatic bill cancellation.
- [ ] External check: third-party service logos are not used in App Store promotional screenshots unless trademark usage is acceptable.
- [ ] Review whether old default Expo/React assets should be removed from the repo: `icon.png`, `splash-icon.png`, `react-logo*.png`, `partial-react-logo.png`.
- [ ] Review the third-party service logo set and keep only logos that are actually needed for the first release.

## Manual QA Before TestFlight

- [ ] Fresh install starts cleanly and onboarding/first-use flow is understandable.
- [ ] Add monthly subscription.
- [ ] Add yearly subscription.
- [ ] Edit subscription.
- [ ] Delete subscription.
- [ ] Pause and restart subscription.
- [ ] Verify next billing date calculations for month end dates.
- [ ] Verify empty states on Home, Subscriptions, Stats, Calendar, Settings.
- [ ] Verify light theme.
- [ ] Verify dark theme.
- [ ] Verify theme selection persists after app restart.
- [ ] Verify language selection persists after app restart.
- [ ] Verify USD/EUR/TRY display currency behavior.
- [ ] Verify offline launch works with built-in exchange rates.
- [ ] Verify Frankfurter failure does not block app usage.
- [ ] Verify export JSON.
- [ ] Verify export CSV.
- [ ] Verify export PDF.
- [ ] Verify support page links and mail fallback.
- [ ] Verify privacy policy page content and navigation back behavior.
- [ ] Verify subscription detail back behavior.
- [ ] Verify no obvious layout overlap on small iPhone and large iPhone sizes.

## Production Build Checklist

- [ ] Open Xcode project from `ios/subscriptiontracker.xcworkspace`.
- [ ] Confirm Apple team/signing for the app target.
- [ ] Confirm Apple team/signing for `UpcomingPaymentsWidget`.
- [ ] Confirm App Group capability is enabled for both targets.
- [ ] Clean build folder.
- [ ] Archive Release build.
- [ ] Validate archive.
- [ ] Distribute to App Store Connect.
- [ ] Wait for build processing.
- [ ] Add build to TestFlight.
- [ ] Complete internal TestFlight smoke test.
- [ ] Complete external/manual QA if needed.
- [ ] Submit for App Review only after all Critical Issues are checked.

## Official References

- Apple App Review Guidelines: https://developer.apple.com/app-store/review/guidelines/
- App Store Connect privacy management: https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy
- Required reason API privacy manifest: https://developer.apple.com/documentation/BundleResources/describing-use-of-required-reason-api
- App Store Connect build upload: https://developer.apple.com/help/app-store-connect/manage-builds/upload-builds/
- App Store Connect screenshots/app previews: https://developer.apple.com/help/app-store-connect/manage-app-information/upload-app-previews-and-screenshots
- App Store Connect platform metadata fields: https://developer.apple.com/help/app-store-connect/reference/app-information/platform-version-information
