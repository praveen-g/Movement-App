var app=angular.module('location');
app.controller('GeoCtrl', function($scope, $cordovaGeolocation) {

  var posOptions = {timeout: 10000, enableHighAccuracy: false};

  $cordovaGeolocation
    .getCurrentPosition(posOptions)
    .then(function (position) {
      var d = new Date(position.timestamp);
      d=d.toTimeString();
      $scope.points = [{"lat":position.coords.latitude, "long":position.coords.longitude, "time":d}];
    }, function(err) {
      // error
    });
  
  var watchOptions = {
    timeout : 3000,
    enableHighAccuracy: false // may cause errors if true
  };

  var watch = $cordovaGeolocation.watchPosition(watchOptions);
  watch.then(
    null,
    function(err) {
      // error
    },
    function(position) {
      var d = new Date(position.timestamp);
      d=d.toTimeString();
      point= { "lat":position.coords.latitude, "long":position.coords.longitude, "time":d};
      $scope.points.push(point);
  });


});
