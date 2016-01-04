//
//  ViewController.h
//  Background Tracking
//
//  Created by Praveen Gupta on 12/22/15.
//  Copyright © 2015 Praveen Gupta. All rights reserved.
//

#import <UIKit/UIKit.h>
#import <CoreLocation/CoreLocation.h>
@interface ViewController : UIViewController

@property(nonatomic) CLLocationManager *locationManager;
-(void)saveLocations:(CLLocation*)locations;
-(void)convert:(NSString*)time To:(NSString*)longitude JSON:(NSString*)latitude;
@end

