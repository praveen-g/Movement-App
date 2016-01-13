// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
angular.module('location', ['ionic', 'ngCordova', 'ngResource'])

.factory('Location', function($resource) {
  return $resource('http://jsonplaceholder.typicode.com/users/:user',{user: "@user"});
})


.run(function($ionicPlatform,$http, $cordovaPush) {
  $ionicPlatform.ready(function() {
    if(window.cordova && window.cordova.plugins.Keyboard) {
      // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
      // for form inputs)
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);

      // Don't remove this line unless you know what you are doing. It stops the viewport
      // from snapping when text inputs are focused. Ionic handles this internally for
      // a much nicer keyboard experience.
      cordova.plugins.Keyboard.disableScroll(true);
    }
    if(window.StatusBar) {
      StatusBar.styleDefault();
    }
  });
});




/*  
  //setting up push notifications

  var iosConfig = {
    "badge": true,
    "sound": true,
    "alert": true,
  };

  document.addEventListener("deviceready", function(){
    $cordovaPush.register(iosConfig).then(function(deviceToken) {
      // Success -- send deviceToken to server, and store for future use
      console.log("deviceToken: " + deviceToken)
      $http.post("http://server.co/", {user: "Bob", tokenID: deviceToken})
    }, function(err) {
      alert("Registration error: " + err)
    });

    $rootScope.$on('$cordovaPush:notificationReceived', function(event, notification) {
      if (notification.alert) {
        navigator.notification.alert(notification.alert);
      }
      if (notification.sound) {
        var snd = new Media(event.sound);
        snd.play();
      }

      if (notification.badge) {
        $cordovaPush.setBadgeNumber(notification.badge).then(function(result) {
        // Success!
        }, function(err) {
        // An error occurred. Show a message to the user
        });
      }
    });

  });

*/
