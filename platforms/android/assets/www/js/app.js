// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
angular.module('location', ['ionic', 'ngCordova'])
//, uiGmapGoogleMapApiProvider
.config(function($stateProvider, $urlRouterProvider) {

  $urlRouterProvider.otherwise('/welcome');

  $stateProvider
    .state('register', {
      url: '/register',
      templateUrl: 'templates/register.html',
      controller:'NavCtrl'
    })

    .state('welcome', {
      url: '/welcome',  
      templateUrl: 'templates/welcome.html',
    })

    .state('tab', {
    url: '/tab',
    abstract: true,
    templateUrl: 'templates/tabs.html'
    })

    .state('venueDefault',{
      url:'/venue/default',
      templateUrl:'templates/tab-venue-default.html',
      controller: 'GeoCtrl'
    })

    .state('tab.venue',{
      url:'/venue',
      views:{
        'tab-venue':{
          templateUrl:'templates/tab-venue.html',
        }
      } 
    })

    .state('tab.activity',{
      url:'/activity',
      views:{
        'tab-activity':{
          templateUrl:'templates/tabs-activity-default.html',
        }
    }
  })

    .state('tab.settings',{
      url:'/settings',
      views:{
        'tab-settings':{
          templateUrl:'templates/tab-settings.html',
          //contoller
        }
      }
    })

    .state('tab.about',{
      url:'/about',
      views:{
        'tab-about':{
          templateUrl:'templates/tab-about.html'
          //contoller
        }
    }
  })
    .state('visitors',{
      parent:'tab.venue',
      url:'^/visitors',
      views:{
        'venue-visitors':{
          templateUrl:'templates/visitors.html'
        },
    }
      
    });

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
