//
//  AppDelegate.m
//  Background Tracking
//
//  Created by Praveen Gupta on 12/22/15.
//  Copyright © 2015 Praveen Gupta. All rights reserved.
//

#import "AppDelegate.h"
#import <CoreLocation/CoreLocation.h>
@interface AppDelegate ()
@property CLLocationManager *backgroundLocationManager ;
@end

@implementation AppDelegate


- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions {
    [self locationSpecifications];
    if ([launchOptions objectForKey:UIApplicationLaunchOptionsLocationKey]) {
        
        UIAlertView * alert;
        
        //We have to make sure that the Background app Refresh is enabled for the Location updates to work in the background.
        if([[UIApplication sharedApplication] backgroundRefreshStatus] == UIBackgroundRefreshStatusDenied)
        {
            
            // The user explicitly disabled the background services for this app or for the whole system.
            
            alert = [[UIAlertView alloc]initWithTitle:@""
                                              message:@"The app doesn't work without the Background app Refresh enabled. To turn it on, go to Settings > General > Background app Refresh"
                                             delegate:nil
                                    cancelButtonTitle:@"Ok"
                                    otherButtonTitles:nil, nil];
            [alert show];
            
        } else if([[UIApplication sharedApplication] backgroundRefreshStatus] == UIBackgroundRefreshStatusRestricted)
        {
            
            // Background services are disabled and the user cannot turn them on.
            // May occur when the device is restricted under parental control.
            alert = [[UIAlertView alloc]initWithTitle:@""
                                              message:@"The functions of this app are limited because the Background app Refresh is disable."
                                             delegate:nil
                                    cancelButtonTitle:@"Ok"
                                    otherButtonTitles:nil, nil];
            [alert show];
            
        } else
        {
            
            [self.backgroundLocationManager startMonitoringSignificantLocationChanges];
        }
    }
    return YES;
}

-(void) locationSpecifications{
    self.backgroundLocationManager = [[CLLocationManager alloc]init];
    self.backgroundLocationManager = [[CLLocationManager alloc]init];
    self.backgroundLocationManager.delegate = self;
    self.backgroundLocationManager.desiredAccuracy = kCLLocationAccuracyBest;
    self.backgroundLocationManager.activityType = CLActivityTypeFitness;
    [self.backgroundLocationManager requestWhenInUseAuthorization];
    
}
- (void)applicationWillResignActive:(UIApplication *)application {
    // Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.

}

- (void)applicationDidEnterBackground:(UIApplication *)application {
    // Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore your application to its current state in case it is terminated later.
    // If your application supports background execution, this method is called instead of applicationWillTerminate: when the user quits.
    
}

- (void)applicationWillEnterForeground:(UIApplication *)application {
    // Called as part of the transition from the background to the inactive state; here you can undo many of the changes made on entering the background.
}

- (void)applicationDidBecomeActive:(UIApplication *)application {
    // Restart any tasks that were paused (or not yet started) while the application was inactive. If the application was previously in the background, optionally refresh the user interface.
    
}

- (void)applicationWillTerminate:(UIApplication *)application {
    // Called when the application is about to terminate. Save data if appropriate. See also applicationDidEnterBackground:.
    }

@end
