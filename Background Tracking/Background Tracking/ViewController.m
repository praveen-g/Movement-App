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
    self.locationManager.desiredAccuracy = kCLLocationAccuracyHundredMeters; // 100 m
    self.locationManager.activityType = CLActivityTypeFitness;
    self.locationManager.allowsBackgroundLocationUpdates = YES;
    //[self.locationManager requestAlwaysAuthorization];
    
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
    NSUserDefaults *defaults = [NSUserDefaults standardUserDefaults];
    
    [defaults setObject:self.controller.lat forKey:@"latitude"];
    [defaults setObject:self.controller.lng forKey:@"longitude"];
    [defaults setObject:self.controller.time forKey:@"time"];
    
    [defaults synchronize];
    
    NSLog(@"Data saved");
    
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
    if( UIApplication.sharedApplication.applicationState == UIApplicationStateInactive){
        NSLog(@"App is backgrounded. New location is %@", [locations lastObject]);
        currentLocation = [locations lastObject];
    }
    //Store location values in arrays
    [self.controller.lat addObject:[NSString stringWithFormat:@"%f", currentLocation.coordinate.latitude]];
    [self.controller.lng addObject:[NSString stringWithFormat:@"%f", currentLocation.coordinate.longitude]];
    
    //Store formatted date
    NSDateFormatter *timeFormatter = [[NSDateFormatter alloc]init];
    timeFormatter.dateFormat = @"hh:mm:ss MM-dd-yyyy";
    NSString *dateString = [timeFormatter stringFromDate: currentLocation.timestamp];
    [self.controller.time addObject:[NSString stringWithFormat:@"%@", dateString]];
    
    
}

@end
