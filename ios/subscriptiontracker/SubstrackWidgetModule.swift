import Foundation
import React
import WidgetKit

@objc(SubstrackWidget)
class SubstrackWidget: NSObject {
  private let appGroupIdentifier = "group.com.barisgunduz.substrack"
  private let widgetDataKey = "upcomingWidgetData"

  @objc
  static func requiresMainQueueSetup() -> Bool {
    false
  }

  @objc(saveWidgetData:resolver:rejecter:)
  func saveWidgetData(
    _ payload: String,
    resolver resolve: RCTPromiseResolveBlock,
    rejecter reject: RCTPromiseRejectBlock
  ) {
    guard let defaults = UserDefaults(suiteName: appGroupIdentifier) else {
      reject("ERR_WIDGET_APP_GROUP", "Unable to open widget app group storage.", nil)
      return
    }

    defaults.set(payload, forKey: widgetDataKey)
    defaults.synchronize()

    if #available(iOS 14.0, *) {
      WidgetCenter.shared.reloadTimelines(ofKind: "UpcomingPaymentsWidget")
    }

    resolve(nil)
  }

  @objc(getWidgetData:rejecter:)
  func getWidgetData(
    resolver resolve: RCTPromiseResolveBlock,
    rejecter reject: RCTPromiseRejectBlock
  ) {
    guard let defaults = UserDefaults(suiteName: appGroupIdentifier) else {
      reject("ERR_WIDGET_APP_GROUP", "Unable to open widget app group storage.", nil)
      return
    }

    resolve(defaults.string(forKey: widgetDataKey))
  }
}
