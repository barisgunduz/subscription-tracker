import SwiftUI
import WidgetKit

private let appGroupIdentifier = "group.com.barisgunduz.substrack"
private let widgetDataKey = "upcomingWidgetData"

struct WidgetPayment: Codable, Identifiable {
  let id: String
  let name: String
  let formattedPrice: String
  let nextBillingDate: String
}

struct WidgetPayload: Codable {
  let version: Int
  let generatedAt: String
  let languageCode: String
  let locale: String
  let monthlyTotal: String
  let payments: [WidgetPayment]
}

struct UpcomingPaymentsEntry: TimelineEntry {
  let date: Date
  let payload: WidgetPayload?
}

struct UpcomingPaymentsProvider: TimelineProvider {
  func placeholder(in context: Context) -> UpcomingPaymentsEntry {
    UpcomingPaymentsEntry(date: Date(), payload: WidgetPayload.sample)
  }

  func getSnapshot(in context: Context, completion: @escaping (UpcomingPaymentsEntry) -> Void) {
    completion(UpcomingPaymentsEntry(date: Date(), payload: loadPayload() ?? WidgetPayload.sample))
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<UpcomingPaymentsEntry>) -> Void) {
    let now = Date()
    let entry = UpcomingPaymentsEntry(date: now, payload: loadPayload() ?? WidgetPayload.empty)
    let nextRefresh = Calendar.current.nextDate(
      after: now,
      matching: DateComponents(hour: 0, minute: 5),
      matchingPolicy: .nextTime
    ) ?? Calendar.current.date(byAdding: .day, value: 1, to: now)!

    completion(Timeline(entries: [entry], policy: .after(nextRefresh)))
  }

  private func loadPayload() -> WidgetPayload? {
    guard
      let defaults = UserDefaults(suiteName: appGroupIdentifier),
      let payloadString = defaults.string(forKey: widgetDataKey),
      let payloadData = payloadString.data(using: .utf8)
    else {
      return nil
    }

    return try? JSONDecoder().decode(WidgetPayload.self, from: payloadData)
  }
}

struct UpcomingPaymentsWidgetView: View {
  @Environment(\.widgetFamily) private var family
  let entry: UpcomingPaymentsEntry

  private var languageCode: String {
    entry.payload?.languageCode ?? "en"
  }

  private var payments: [WidgetPayment] {
    entry.payload?.payments ?? []
  }

  private var backgroundStartColor: Color {
    Color(red: 0.08, green: 0.09, blue: 0.08)
  }

  private var backgroundEndColor: Color {
    Color(red: 0.12, green: 0.15, blue: 0.13)
  }

  private var surfaceColor: Color {
    Color.white.opacity(0.11)
  }

  private var strongSurfaceColor: Color {
    Color.white.opacity(0.16)
  }

  private var primaryTextColor: Color {
    Color(red: 0.98, green: 0.97, blue: 0.94)
  }

  private var secondaryTextColor: Color {
    Color(red: 0.78, green: 0.80, blue: 0.76)
  }

  private var accentColor: Color {
    Color(red: 0.73, green: 0.91, blue: 0.80)
  }

  private var accentSoftColor: Color {
    Color(red: 0.18, green: 0.31, blue: 0.25)
  }

  private var outerPadding: CGFloat {
    family == .systemSmall ? 10 : 11
  }

  var body: some View {
    ZStack(alignment: .topLeading) {
      widgetBackgroundView

      content
        .padding(outerPadding)
    }
      .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
      .widgetBackground {
        widgetBackgroundView
      }
      .stableWidgetRendering()
      .unredacted()
  }

  private var widgetBackgroundView: some View {
    LinearGradient(
      colors: [backgroundStartColor, backgroundEndColor],
      startPoint: .topLeading,
      endPoint: .bottomTrailing
    )
  }

  @ViewBuilder
  private var content: some View {
    if payments.isEmpty {
      emptyState
    } else {
      switch family {
      case .systemSmall:
        smallView
      case .systemMedium:
        mediumView
      default:
        largeView
      }
    }
  }

  private var smallView: some View {
    VStack(alignment: .leading, spacing: 8) {
      Spacer(minLength: 0)
      compactPaymentBlock(payments[0])
      Spacer(minLength: 0)
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
  }

  private var mediumView: some View {
    VStack(alignment: .leading, spacing: 7) {
      widgetHeader()
      ForEach(Array(payments.prefix(3))) { payment in
        mediumPaymentRow(payment)
      }
      Spacer(minLength: 0)
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
  }

  private var largeView: some View {
    VStack(alignment: .leading, spacing: 9) {
      widgetHeader(monthlyTotal: entry.payload?.monthlyTotal)

      ForEach(Array(payments.prefix(5))) { payment in
        largePaymentRow(payment)
      }

      Spacer(minLength: 0)
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
  }

  private var emptyState: some View {
    VStack(alignment: .leading, spacing: family == .systemSmall ? 10 : 12) {
      if family != .systemSmall {
        widgetHeader()
      }

      VStack(alignment: .leading, spacing: 6) {
        Text(localized("No subscriptions yet"))
          .font((family == .systemSmall ? Font.headline : Font.subheadline).weight(.semibold))
          .foregroundStyle(primaryTextColor)
          .lineLimit(2)
          .minimumScaleFactor(0.8)

        Text(localized("Add one in Substrack"))
          .font(.caption.weight(.medium))
          .foregroundStyle(secondaryTextColor)
          .lineLimit(2)
          .minimumScaleFactor(0.75)
      }
      .padding(12)
      .frame(maxWidth: .infinity, alignment: .leading)
      .background(strongSurfaceColor)
      .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))

      Spacer(minLength: 0)
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
  }

  private func widgetHeader(monthlyTotal: String? = nil) -> some View {
    HStack(alignment: .center, spacing: 8) {
      Image("SubstrackLogo")
        .resizable()
        .scaledToFit()
        .frame(width: 24, height: 24)
        .clipShape(RoundedRectangle(cornerRadius: 7, style: .continuous))

      VStack(alignment: .leading, spacing: 1) {
        Text("Substrack")
          .font(.caption2.weight(.bold))
          .foregroundStyle(primaryTextColor)
        Text("Simple Tracker")
          .font(.caption2.weight(.semibold))
          .foregroundStyle(secondaryTextColor)
          .lineLimit(1)
      }

      Spacer(minLength: 4)

      if let monthlyTotal, family == .systemLarge {
        VStack(alignment: .trailing, spacing: 1) {
          Text(localized("Monthly total"))
            .font(.caption2.weight(.semibold))
            .foregroundStyle(secondaryTextColor)
          Text(monthlyTotal)
            .font(.subheadline.weight(.bold))
            .foregroundStyle(primaryTextColor)
            .lineLimit(1)
            .minimumScaleFactor(0.75)
        }
      }
    }
  }

  private func largePaymentRow(_ payment: WidgetPayment) -> some View {
    HStack(alignment: .center, spacing: 8) {
      Text(dueLabel(for: payment.nextBillingDate))
        .font(.caption2.weight(.bold))
        .foregroundStyle(accentColor)
        .lineLimit(1)
        .minimumScaleFactor(0.75)
        .padding(.horizontal, 7)
        .padding(.vertical, 4)
        .background(accentSoftColor)
        .clipShape(Capsule())
        .frame(width: 72, alignment: .leading)

      Text(payment.name)
        .font(.caption.weight(.semibold))
        .foregroundStyle(primaryTextColor)
        .lineLimit(1)
        .minimumScaleFactor(0.8)

      Spacer(minLength: 4)

      Text(payment.formattedPrice)
        .font(.caption.weight(.bold))
        .foregroundStyle(primaryTextColor)
        .lineLimit(1)
        .minimumScaleFactor(0.8)
    }
    .padding(.horizontal, 9)
    .padding(.vertical, 7)
    .background(surfaceColor)
    .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
  }

  private func mediumPaymentRow(_ payment: WidgetPayment) -> some View {
    HStack(alignment: .center, spacing: 7) {
      Text(dueLabel(for: payment.nextBillingDate))
        .font(.caption2.weight(.bold))
        .foregroundStyle(accentColor)
        .lineLimit(1)
        .minimumScaleFactor(0.7)
        .padding(.horizontal, 6)
        .padding(.vertical, 3)
        .background(accentSoftColor)
        .clipShape(Capsule())
        .frame(width: 58, alignment: .leading)

      Text(payment.name)
        .font(.caption.weight(.semibold))
        .foregroundStyle(primaryTextColor)
        .lineLimit(1)
        .minimumScaleFactor(0.72)

      Spacer(minLength: 2)

      Text(payment.formattedPrice)
        .font(.caption2.weight(.bold))
        .foregroundStyle(primaryTextColor)
        .lineLimit(1)
        .minimumScaleFactor(0.72)
    }
    .padding(.horizontal, 7)
    .padding(.vertical, 5)
    .frame(maxWidth: .infinity, alignment: .leading)
    .background(surfaceColor)
    .clipShape(RoundedRectangle(cornerRadius: 9, style: .continuous))
  }

  private func paymentBlock(_ payment: WidgetPayment, titleFont: Font, compact: Bool) -> some View {
    VStack(alignment: .leading, spacing: 8) {
      Text(dueLabel(for: payment.nextBillingDate))
        .font(.caption2.weight(.bold))
        .foregroundStyle(accentColor)
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
        .background(accentSoftColor)
        .clipShape(Capsule())

      Text(payment.name)
        .font(titleFont.weight(.bold))
        .foregroundStyle(primaryTextColor)
        .lineLimit(2)
        .minimumScaleFactor(0.8)
      Text(payment.formattedPrice)
        .font(.subheadline.weight(.bold))
        .foregroundStyle(secondaryTextColor)
        .lineLimit(2)
    }
    .padding(10)
    .frame(maxWidth: .infinity, alignment: .leading)
    .background(surfaceColor)
    .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
  }

  private func compactPaymentBlock(_ payment: WidgetPayment) -> some View {
    VStack(alignment: .leading, spacing: 9) {
      Text(dueLabel(for: payment.nextBillingDate))
        .font(.caption.weight(.bold))
        .foregroundStyle(accentColor)
        .lineLimit(1)
        .minimumScaleFactor(0.75)
        .padding(.horizontal, 9)
        .padding(.vertical, 5)
        .background(accentSoftColor)
        .clipShape(Capsule())

      Text(payment.name)
        .font(.headline.weight(.bold))
        .foregroundStyle(primaryTextColor)
        .lineLimit(2)
        .minimumScaleFactor(0.72)

      Text(payment.formattedPrice)
        .font(.subheadline.weight(.bold))
        .foregroundStyle(secondaryTextColor)
        .lineLimit(1)
        .minimumScaleFactor(0.75)
    }
    .padding(11)
    .frame(maxWidth: .infinity, alignment: .leading)
    .background(strongSurfaceColor)
    .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
  }

  private func dueLabel(for value: String) -> String {
    let formatter = DateFormatter()
    formatter.calendar = Calendar(identifier: .gregorian)
    formatter.locale = Locale(identifier: "en_US_POSIX")
    formatter.dateFormat = "yyyy-MM-dd"

    guard let date = formatter.date(from: value) else {
      return value
    }

    let calendar = Calendar.current
    let today = calendar.startOfDay(for: entry.date)
    let billingDate = calendar.startOfDay(for: date)
    let days = max(0, calendar.dateComponents([.day], from: today, to: billingDate).day ?? 0)

    if days == 0 {
      return localized("Today")
    }

    if days == 1 {
      return localized("Tomorrow")
    }

    return languageCode == "tr" ? "\(days) Gün" : "\(days) Days"
  }

  private func localized(_ key: String) -> String {
    guard languageCode == "tr" else {
      return key
    }

    switch key {
    case "Upcoming Payments":
      return "Yaklaşan Ödemeler"
    case "Next Payment":
      return "Sonraki Ödeme"
    case "Next 3 Payments":
      return "Sonraki 3 Ödeme"
    case "Upcoming 5 Payments":
      return "Yaklaşan 5 Ödeme"
    case "Monthly total":
      return "Aylık toplam"
    case "No subscriptions yet":
      return "Henüz abonelik yok"
    case "Add one in Substrack":
      return "Substrack içinde ekleyin"
    case "Today":
      return "Bugün"
    case "Tomorrow":
      return "Yarın"
    default:
      return key
    }
  }
}

@main
struct UpcomingPaymentsWidget: Widget {
  let kind = "UpcomingPaymentsWidget"

  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: UpcomingPaymentsProvider()) { entry in
      UpcomingPaymentsWidgetView(entry: entry)
    }
    .configurationDisplayName("Substrack")
    .description("See your upcoming subscription payments.")
    .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
    .contentMarginsDisabled()
  }
}

extension WidgetPayload {
  static let empty = WidgetPayload(
    version: 1,
    generatedAt: "1970-01-01T00:00:00Z",
    languageCode: "en",
    locale: "en-US",
    monthlyTotal: "$0.00",
    payments: []
  )

  static let sample = WidgetPayload(
    version: 1,
    generatedAt: "2026-06-01T00:00:00Z",
    languageCode: "en",
    locale: "en-US",
    monthlyTotal: "$28.97",
    payments: [
      WidgetPayment(id: "1", name: "Netflix", formattedPrice: "$15.99", nextBillingDate: "2026-06-02"),
      WidgetPayment(id: "2", name: "Spotify", formattedPrice: "$9.99", nextBillingDate: "2026-06-04"),
      WidgetPayment(id: "3", name: "iCloud", formattedPrice: "$2.99", nextBillingDate: "2026-06-08"),
      WidgetPayment(id: "4", name: "Notion", formattedPrice: "$8.00", nextBillingDate: "2026-06-12"),
      WidgetPayment(id: "5", name: "YouTube", formattedPrice: "$13.99", nextBillingDate: "2026-06-16"),
    ]
  )
}

private extension View {
  @ViewBuilder
  func stableWidgetRendering() -> some View {
    if #available(iOS 16.0, *) {
      self.widgetAccentable(false)
    } else {
      self
    }
  }

  @ViewBuilder
  func widgetBackground<Background: View>(
    @ViewBuilder _ background: () -> Background
  ) -> some View {
    if #available(iOS 17.0, *) {
      self.containerBackground(for: .widget) {
        background()
      }
    } else {
      self.background(background())
    }
  }
}
