var app=angular.module('location');
app.controller('GeoCtrl', function($scope, $cordovaGeolocation) {

  $scope.points = [];

  var posOptions = {timeout: 10000, enableHighAccuracy: false};

  $cordovaGeolocation
    .getCurrentPosition(posOptions)
    .then(function (position) {
      
      var d = new Date(position.timestamp);
      d=d.toTimeString();
      
      // add the initial lat / long
      $scope.points.push({
        "lat":position.coords.latitude, 
        "long":position.coords.longitude, 
        "time":d
      });

    }, function(err) {
      // error
    });
  
  var watchOptions = {
    timeout : 1000,
    enableHighAccuracy: false // may cause errors if true
  };

  var watch = $cordovaGeolocation.watchPosition(watchOptions);
  
  watch.then(
    null,
    function(err) {
      // error
    },
    function(position) {
      
      console.log("updating the position")

      var d = new Date(position.timestamp);
      d=d.toTimeString();

      var point = {
        "lat":position.coords.latitude, 
        "long":position.coords.longitude, 
        "time":d
      };
      $scope.points.push(point);    
  });

  //Background Geolocation

  //function onDeviceReady() {
    console.log("background stuff")
    // Get a reference to the plugin.
    var bgGeo = window.BackgroundGeolocation;

    //Callback executed every time a geolocation is recorded in the background.
    var callbackFn = function(location, taskId) {

        //getting current time
        var d = new Date(location.timestamp);
        d=d.toTimeString();

        var coords = location.coords;
        /*
        $scope.latitude    = coords.latitude;
        $scope.longitude    = coords.longitude;
        console.log($scope.latitude)
        //adding background geolocation to points array
        */
        var point = {
        "lat":coords.latitude,
        "long":coords.longitude, 
        "time":d
      };
      $scope.points.push(point); 
        // Simulate doing some extra work with a bogus setTimeout.  This could perhaps be an Ajax request to your server.
        // The point here is that you must execute bgGeo.finish after all asynchronous operations within the callback are complete.
        setTimeout(function() {
          bgGeo.finish(taskId); // <-- execute #finish when your work in callbackFn is complete
        }, 1000);
    };

    var failureFn = function(error) {
        console.log('BackgroundGeoLocation error');
    }

    // BackgroundGeoLocation is highly configurable.
    bgGeo.configure(callbackFn, failureFn, {

        // Geolocation config
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

        // Application config
        debug: true, // <-- enable this hear sounds for background-geolocation life-cycle.
        forceReloadOnLocationChange: false,  // <-- [Android] If the user closes the app **while location-tracking is started** , reboot app when a new location is recorded (WARNING: possibly distruptive to user) 
        forceReloadOnMotionChange: false,    // <-- [Android] If the user closes the app **while location-tracking is started** , reboot app when device changes stationary-state (stationary->moving or vice-versa) --WARNING: possibly distruptive to user) 
        forceReloadOnGeofence: false,        // <-- [Android] If the user closes the app **while location-tracking is started** , reboot app when a geofence crossing occurs --WARNING: possibly distruptive to user) 
        stopOnTerminate: false,              // <-- [Android] Allow the background-service to run headless when user closes the app.
        startOnBoot: true,                   // <-- [Android] Auto start background-service in headless mode when device is powered-up.
        
    });
 bgGeo.start(); // start background geolocation services
 // }
});
