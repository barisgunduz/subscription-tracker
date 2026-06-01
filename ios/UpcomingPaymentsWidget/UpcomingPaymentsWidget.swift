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
  let entry: UpcomingPaymentsEntry

  private var languageCode: String {
    entry.payload?.languageCode ?? "en"
  }

  private var payments: [WidgetPayment] {
    entry.payload?.payments ?? []
  }

  var body: some View {
    let backgroundColor = Color(red: 0.96, green: 0.95, blue: 0.92)

    ZStack {
      backgroundColor

      content
        .padding(14)
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
    VStack(alignment: .leading, spacing: 8) {
      Text(localized("Next Payment"))
        .font(.caption.weight(.semibold))
        .foregroundStyle(.secondary)
      Spacer(minLength: 0)
      paymentBlock(payments[0], titleFont: .headline, compact: false)
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
  }

  private var mediumView: some View {
    VStack(alignment: .leading, spacing: 8) {
      Text(localized("Next 3 Payments"))
        .font(.caption.weight(.semibold))
        .foregroundStyle(.secondary)
      ForEach(Array(payments.prefix(3))) { payment in
        paymentRow(payment)
      }
      Spacer(minLength: 0)
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
  }

  private var largeView: some View {
    VStack(alignment: .leading, spacing: 10) {
      HStack(alignment: .firstTextBaseline) {
        Text(localized("Upcoming 5 Payments"))
          .font(.caption.weight(.semibold))
          .foregroundStyle(.secondary)
        Spacer()
        VStack(alignment: .trailing, spacing: 2) {
          Text(localized("Monthly total"))
            .font(.caption2.weight(.semibold))
            .foregroundStyle(.secondary)
          Text(entry.payload?.monthlyTotal ?? "")
            .font(.subheadline.weight(.bold))
        }
      }

      ForEach(Array(payments.prefix(5))) { payment in
        paymentRow(payment)
      }

      Spacer(minLength: 0)
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
  }

  private var emptyState: some View {
    VStack(alignment: .leading, spacing: 8) {
      Text("Substrack")
        .font(.headline.weight(.bold))
      Text(localized("No upcoming payments"))
        .font(.subheadline)
        .foregroundStyle(.secondary)
      Spacer(minLength: 0)
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
  }

  private func paymentRow(_ payment: WidgetPayment) -> some View {
    HStack(alignment: .firstTextBaseline, spacing: 10) {
      Text(dueLabel(for: payment.nextBillingDate))
        .font(.caption.weight(.bold))
        .foregroundStyle(Color(red: 0.31, green: 0.48, blue: 0.42))
        .frame(width: 70, alignment: .leading)

      Text(payment.name)
        .font(.subheadline.weight(.semibold))
        .lineLimit(1)

      Spacer(minLength: 4)

      Text(payment.formattedPrice)
        .font(.subheadline.weight(.medium))
        .lineLimit(1)
    }
  }

  private func paymentBlock(_ payment: WidgetPayment, titleFont: Font, compact: Bool) -> some View {
    VStack(alignment: .leading, spacing: 4) {
      Text(payment.name)
        .font(titleFont.weight(.bold))
        .lineLimit(2)
      Text("\(dueLabel(for: payment.nextBillingDate)) · \(payment.formattedPrice)")
        .font(.subheadline.weight(.medium))
        .foregroundStyle(.secondary)
        .lineLimit(2)
    }
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
