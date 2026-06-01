<h1 align="center">
  <a href="#substrack">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="./assets/images/Substrack-Logo.png">
      <source media="(prefers-color-scheme: light)" srcset="./assets/images/Substrack-Logo.png">
      <img height="72" alt="Substrack" src="./assets/images/Substrack-Logo.png">
    </picture>
    <br>
    Substrack
  </a>
</h1>

<p align="center">
  <strong>A focused subscription tracker for recurring payments.</strong><br>
  <sub>Track subscriptions, upcoming renewals, spending totals, reminders, exports, and iOS widgets from one local-first app.</sub>
</p>

<p align="center">
  <a href="#what-is-substrack"><img src="https://img.shields.io/badge/Product-Substrack-0A84FF?style=flat-square" alt="Product"></a>
  <a href="#privacy-and-data"><img src="https://img.shields.io/badge/Data-Local_First-34C759?style=flat-square" alt="Data"></a>
  <a href="#ios-widget"><img src="https://img.shields.io/badge/iOS-WidgetKit-black?style=flat-square" alt="iOS Widget"></a>
  <a href="#status"><img src="https://img.shields.io/badge/Status-App_Store_Preparation-orange?style=flat-square" alt="Status"></a>
</p>

<p align="center">
  <a href="#what-is-substrack">Overview</a> -
  <a href="#features">Features</a> -
  <a href="#privacy-and-data">Privacy</a> -
  <a href="#ios-widget">iOS Widget</a> -
  <a href="#development">Development</a>
</p>

---

## What Is Substrack?

Substrack is a mobile app for managing recurring subscriptions and seeing what is due next.

The app is designed around a simple workflow:

- add each subscription once
- see upcoming payments clearly
- review monthly and yearly spending
- organize subscriptions by category
- export local data when needed
- keep renewal reminders and widgets up to date

Substrack is local-first. Subscription data is stored on the device, and the app does not currently include analytics, advertising trackers, account sync, or a backend service for storing subscription records.

---

## Features

### Subscription Management

- Add subscriptions from a built-in service list.
- Create custom subscriptions manually.
- Store price, currency, billing cycle, billing day, category, and notes.
- Edit, pause, resume, or delete subscriptions.
- View subscription detail screens without unnecessary exchange-rate debug fields.

### Dashboard

- Active subscription count.
- Monthly total.
- Yearly projection.
- Next five upcoming payments.
- Localized date and currency formatting.

### Subscriptions View

- Full subscription list.
- Calendar-style payment overview.
- Sorting by next payment, price, or name.
- Category and service-logo support.

### Stats

- Monthly recurring total.
- Yearly projection.
- Active subscription count.
- Category-based spending breakdown.

### Settings

- Light and dark theme selection.
- Language selection.
- Display currency selection.
- Billing reminder toggle.
- Export subscriptions as JSON, CSV, or PDF.
- Privacy Policy and Support screens.
- Clear local subscription data.

---

## Privacy And Data

Substrack stores subscription data locally on the device using app storage.

Stored local data can include:

- subscription names
- prices and currencies
- billing cycles and billing days
- categories
- notes
- notification preferences
- language, theme, and display-currency preferences

Substrack uses `api.frankfurter.dev` to refresh exchange rates for currency conversion. Saved subscription details are not sent with that request. If the exchange-rate request fails, the app continues with built-in default exchange rates.

The app does not currently include analytics, advertising trackers, crash reporting SDKs, or account-based cloud sync.

---

## iOS Widget

Substrack includes a native iOS WidgetKit extension for upcoming payments.

Widget layouts:

- Small: next payment.
- Medium: next three payments.
- Large: upcoming five payments and monthly total.

The widget reads a compact upcoming-payments payload shared from the app through an App Group:

```text
group.com.barisgunduz.substrack
```

The widget recalculates day labels from saved billing dates, so labels such as "Tomorrow" or remaining-day values can update as the calendar day changes. The native widget timeline is scheduled to refresh around the next day boundary.

For App Store builds, the App Group capability must be enabled for both the main app target and the widget target in Xcode or Apple Developer settings.

---

## Native iOS Notes

The project includes custom native iOS files for the WidgetKit extension. Because this work is not generated automatically by Expo, the `ios/` source files should be kept in version control.

Generated iOS dependencies and build outputs should remain ignored:

- `ios/Pods/`
- `ios/build/`
- `ios/DerivedData/`
- Xcode archives

After cloning the project on a new machine, install dependencies and run CocoaPods before building from Xcode.

---

## Development

Install dependencies:

```bash
npm install
```

Start Expo:

```bash
npm run start
```

Run TypeScript checks:

```bash
npx tsc --noEmit
```

Run lint:

```bash
npm run lint
```

Install iOS pods after dependency changes or after cloning:

```bash
cd ios
pod install
```

For iOS App Store archives, open the workspace in Xcode:

```text
ios/subscriptiontracker.xcworkspace
```

---

## Tech Stack

- Expo
- React Native
- Expo Router
- Zustand
- AsyncStorage
- Expo Notifications
- WidgetKit for the native iOS widget
- Frankfurter API for exchange rates

---

## Status

Substrack is being prepared for App Store submission. The current app supports local subscription tracking, currency conversion, reminders, export, theme and language settings, and a native iOS upcoming-payments widget.
