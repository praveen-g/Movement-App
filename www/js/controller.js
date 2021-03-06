var app=angular.module('location');

app.filter('reverse', function() {
  return function(items) {
    return items.slice().reverse();
  };
});

app.controller('GeoCtrl', function($scope, $cordovaGeolocation, $cordovaBackgroundGeolocation, $ionicPlatform, $cordovaDevice, $http, $state, $ionicPopup)
{
  $scope.toggleButton=true
  //obtaining data from local storage if present
  $scope.temporaryPoints = JSON.parse(window.localStorage.getItem("temporaryPoints"))|| [];
  $scope.venue = JSON.parse(window.localStorage.getItem("venues"))|| [];
  $scope.activity=JSON.parse(window.localStorage.getItem("activity"))|| [{"message":"Refresh for recent activity!"}];
  
  //function to convert timestamp to hours
  var updateTime = function(timestamp){
    var d = new Date(timestamp);
    var date = (d.getMonth()+1)+'/'+d.getDate()+ '/' +d.getFullYear()
    var time = ('0' + d.getHours()).slice(-2)+':'+('0' + d.getMinutes()).slice(-2)+':'+('0' + d.getSeconds()).slice(-2)
    return {"time":time, "date":date, "timestamp":timestamp};
  };

  //record Temporary Points
  var recordPositonValues = function(lat,lng,time){
    //store location values before processing
    $scope.temporaryPoints.push({
      "deviceId":$cordovaDevice.getUUID(),
      "lat":lat,
      "llong":lng,
      "time":time       
    });
  };

  //filter location points to store
  var storePositionValues = function(lat,lng,time,speed){
    
    //speed is in meters per second.
    if (speed<=2) {
      //record first point
      if ($scope.temporaryPoints.length==0){
        recordPositonValues(lat,lng,time);
      }
      else{
        var lastLocation = $scope.temporaryPoints[0] // get the latest recorded location

        //check if user is in same location
        if((lat.toFixed(4)-lastLocation.lat.toFixed(4))<0.2 && (lng.toFixed(4)-lastLocation.llong.toFixed(4))<0.2){
          console.log(time)
          //compute time difference. Store locations only if more than 5 minutes
          if((time.timestamp- lastLocation.time.timestamp) > 5*60*1000){

            $scope.temporaryPoints=[]
            recordPositonValues(lat,lng,time);

            //transale locations to venues
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
            })
            .then(function(res){
              var present=0
              newVenue=res.data[0]
              console.log("translating")

              //store first venue recorded so that first venue is not null
              if ($scope.venue.length ==0){
                console.log("Venue stored")
                newVenue.flag="0" // set value flag to acocunt for revealed locatons

                //get number of revealed users 
                $http({
                  url: "http://54.152.112.50:3000/locations/revealedusers?locationId="+newVenue.foursquare_id,
                  method: 'GET',
                  contentType: 'application/json',
                  //headers: { 'Authorization': 'Bearer TOKEN' }
                }).then(function(res){
                  newVenue.totalReveals = res.data.length;
                })
                $scope.venue=[newVenue]
                window.localStorage.setItem("venues",JSON.stringify($scope.venue))
                //renderMap(newVenue)
              }
              else{
                //check if venue logged
                angular.forEach($scope.venue, function(value,key){
                  if (value.foursquare_id == newVenue.foursquare_id){ // check against current location points only
                    present=1 // check if venue already present
                  }
                });
                //log venue in server if user is at new venue
                if (present==0){
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
                    data: {"venueId":newVenue.foursquare_id}
                  })
                  .then(function(res){
                    console.log("Successfully logged")
                    newVenue.flag="0"
                    //get number of revealed users 
                    $http({
                      url: "http://54.152.112.50:3000/locations/revealedusers?locationId="+newVenue.foursquare_id,
                      method: 'GET',
                      contentType: 'application/json',
                    }).then(function(res){
                      newVenue.totalReveals = res.data.length;
                      console.log(newVenue)
                    })
                    console.log(newVenue)
                    $scope.venue.push(newVenue)
                    console.log($scope.venue)
                    window.localStorage.setItem("venues",JSON.stringify($scope.venue))
                    console.log(JSON.parse(window.localStorage.getItem("venues")))
                    //renderMap(newVenue)
                    
                  })
                  .catch(function(err){
                    console.log(err)
                  });    
                }
              }
            })
            .catch(function(err){
              console.log(err)
            });
          }       
        }
        //if user is in different location, record next temporary point
        else{
          console.log("different location")
          $scope.temporaryPoints=[]
          recordPositonValues(lat,lng,time);
        };
      };      
    }
    window.localStorage.setItem("temporaryPoints", JSON.stringify($scope.temporaryPoints));
  };

  //get current GeoLocation
  var posOptions = {
    frequency: 15000,
    timeout: 10000, 
    enableHighAccuracy: false
  };

  //function to ask for location permissions
  $cordovaGeolocation
    .getCurrentPosition(posOptions)
    .then(function (position) {
      // add the initial lat / long
      storePositionValues(position.coords.latitude,position.coords.longitude,updateTime(position.timestamp),position.coords.speed);
    }, function(err) {
      // error
      console.log(err)
      if (err.code == 1){
        window.alert("Please enable location tracking")
      }
      else if (err.code == 2){
    
        window.alert("Could not acquire location")
      }
      else{
        //$window.alert("Location timed out")
      }
      console.log(err)
    });

  //update GeoLocation on change in value
  var watchOptions = {
    frequency : 15000,
    timeout : 10000,
    enableHighAccuracy: false // may cause errors if true
  };

  var watch = $cordovaGeolocation.watchPosition(watchOptions);
  
  watch.then(null, function(err) {
    if (err.code == 1){
      window.alert("Please enable location tracking")
    }
    else if (err.code == 2){
      window.alert("Could not acquire location")
    }
    else{
      //$window.alert("Location timed out")
    }
  },
  function(position) {
    storePositionValues(position.coords.latitude,position.coords.longitude,updateTime(position.timestamp),position.coords.speed);
  });

  //storing configurations for background locations
  var options= {
    desiredAccuracy: 0, 
    stationaryRadius: 0,
    distanceFilter: 50, //minimum distance (in meters) moved before distance is recorded
    disableElasticity: true, // Used to return locations every 1 km at high speeds
    locationUpdateInterval: 1000*60*5, //update location every 20 minutes
    minimumActivityRecognitionConfidence: 80,   // 0-100%.  Minimum activity-confidence for a state-change 
    fastestLocationUpdateInterval: 5* 60* 1000,
    activityRecognitionInterval: 5*60*1000, // recognises activity every 5 minutes. Increase to improve battery life
    stopDetectionDelay: 15,  // Wait x minutes to engage stop-detection system
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

      if ($scope.toggleButton==true){
        //turn on Background Geolocation
        $cordovaBackgroundGeolocation.start();
      }
      else if ($scope.toggleButton==false){
        $cordovaBackgroundGeolocation.stop();
      }
    }
    
  });

  //activity tab functions


  $scope.refresh_activityTab= function(){
    //get list of previous activities
    $scope.activity=JSON.parse(window.localStorage.getItem("activity"))|| [];

    //get timestamp of last refresh
    var activity_time = JSON.parse(window.localStorage.getItem("activity_time"))|| {"time": 0};

      //send deviceId and locatonId for ever venue to get current activity
      angular.forEach($scope.venue, function(value,key){
        var str=""
        $http({
          url: "http://54.152.112.50:3000/locations/activity/?deviceId="+$cordovaDevice.getUUID()+"&locationId="+value.foursquare_id,
          method: 'GET',
          contentType: 'application/json',
        }).then(function(res){

          //allow refresh only after 30 seconds
          if(res.data[0].revealedSince!=null){
            //check flag value to see if location revealed or not
            str=""
            if (value.flag=="1"){
              console.log("it is 1")
              console.log(res.data[0].revealedSince)
              if (res.data[0].revealedSince.length ==1){
                str+=value+' has visited '+value.name
              }
              else{
                angular.forEach(res.data[0].revealedSince, function(value,key){
                  str+=value+' '
                })
                if (str!=""){
                  str+=" have visited "+value.name
                }
              }
            }
            else{
              if(res.data[0].revealedSince.length!=0){
                str=res.data[0].revealedSince.length+" people have visited "+value.name
              }
            }
          }
          if (str!=""){
            $scope.activity.push({"message":str})
            window.localStorage.setItem("activity", JSON.stringify($scope.activity));
          }
          console.log(str)
          console.log($scope.activity)  
        }).finally(function() {
         // Stop the ion-refresher from spinning
         $scope.$broadcast('scroll.refreshComplete');
        });
      });
      window.localStorage.setItem("activity_time", JSON.stringify({"time":Date.now()}));
  }


  // venue tab functions


  $scope.reg= JSON.parse(window.localStorage.getItem("Registered")) || {"value":"False"}
  $scope.visitor=[]

  $scope.map=[]

  var renderMap= function(obj){

    console.log("in render map")
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
        animation: google.maps.Animation.DROP,
        position: latLng
    });
    // google.maps.event.addDomListener("map"+obj.foursquare_id), 'load', function(){
    //   console.log('Map was clicked!');
    // };      
  }

  $scope.refresh=function(){

    angular.forEach($scope.venue, function(value, key){
      var locationId = value.foursquare_id
      //get number of revealed users 
      $http({
        url: "http://54.152.112.50:3000/locations/revealedusers?locationId="+value.foursquare_id,
        method: 'GET',
        contentType: 'application/json',
      }).then(function(res){
        console.log(res.data.length)
        value.totalReveals = res.data.length;
      }).finally(function() {
         // Stop the ion-refresher from spinning
         $scope.$broadcast('scroll.refreshComplete');
        });
      //renderMap(value)
    });    
  };
      

  $scope.visitorNames=[]
  var getUserDevices = function(locationId){
    $http({
      url:"http://54.152.112.50:3000/locations/revealedusers?locationId="+locationId,
      method: 'GET',
      contentType: 'application/json'
    }).then(function(res){
      $scope.visitorNames=res.data

    }).catch(function(err){
      console.log(err)
    })
    console.log($scope.visitorNames)
  }


  $scope.reveal= function(locationObject){

    console.log("in reveal")

    $scope.revealedLocations = JSON.parse(window.localStorage.getItem("revealedLocations"))|| [];
    var callPopup="True"
    var keepGoing="True"

    angular.forEach($scope.revealedLocations, function(value,key){
      //check if locatin already revealed
      if(keepGoing=="True"){
        if (locationObject.foursquare_id==value){
          getUserDevices(locationObject.foursquare_id)
          callPopup="False"
          keepGoing="False"
          $state.go("tab.visitors")
        }
      }
    });

    //call pop if location not revealed
    if(callPopup=="True"){
      var confirmPopup = $ionicPopup.confirm({
        title: 'Do you want to reveal your identity',
        template: "See visitors allows you to reveal your identity to other people who have also visited this venue.<br> Your identity will only be visible to other people who choose to reveal their identity.<br> Do you want to continue?",
        cssClass: 'custom-popup',
        cancelText:"Don't Allow",
      });

      confirmPopup.then(function(res) {
        if (res) {
          $http({
                url: "http://54.152.112.50:3000/locations/reveal/",
                method: 'POST',
                headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                    transformRequest: function(obj) {
                     var str = [];
                     for(var p in obj)
                     str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
                     return str.join("&");
                },
              data: {"deviceId":$cordovaDevice.getUUID(),"locationId":locationObject.foursquare_id}
          })
          .then(function(res){
              console.log(res.data)
              getUserDevices(locationObject.foursquare_id)
              $scope.revealedLocations.push(locationObject.foursquare_id)
              window.localStorage.setItem("revealedLocations", JSON.stringify($scope.revealedLocations));
              //set flag value for revealed location
              angular.forEach($scope.venue, function(value,key){
                  if (value.foursquare_id == locationObject.foursquare_id){
                    value.flag="1"
                    console.log(value)
                  }
              });
              $state.go("tab.visitors")
          })
          .catch(function(err){
            console.log(err.data)
          });
        }
        else {
          console.log('You clicked on "Cancel" button');
        }
      });
    }
  };


  //settings tab functions

  $scope.locationTracking = { checked: true };

  $scope.tracking = function(){
    if($scope.locationTracking.checked== true){

      //backgroundGeolocation(true)
      $scope.toggleButton=true
      console.log("Background Tracking turned on")
    }
    else if($scope.locationTracking.checked== false){

      $scope.toggleButton=false
      console.log("Background Tracking turned off")
    }
    
  }
});


//controlls navigation 
app.controller('NavCtrl', function($scope, $state, $ionicPlatform, $cordovaDevice, $http){
  $scope.venue=JSON.parse(window.localStorage.getItem("venues")) || []
  //check is user registered
  $scope.reg= JSON.parse(window.localStorage.getItem("Registered")) || {"value":"False"}
  if ($scope.reg["value"] == "True"){
    if ($scope.venue.length==0){
      $state.go('tab.venueDefault')
    }
    else{
      $state.go('tab.venue')
    }
  }

  $scope.register = function(){
    //if user already registered, go to venue tab
    if ($scope.reg["value"] == "False"){
      $state.go("register");
    }
    else{
      if ($scope.venue.length==0){
        $state.go('tab.venueDefault')
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
      console.log(res.data)
      if(res.data.status=="success"){
        $scope.reg.value="True"
        window.localStorage.setItem("Registered", JSON.stringify($scope.reg));
        window.alert("Registeration Successful")
        console.log("Login Successful")
        $state.go("tab.venue")
      }
      else{
        window.alert("User Already exists")
      }
    })
    .catch(function(err){
      console.log(err.data.message)
    });
  }
});


