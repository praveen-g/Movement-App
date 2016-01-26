var app=angular.module('location');

app.controller('GeoCtrl', function($scope, $cordovaGeolocation, $cordovaBackgroundGeolocation, $ionicPlatform, $cordovaDevice, $http, $state, $window, $ionicPopup)
{ 
  //obtaining data from local storage if present

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
          "deviceId":$cordovaDevice.getUUID(),
          //"deviceId": 2345678,
          "lat":lat,
          "llong":lng,
          "time":time       
      });
  };

  //store values in array
  var storePositionValues = function(lat,lng,time,speed){
    
    //speed is in meters per second.
    if (speed<=2) {

      if ($scope.temporaryPoints.length==0){
          recordPositonValues(lat,lng,time);
          console.log("Initial logging")
      }
      else{
          console.log($scope.temporaryPoints)
          var lastLocation = $scope.temporaryPoints[0] // get the last recorded location

          //check if user is in same location
          if((lat.toFixed(4)-lastLocation.lat.toFixed(4))<0.2 && (lng.toFixed(4)-lastLocation.llong.toFixed(4))<0.2){

              console.log("Same location")
              console.log(time.timestamp)
              console.log(lastLocation.time.timestamp)
              //compute time difference. Store locations only if more than 5 minutes
              if((time.timestamp- lastLocation.time.timestamp) > 5*60*1000){

                  console.log("time is more than 5 min")
                  $scope.temporaryPoints=[]
                  recordPositonValues(lat,lng,time);

                  $http({
                    url: "http://54.152.112.50:3000/locations/translate/",
                    method: 'POST',
                    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                    transformRequest: function(obj) {
                         var str = [];
                         for(var p in obj)
                         str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
                         return str.join("&");
                     },
                     data:{"lat":lat,"lng":lng}
                    //data: {"lat":40.782905,"lng":-73.965350}
                  })
                  .then(function(res){
                    console.log("Obtaining venues")
                    console.log("translating")
                    newVenue=res.data[0]
                    $scope.venue= JSON.parse(window.localStorage.getItem("venues"))|| [];
                    if ($scope.venue.length ==0){
                      console.log("Venue stored")
                      $scope.venue=res.data
                      window.localStorage.setItem("venues",JSON.stringify($scope.venue))
                    }
                    else if(res.data[0].foursquare_id != $scope.venue[$scope.venue.length-1].foursquare_id){

                      $http({
                        url: "http://54.152.112.50:3000/locations/log/",
                        method: 'POST',
                        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                        transformRequest: function(obj) {
                             var str = [];
                             for(var p in obj)
                             str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
                             return str.join("&");
                         },
                        data: {"venueId":$scope.venue[$scope.venue.length-1].foursquare_id}
                        })
                        .then(function(res){
                          console.log("Logging")
                          $scope.venue.push(newVenue)
                          window.localStorage.setItem("venues",JSON.stringify($scope.venue))
                          console.log("logging successful")
                        })

                        .catch(function(err){
                        console.log(err)
                        });    
                    }
                  })
                .catch(function(err){
                  console.log(err)
                });
              }       
              }
          //if user is in different location, record the next location
          else{
            console.log("different location")
            $scope.temporaryPoints=[]
              recordPositonValues(lat,lng,time);
          }
      }      
  }

  window.localStorage.setItem("temporaryPoints", JSON.stringify($scope.temporaryPoints));
  };
 
  //get current GeoLocation
  var posOptions = {
    timeout: 10000, 
    enableHighAccuracy: false
  };

  $cordovaGeolocation
    .getCurrentPosition(posOptions)
    .then(function (position) {
      // add the initial lat / long
      storePositionValues(position.coords.latitude,position.coords.longitude,updateTime(position.timestamp),position.coords.speed);
    }, function(err) {
      // error
      console.log(err)
      if (err.code == 1){
        $window.alert("Please enable location tracking")
      }
      else if (err.code == 2){
        $window.alert("Please connect to the Internet")
      }
      else{
        $window.alert("Refresh required")
      }
      console.log(err)
    });
  
  //update GeoLocation on change in value
  var watchOptions = {
    timeout : 10000,
    enableHighAccuracy: false // may cause errors if true
  };

  var watch = $cordovaGeolocation.watchPosition(watchOptions);
  
  watch.then(
    null,
    function(err) {
      if (err.code == 1){
        $window.alert("Please enable location tracking")
      }
      else if (err.code == 2){
        $window.alert("Please connect to the Internet")
      }
      else{
        $window.alert("Refresh required")
      }
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



  // venue stuff


  $scope.activity= [{"venue":"Updates will appear here. Stay tuned!"}];
  $scope.visitor=[]

  $scope.venue = JSON.parse(window.localStorage.getItem("venues"))|| [];
  $scope.map=[]
  var centers=[]

  if ($scope.venue.length == 0){
    $state.go('tab.venueDefault')
    console.log("condition fulfilled")
  }
  else{
    $state.go('tab.venue')
  }

  var renderMap= function(obj){

    var latLng = new google.maps.LatLng( obj.lat, obj.lng);
    
    var mapOptions = {
        center: latLng,
        zoom: 15,
        mapTypeId: google.maps.MapTypeId.ROADMAP
      };
    display_map= new google.maps.Map(document.getElementById("map"+obj.foursquare_id), mapOptions)
     $scope.map.push(display_map)
 
    var marker = new google.maps.Marker({
        setMap: display_map,
        //animation: google.maps.Animation.DROP,
        position: latLng
    });      
    console.log(marker)
  }


  $scope.refresh=function(){

    $scope.venue= 
    angular.forEach($scope.venue, function(value, key){

     renderMap(value)
      
      var locationId = value.foursquare_id
      var callBaseURL = "http://54.152.112.50:3000/locations/revealedusers?locationId="
      
      $http({
        url: callBaseURL+locationId,
        method: 'GET',
        contentType: 'application/json',
        //headers: { 'Authorization': 'Bearer TOKEN' }
      }).then(function(res){
        
        value.totalReveals = res.data.length;
        console.log(value.totalReveals)

    })
    .catch(function(err){
      console.log(err)
    });     
    
    });
    window.localStorage.setItem("venues", JSON.stringify($scope.venue));
 } 

//   var mapLoad="True"
//   if (mapLoad=="True"){
//     var loadMaps = $interval($scope.refresh(),)
//     console.log(loadMaps)
//     mapLoad="False"
// }
  //  var getNames= function(names){
  //   $scope.visitorNames.push({"name":names})
  //   window.localStorage.setItem("visitorNames", JSON.stringify($scope.visitorNames));
  //  }


  // var renderActivity= function(visitors){
        
  //       angular.forEach(visitors, function(value,key){
  //         $http({
  //           url:"http://eb2dfa2b.ngrok.io/users/userinfo?deviceId="+value.userDeviceId,
  //           method: 'GET',
  //           contentType:'application/json'
  //         }).then(function(res){

  //           getNames(res.data[0].fullName)

  //         }).catch(function(err){
  //             console.log(err)
  //         })
  //         console.log($scope.visitorNames)
  //       })
        
  //       //console.log($scope.visitorNames)
  //       if($scope.visitorNames.length>0){
  //             $state.go('tab.activity')
  //           }
  //     };       

  var getUserDevices = function(locationId){

         $http({
          url:"http://54.152.112.50:3000/locations/revealedusers?locationId="+locationId,
          method: 'GET',
          contentType: 'application/json'
         }).then(function(res){
          
            $scope.data=res.data

         }).catch(function(err){
            console.log(err)
         })
      }

  $scope.reveal= function(locationId){

    $scope.revealedLocations = JSON.parse(window.localStorage.getItem("revealedLocations"))|| [];
    window.localStorage.setItem("visitorNames", JSON.stringify($scope.visitorNames));
    var callPopup="True"
    var keepGoing="True"

    angular.forEach($scope.revealedLocations, function(value,key){

      if(keepGoing=="True"){
        if (locationId==value){
          getUserDevices(locationId)
          callPopup="False"
          $scope.visitorNames=JSON.parse(window.localStorage.getItem("visitorNames"))|| ["Updates will appear soon!"];
          console.log($scope.visitorNames)
          keepGoing="False"
        }
      }
    })

    if(callPopup=="True"){
        var confirmPopup = $ionicPopup.confirm({

          title: 'Do you want to reveal your identity',

          template: "See visitors allows you to reveal your identity to other people who have also visited this venue.<br> Your identity will only be visible to other people who choose to reveal their identity.<br> Do you want to continue?",

          cancelText:"Don't Allow",

       });

       confirmPopup.then(function(res) {

          if (res) {
            getUserDevices(locationId)
            $scope.revealedLocations.push(locationId)
            window.localStorage.setItem("revealedLocations", JSON.stringify($scope.revealedLocations));
            $scope.visitorNames=JSON.parse(window.localStorage.getItem("visitorNames"))|| ["Updates will appear soon!"];
            console.log($scope.visitorNames)
          } else {

             console.log('You clicked on "Cancel" button');

          }
      });
     }      
   };

    }
  });
});

app.controller('NavCtrl', function($scope, $state, $ionicPlatform, $cordovaDevice, $http){

  $scope.reg= JSON.parse(window.localStorage.getItem("Registered")) || {"value":"False"}
  $scope.venue = JSON.parse(window.localStorage.getItem("venues"))|| [];
  $scope.register = function(){

    if ($scope.reg["value"] == "False"){
      $state.go("register");
    }
    else{
      if ($scope.venue.total==0){
        $state.go('tab.venue.default')
       }
      else{
        $state.go('tab.venue')
      }
    }
  }
  $scope.welcome= function(){
    $state.go("welcome");
  }
  $scope.tab_dash=function(user){

    $scope.userDetails={
      "fullname": user.name,
      "emailId":user.email,
      //"deviceId": 2345678
      "deviceId": $cordovaDevice.getUUID()
    };

    //post user name, user email and device id to the server
    $http({
      url: "http://54.152.112.50:3000/users/register/",
      method: 'POST',
      headers: {'Content-Type': 'application/x-www-form-urlencoded'},
          transformRequest: function(obj) {
           var str = [];
           for(var p in obj)
           str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
           return str.join("&");
      },
      data: $scope.userDetails
    })
      .then(function(res){
        console.log(res)
        console.log($scope.userDetails)
        if(res.data.status=="success"){
        $scope.reg.value="True"
        window.localStorage.setItem("Registered", JSON.stringify($scope.reg));
        console.log("Login Successful")
      if ($scope.venue.total==0){
        $state.go('tab.venue.default')
       }
      else{
        $state.go('tab.venue')
      }
    }

    })
     .catch(function(err){
      console.log(err)
    });

  }

});
