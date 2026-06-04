#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(SubstrackWidget, NSObject)

RCT_EXTERN_METHOD(saveWidgetData:(NSString *)payload
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(getWidgetData:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end
