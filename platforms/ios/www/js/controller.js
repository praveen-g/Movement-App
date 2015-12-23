var app=angular.module('location');

app.controller('GeoCtrl', function($scope, $cordovaGeolocation, $cordovaBackgroundGeolocation, $ionicPlatform)
{ 

  $scope.points = [];

  //function to convert timestamp to hours
  var updateTime = function(timestamp){
    var d = new Date(timestamp);
      d=d.toTimeString();
      return d;
  };

  //store values in array
  var storePositionValues = function(lat,lng,time){
    $scope.points.push({
      "lat": lat,
      "long": lng, 
      "time": time
    });
  };

  //get current GeoLocation
  var posOptions = {timeout: 10000, enableHighAccuracy: false};

  $cordovaGeolocation
    .getCurrentPosition(posOptions)
    .then(function (position) {
      // add the initial lat / long
      storePositionValues(position.coords.latitude,position.coords.longitude,updateTime(position.timestamp));
    }, function(err) {
      // error
    });
  
  //update GeoLocation on change in value
  var watchOptions = {
    timeout : 5000,
    enableHighAccuracy: false // may cause errors if true
  };

  var watch = $cordovaGeolocation.watchPosition(watchOptions);
  
  watch.then(
    null,
    function(err) {
      // error
    },
    function(position) {
      storePositionValues(position.coords.latitude,position.coords.longitude,updateTime(position.timestamp));
    });

  //storing configurations for background locations
  var options= {
    desiredAccuracy: 0, 
    stationaryRadius: 0,
    distanceFilter: 50, //minimum distance (in meters) mived before distance is recorded
    disableElasticity: false, // Used to return locations every 1 km at high speeds
    locationUpdateInterval: 5000, //the minimum interval after which the location will get updated
    minimumActivityRecognitionConfidence: 80,   // 0-100%.  Minimum activity-confidence for a state-change 
    fastestLocationUpdateInterval: 5000,
    activityRecognitionInterval: 5000, // recognises activity every 5 seconds. Increase to improve battery life
    stopDetectionDelay: 1,  // Wait x minutes to engage stop-detection system
    stopTimeout: 2,  // Wait 2 miutes to turn off location system after stop-detection
    activityType: 'Fitness', // set to Fitness for pedestrian related activity
    debug: true, // <-- enable this hear sounds for background-geolocation life-cycle.
    forceReloadOnLocationChange: false,  // <-- [Android] If the user closes the app **while location-tracking is started** , reboot app when a new location is recorded (WARNING: possibly distruptive to user) 
    forceReloadOnMotionChange: false,    // <-- [Android] If the user closes the app **while location-tracking is started** , reboot app when device changes stationary-state (stationary->moving or vice-versa) --WARNING: possibly distruptive to user) 
    forceReloadOnGeofence: false,        // <-- [Android] If the user closes the app **while location-tracking is started** , reboot app when a geofence crossing occurs --WARNING: possibly distruptive to user) 
    stopOnTerminate: false,              // <-- [Android] Allow the background-service to run headless when user closes the app.
    startOnBoot: true,  
  };
  
  document.addEventListener("deviceready", function (){

    cordova.plugins.backgroundMode.enable();

    cordova.plugins.backgroundMode.onactivate = function() {

      //test if Background geolocation working
      var callbackFn = function(location) {
        console.log('[BackgroundGeoLocation] Update callback:  ' + location.latitude + ',' + location.longitude);
        storePositionValues(location.coords.latitude,location.coords.longitude,updateTime(location.timestamp));
      };

      var failureFn = function(error) {
        console.log('[BackgroundGeoLocation] Error: '+error);
      };

      $cordovaBackgroundGeolocation.configure(callbackFn, failureFn, options);

      //turn on Background Geolocation
      $cordovaBackgroundGeolocation.start();

    }
    /*
        window.setTimeout(function() {
          // disable application if we're still in background after 1 minute
          cordova.plugins.backgroundMode.disable();
        }, 60 *1000);
      };
    */
   
  });
});




