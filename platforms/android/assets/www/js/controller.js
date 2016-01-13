var app=angular.module('location');

app.controller('GeoCtrl', function($scope, $cordovaGeolocation, $cordovaBackgroundGeolocation, $ionicPlatform)
{ 
  //obtaining data from local storage if present
  $scope.points = JSON.parse(window.localStorage.getItem("locationPoints"))|| [];
  //$scope.address=JSON.parse(window.localStorage.getItem("locationAddresses"))|| [];
  $scope.temporaryPoints = JSON.parse(window.localStorage.getItem("temporaryPoints"))|| [];

  //function to convert timestamp to hours
  var updateTime = function(timestamp){
    var d = new Date(timestamp);
      var date = (d.getMonth()+1)+'/'+d.getDate()+ '/' +d.getFullYear()
      var time = ('0' + d.getHours()).slice(-2)+':'+('0' + d.getMinutes()).slice(-2)+':'+('0' + d.getSeconds()).slice(-2)
      return {"time":time, "date":date, "timestamp":timestamp};
  };

  var recordPositonValues = function(lat,lng,time){
    //store location values before processing
    $scope.temporaryPoints.push({
          "latitude":lat,
          "longitude":lng,
          "time":time
      });
  }

  //store values in array
  var storePositionValues = function(lat,lng,time,speed){
    console.log($scope.points.length);
  console.log($scope.temporaryPoints.length);

    //speed is in meters per second.
    if (speed<=5) {

      if ($scope.temporaryPoints.length==0){
          recordPositonValues(lat,lng,time);
      }
      else{
          console.log($scope.temporaryPoints);
          console.log($scope.temporaryPoints.length);
          var lastLocation = $scope.temporaryPoints[$scope.temporaryPoints.length -1] // get the last recorded location

          //check if user is in same location
          if(lat.toFixed(4)==lastLocation.latitude.toFixed(4) && lng.toFixed(4)==lastLocation.longitude.toFixed(4)){

              //compute time difference. Store locations only if more than 5 minutes
              if((time.timestamp- lastLocation.time.timestamp) > 5*60*1000){

                  $scope.points.push(
                  {
                    "latitude":lat,
                    "longitude":lng,
                    "time":time
                  });
              }
          }

          //if user is in different location, record the next location
          else{
              recordPositonValues(lat,lng,time);
          }
      }

      
  }

  //reverse geocoding
  //ReverseGeocode(lat,lng,time,speed);

  // update local storage
  window.localStorage.setItem("locationPoints",JSON.stringify($scope.points));
  window.localStorage.setItem("temporaryPoints",JSON.stringify($scope.temporaryPoints));
  console.log($scope.points);
  console.log($scope.temporaryPoints);
  };
  
  /*
  // reverse geocoding
  function ReverseGeocode(latitude, longitude,time,speed){
    var reverseGeocoder = new google.maps.Geocoder();
    var currentPosition = new google.maps.LatLng(latitude, longitude);
    reverseGeocoder.geocode({'latLng': currentPosition}, function(results, status) {
 
            if (status == google.maps.GeocoderStatus.OK) {
                    if (results[0]) {

                      $scope.address.push({
                          "location":results[0].formatted_address,
                          "timestamp":time
                      });
                    window.localStorage.setItem("locationAddresses",JSON.stringify($scope.address));
                    console.log('Address : ' + results[0].formatted_address + ',' + 'Type : ' + results[0].types);
                    }
            else {
                    console.log('Unable to detect your address.');
                    }
        } else {
            console.log('Unable to detect your address.');
        }
    });
  }
  */

  //get current GeoLocation
  var posOptions = {
    timeout: 10000, 
    enableHighAccuracy: true
  };

  $cordovaGeolocation
    .getCurrentPosition(posOptions)
    .then(function (position) {
      // add the initial lat / long
      storePositionValues(position.coords.latitude,position.coords.longitude,updateTime(position.timestamp),position.coords.speed);
    }, function(err) {
      // error
      console.log(err)
    });
  
  //update GeoLocation on change in value
  var watchOptions = {
    timeout : 5000,
    enableHighAccuracy: true // may cause errors if true
  };

  var watch = $cordovaGeolocation.watchPosition(watchOptions);
  
  watch.then(
    null,
    function(err) {
      // error
    },
    function(position) {
      storePositionValues(position.coords.latitude,position.coords.longitude,updateTime(position.timestamp),position.coords.speed);
    });

  //storing configurations for background locations
  var options= {
    desiredAccuracy: 0, 
    stationaryRadius: 0,
    distanceFilter: 50, //minimum distance (in meters) mived before distance is recorded
    disableElasticity: false, // Used to return locations every 1 km at high speeds
    locationUpdateInterval: 1000*60*10, //update location every 10 minutes
    minimumActivityRecognitionConfidence: 80,   // 0-100%.  Minimum activity-confidence for a state-change 
    fastestLocationUpdateInterval: 5000,
    activityRecognitionInterval: 5000, // recognises activity every 5 seconds. Increase to improve battery life
    stopDetectionDelay: 1,  // Wait x minutes to engage stop-detection system
    stopTimeout: 2,  // Wait 2 miutes to turn off location system after stop-detection
    activityType: 'Fitness', // set to Fitness for pedestrian related activity
    debug: true, // <-- enable this hear sounds for background-geolocation life-cycle.
    //forceReloadOnLocationChange: false,  // <-- [Android] If the user closes the app **while location-tracking is started** , reboot app when a new location is recorded (WARNING: possibly distruptive to user) 
    //forceReloadOnMotionChange: false,    // <-- [Android] If the user closes the app **while location-tracking is started** , reboot app when device changes stationary-state (stationary->moving or vice-versa) --WARNING: possibly distruptive to user) 
    //forceReloadOnGeofence: false,        // <-- [Android] If the user closes the app **while location-tracking is started** , reboot app when a geofence crossing occurs --WARNING: possibly distruptive to user) 
    stopOnTerminate: false,              // <-- [Android] Allow the background-service to run headless when user closes the app.
    startOnBoot: true,  
  };
  
  document.addEventListener("deviceready", function (){

    cordova.plugins.backgroundMode.enable();

    cordova.plugins.backgroundMode.onactivate = function() {

      //test if Background geolocation working
      var callbackFn = function(location) {
        console.log('[BackgroundGeoLocation] Update callback:  ' + location.latitude + ',' + location.longitude);
        storePositionValues(location.coords.latitude,location.coords.longitude,updateTime(location.timestamp),position.coords.speed);
      };

      var failureFn = function(error) {
        console.log('[BackgroundGeoLocation] Error: '+error);
      };

      $cordovaBackgroundGeolocation.configure(callbackFn, failureFn, options);

      //turn on Background Geolocation
      $cordovaBackgroundGeolocation.start();

    }
  });
});



