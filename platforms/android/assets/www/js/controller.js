var app=angular.module('location');

app.controller('GeoCtrl', function($scope, $cordovaGeolocation, $cordovaBackgroundGeolocation, $ionicPlatform, $cordovaDevice, $http, $state, $ionicPopup)
{ 
  //obtaining data from local storage if present
  $scope.temporaryPoints = JSON.parse(window.localStorage.getItem("temporaryPoints"))|| [];
  $scope.venue = JSON.parse(window.localStorage.getItem("venues"))|| [];
  console.log($scope.venue.length)
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
      "deviceId":567,
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
      }
      else{
        var lastLocation = $scope.temporaryPoints[0] // get the last recorded location

        //check if user is in same location
        if((lat.toFixed(4)-lastLocation.lat.toFixed(4))<0.2 && (lng.toFixed(4)-lastLocation.llong.toFixed(4))<0.2){
          console.log(time)
          //compute time difference. Store locations only if more than 5 minutes
          if((time.timestamp- lastLocation.time.timestamp) > 1*60*1000){

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
            })
            .then(function(res){
              var present=0
              newVenue=res.data[0]
              console.log("translating")
              if ($scope.venue.length ==0){
                console.log("Venue stored")
                newVenue.flag="0"
                $scope.venue=[newVenue]
                renderMap(newVenue)
                window.localStorage.setItem("venues",JSON.stringify($scope.venue))
                console.log(JSON.parse(window.localStorage.getItem("venues")).length)
              }
              else{
                angular.forEach($scope.venue, function(value,key){
                  if (value.foursquare_id == newVenue.foursquare_id){
                    present=1
                  }
                });
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
                    $scope.venue.push(newVenue)
                    renderMap(newVenue)
                    window.localStorage.setItem("venues",JSON.stringify($scope.venue))
                    console.log($scope.venue)
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
        //if user is in different location, record the next location
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
        storePositionValues(40.740942,-74.002184,Math.floor(Date.now()));
    
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
      storePositionValues(40.740942,-74.002184,Math.floor(Date.now()));
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
    distanceFilter: 50, //minimum distance (in meters) mived before distance is recorded
    disableElasticity: false, // Used to return locations every 1 km at high speeds
    locationUpdateInterval: 1000*60*20, //update location every 20 minutes
    minimumActivityRecognitionConfidence: 80,   // 0-100%.  Minimum activity-confidence for a state-change 
    fastestLocationUpdateInterval: 5000,
    activityRecognitionInterval: 25000, // recognises activity every 25 seconds. Increase to improve battery life
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



  //activity stuff


  $scope.activity=JSON.parse(window.localStorage.getItem("activity"))|| [];

  $scope.refresh_activityTab= function(){
    $scope.activity=[]
    angular.forEach($scope.venue, function(value,key){
      var str=""
      $http({
        url: "http://54.152.112.50:3000/locations/activity/?deviceId=567"+"&locationId="+value.foursquare_id,
        method: 'GET',
        contentType: 'application/json',
        //headers: { 'Authorization': 'Bearer TOKEN' }
      }).then(function(res){
    
       if(res.data[0].revealedSince!=null){
         if (value.flag=="1"){
          str=""
          angular.forEach(res.data[0].revealedSince, function(value,key){
            str+=value+' '
          })
          str+=" have visited "+value.name
         }
         else{
          str=""
          str=res.data[0].revealedSince.length
         }
         str+=" people have visited "+value.name
        }
        $scope.activity.push({"message":str})

    }).finally(function() {
       // Stop the ion-refresher from spinning
       $scope.$broadcast('scroll.refreshComplete');
     });
    console.log($scope.activity)
    window.localStorage.setItem("activity", JSON.stringify($scope.activity));
  });
  }

  // venue stuff

  $scope.reg= JSON.parse(window.localStorage.getItem("Registered")) || {"value":"False"}
  $scope.activity= [{"message":"Refresh for recent activity!"}];
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
  }

  $scope.refresh=function(){

    angular.forEach($scope.venue, function(value, key){
     renderMap(value)
      
      var locationId = value.foursquare_id
      var callBaseURL = "http://54.152.112.50:3000/locations/revealedusers?locationId="
      var str=""

      $http({
        url: callBaseURL+locationId,
        method: 'GET',
        contentType: 'application/json',
        //headers: { 'Authorization': 'Bearer TOKEN' }
      }).then(function(res){
        
        value.totalReveals = res.data.length;

    }).finally(function() {
       // Stop the ion-refresher from spinning
       $scope.$broadcast('scroll.refreshComplete');
     });   
    
    }) 
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

      if(keepGoing=="True"){
        if (locationObject.foursquare_id==value){
          getUserDevices(locationObject.foursquare_id)
          console.log($scope.visitorNames)
          callPopup="False"
          keepGoing="False"
          $state.go("tab.visitors")
        }
      }
    });

    if(callPopup=="True"){
        var confirmPopup = $ionicPopup.confirm({

          title: 'Do you want to reveal your identity',

          template: "See visitors allows you to reveal your identity to other people who have also visited this venue.<br> Your identity will only be visible to other people who choose to reveal their identity.<br> Do you want to continue?",

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
                data: {"deviceId":567,"locationId":locationObject.foursquare_id}
            })
            .then(function(res){
                console.log(res.data)

                getUserDevices(locationObject.foursquare_id)
                $scope.revealedLocations.push(locationObject.foursquare_id)
                window.localStorage.setItem("revealedLocations", JSON.stringify($scope.revealedLocations));
                angular.forEach($scope.venue, function(value,key){
                    if (value.foursquare_id == locationObject.foursquare_id){
                      value.flag="1"
                      console.log(value)
                    }
                });
                $state.go("tab.visitors")
            })
           .catch(function(err){
            console.log(err.data.message)
          });

          } else {

             console.log('You clicked on "Cancel" button');

          }
      });
   }
   
   

   };


   

});
app.controller('NavCtrl', function($scope, $state, $ionicPlatform, $cordovaDevice, $http){

  $scope.reg= JSON.parse(window.localStorage.getItem("Registered")) || {"value":"False"}
  if ($scope.reg["value"] == "True"){
        $state.go("tab.venue") 
  }

  $scope.register = function(){

    if ($scope.reg["value"] == "False"){
      $state.go("register");
    }
    else{
      $state.go('tab.venue')
    }
  }

  $scope.welcome= function(){
    $state.go("welcome");
  }
  $scope.tab_dash=function(user){

    $scope.userDetails={
      "fullname": user.name,
      "emailId":user.email,
      "deviceId": 567
      
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
        if(res.data.status=="success"){

          $scope.reg.value="True"

          window.localStorage.setItem("Registered", JSON.stringify($scope.reg));

          console.log("Login Successful")

          $state.go("tab.venue")
    }

    })
     .catch(function(err){
      console.log(err.data.message)
    });
  }
});
