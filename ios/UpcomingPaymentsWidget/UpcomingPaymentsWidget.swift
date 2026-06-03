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
    let entry = UpcomingPaymentsEntry(date: now, payload: loadPayload())
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
  @Environment(\.colorScheme) private var colorScheme
  let entry: UpcomingPaymentsEntry

  private var languageCode: String {
    entry.payload?.languageCode ?? "en"
  }

  private var payments: [WidgetPayment] {
    entry.payload?.payments ?? []
  }

  private var backgroundColor: Color {
    colorScheme == .dark
      ? Color(red: 0.08, green: 0.07, blue: 0.06)
      : Color(red: 0.98, green: 0.96, blue: 0.93)
  }

  private var surfaceColor: Color {
    colorScheme == .dark
      ? Color(red: 0.15, green: 0.13, blue: 0.11)
      : Color(red: 1.0, green: 0.99, blue: 0.96)
  }

  private var primaryTextColor: Color {
    colorScheme == .dark
      ? Color(red: 0.98, green: 0.95, blue: 0.92)
      : Color(red: 0.13, green: 0.11, blue: 0.09)
  }

  private var secondaryTextColor: Color {
    colorScheme == .dark
      ? Color(red: 0.75, green: 0.70, blue: 0.65)
      : Color(red: 0.45, green: 0.41, blue: 0.38)
  }

  private var accentColor: Color {
    colorScheme == .dark
      ? Color(red: 0.55, green: 0.72, blue: 0.65)
      : Color(red: 0.31, green: 0.48, blue: 0.42)
  }

  private var accentSoftColor: Color {
    colorScheme == .dark
      ? Color(red: 0.14, green: 0.22, blue: 0.19)
      : Color(red: 0.86, green: 0.93, blue: 0.89)
  }

  var body: some View {
    ZStack {
      backgroundColor

      content
        .padding(family == .systemSmall ? 14 : 16)
    }
    .widgetBackground(backgroundColor)
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
    VStack(alignment: .leading, spacing: 10) {
      widgetHeader(localized("Next Payment"))
      Spacer(minLength: 0)
      paymentBlock(payments[0], titleFont: .headline, compact: false)
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
  }

  private var mediumView: some View {
    VStack(alignment: .leading, spacing: 8) {
      widgetHeader(localized("Next 3 Payments"))
      ForEach(Array(payments.prefix(3))) { payment in
        paymentRow(payment)
      }
      Spacer(minLength: 0)
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
  }

  private var largeView: some View {
    VStack(alignment: .leading, spacing: 10) {
      widgetHeader(localized("Upcoming 5 Payments"), monthlyTotal: entry.payload?.monthlyTotal)

      ForEach(Array(payments.prefix(5))) { payment in
        paymentRow(payment)
      }

      Spacer(minLength: 0)
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
  }

  private var emptyState: some View {
    VStack(alignment: .leading, spacing: 12) {
      widgetHeader(localized("Upcoming Payments"))
      Text(localized("No upcoming payments"))
        .font(.subheadline.weight(.semibold))
        .foregroundStyle(primaryTextColor)
      Spacer(minLength: 0)
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
  }

  private func widgetHeader(_ title: String, monthlyTotal: String? = nil) -> some View {
    HStack(alignment: .center, spacing: 8) {
      Text("S")
        .font(.caption.weight(.black))
        .foregroundStyle(Color.white)
        .frame(width: 24, height: 24)
        .background(accentColor)
        .clipShape(RoundedRectangle(cornerRadius: 7, style: .continuous))

      VStack(alignment: .leading, spacing: 1) {
        Text("Substrack")
          .font(.caption2.weight(.bold))
          .foregroundStyle(primaryTextColor)
        Text(title)
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

  private func paymentRow(_ payment: WidgetPayment) -> some View {
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
        .frame(width: family == .systemLarge ? 72 : 64, alignment: .leading)

      Text(payment.name)
        .font(.subheadline.weight(.semibold))
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
    .padding(.vertical, family == .systemLarge ? 8 : 6)
    .background(surfaceColor)
    .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
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
    case "No upcoming payments":
      return "Yaklaşan ödeme yok"
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
  }
}

extension WidgetPayload {
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
  func widgetBackground(_ color: Color) -> some View {
    if #available(iOSApplicationExtension 17.0, *) {
      self.containerBackground(color, for: .widget)
    } else {
      self.background(color)
    }
  }
}
