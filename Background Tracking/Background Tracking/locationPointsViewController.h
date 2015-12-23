//
//  locationPoints.h
//  Background Tracking
//
//  Created by Praveen Gupta on 12/22/15.
//  Copyright © 2015 Praveen Gupta. All rights reserved.
//

#import <UIKit/UIKit.h>

@interface locationPointsViewController : UITableViewController
@property(nonatomic,strong) NSMutableArray *lat;
@property(nonatomic,strong) NSMutableArray *lng;
@property (nonatomic,strong) NSMutableArray *time;
-(void) initializeArrays;
@end
