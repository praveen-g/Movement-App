//
//  ViewController.m
//  Background Tracking
//
//  Created by Praveen Gupta on 12/22/15.
//  Copyright © 2015 Praveen Gupta. All rights reserved.
//

#import "ViewController.h"
#import <CoreLocation/CoreLocation.h>
#import "locationPointsViewController.h"

@interface ViewController () <CLLocationManagerDelegate>
@property UIBackgroundTaskIdentifier bgTask;

@property locationPointsViewController *controller;

@end

@implementation ViewController

- (void)viewDidLoad {
    [super viewDidLoad];
    
    //Initializing object for passing values
    self.controller = [[locationPointsViewController alloc]initWithStyle:UITableViewStylePlain];
    
    //Obtaining values from User Defaults if any
    NSUserDefaults *defaults = [NSUserDefaults standardUserDefaults];
    self.controller.lat = [[defaults objectForKey:@"latitude"]mutableCopy];
    self.controller.lng = [[defaults objectForKey:@"longitude"]mutableCopy];
    self.controller.time = [[defaults objectForKey:@"time"]mutableCopy];
    
    //initialize arrays only if UserDefaults are empty
    if( self.controller.lat== nil || self.controller.lng==nil || self.controller.time==nil){
        [self.controller initializeArrays];}
    
    //Initializing Location Object
    self.locationManager = [[CLLocationManager alloc] init];
    self.locationManager.delegate=self;
    self.locationManager.distanceFilter = kCLDistanceFilterNone; // whenever we move
    self.locationManager.desiredAccuracy = kCLLocationAccuracyBest;
    self.locationManager.activityType = CLActivityTypeFitness;
    self.locationManager.allowsBackgroundLocationUpdates = YES;
    [self.locationManager requestAlwaysAuthorization];
    
    [self.locationManager startUpdatingLocation];
    
}

- (void)didReceiveMemoryWarning {
    [super didReceiveMemoryWarning];
    // Dispose of any resources that can be recreated.
}
- (IBAction)disableLocationServices:(id)sender {
    if ([sender isOn]){
        [self.locationManager startUpdatingLocation];
    }
    else{
        [self.locationManager stopUpdatingLocation];
    }
}

- (IBAction)showLocation:(id)sender {;
    //Store location points
        //Call TableViewController
    [self.navigationController pushViewController:self.controller animated:YES];
    
}

#pragma mark CLLocationManagerDelegate Methods

-(void)locationManager:(CLLocationManager *)manager didFailWithError:(nonnull NSError *)error{
    
    NSLog(@"Error: %@", error);
    NSLog(@"Failed to get location");
}


-(void)locationManager:(CLLocationManager *)manager didUpdateLocations:(NSArray<CLLocation *> *)locations{
    //Get the last object stored in array
    CLLocation *currentLocation = [locations lastObject];
    if( UIApplication.sharedApplication.applicationState == UIApplicationStateInactive || UIApplication.sharedApplication.applicationState == UIApplicationStateBackground){
        
        NSLog(@"App is backgrounded. New location is %@", [locations lastObject]);
    }
    else{
        
    }
    [self saveLocations:currentLocation];
}

-(void)saveLocations:(CLLocation*)locations{
    //Store location values in arrays
    NSString *latitude= [NSString stringWithFormat:@"%f", locations.coordinate.latitude];
    NSString *longitude = [NSString stringWithFormat:@"%f", locations.coordinate.longitude];
    [self.controller.lat insertObject:latitude atIndex:0];
    [self.controller.lng insertObject:longitude atIndex:0];
    
    //Store formatted date
    NSDateFormatter *timeFormatter = [[NSDateFormatter alloc]init];
    timeFormatter.dateFormat = @"hh:mm:ss MM-dd-yyyy";
    NSString *dateString = [timeFormatter stringFromDate: locations.timestamp];
    [self.controller.time insertObject:[NSString stringWithFormat:@"%@", dateString] atIndex:0];
    [self convert:dateString To:longitude JSON:latitude];
    
    NSUserDefaults *defaults = [NSUserDefaults standardUserDefaults];
    
    [defaults setObject:self.controller.lat forKey:@"latitude"];
    [defaults setObject:self.controller.lng forKey:@"longitude"];
    [defaults setObject:self.controller.time forKey:@"time"];
    
    [defaults synchronize];
    
    NSLog(@"Data saved");
}

-(void)convert:(NSString*)time To:(NSString*)longitude JSON:(NSString*)latitude{
    
    NSString *jsonString = @"{\"Location Points\":[";
    jsonString = [[jsonString stringByAppendingString:@"{\"Timestamp\":\"" ]stringByAppendingString:time];
    jsonString = [[jsonString stringByAppendingString:@"\",\"Latitude\":\""]stringByAppendingString: latitude];
    jsonString = [[jsonString stringByAppendingString: @"\",\"Longitude\":\""]stringByAppendingString:longitude];
    jsonString = [ jsonString stringByAppendingString:@"\"}"];
    jsonString = [jsonString stringByAppendingString:@"]}"];
    NSData *data = [jsonString dataUsingEncoding:NSUTF8StringEncoding];
    id json = [NSJSONSerialization JSONObjectWithData:data options:0 error:nil];
    NSLog(@"%@", json);
}
@end
