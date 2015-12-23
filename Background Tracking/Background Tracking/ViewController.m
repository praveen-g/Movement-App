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
    [self.controller initializeArrays];
    
    self.locationManager = [[CLLocationManager alloc] init];
    self.locationManager.delegate=self;
    self.locationManager.distanceFilter = kCLDistanceFilterNone; // whenever we move
    self.locationManager.desiredAccuracy = kCLLocationAccuracyHundredMeters; // 100 m
    [self.locationManager requestWhenInUseAuthorization];
    //self.locationManager.allowsBackgroundLocationUpdates = YES;
    [self.locationManager startUpdatingLocation];
    
}

- (void)didReceiveMemoryWarning {
    [super didReceiveMemoryWarning];
    // Dispose of any resources that can be recreated.
}

- (IBAction)showLocation:(id)sender {;
    [self.navigationController pushViewController:self.controller animated:YES];
        //[self.view.window.rootViewController presentViewController:self.controller animated:YES completion:nil];
}

#pragma mark CLLocationManagerDelegate Methods

-(void)locationManager:(CLLocationManager *)manager didFailWithError:(nonnull NSError *)error{
    
    NSLog(@"Error: %@", error);
    NSLog(@"Failed to get location");
}


-(void)locationManager:(CLLocationManager *)manager didUpdateLocations:(NSArray<CLLocation *> *)locations{
    //Get the last object stored in array
    CLLocation *currentLocation = [locations lastObject];
    
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
