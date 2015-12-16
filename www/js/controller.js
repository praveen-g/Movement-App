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


});
