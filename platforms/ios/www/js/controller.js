var app=angular.module('location',[]);
app.controller('GeoCtrl', function($scope, $cordovaGeolocation) {
      var posOptions = {timeout: 10000, enableHighAccuracy: false};
  $cordovaGeolocation
    .getCurrentPosition(posOptions)
    .then(function (position) {
      $scope.latitude  = position.coords.latitude
      $scope.longitude = position.coords.longitude
    }, function(err) {
      // error
    });

  /*
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
      var lat  = position.coords.latitude
      var long = position.coords.longitude
  });
*/
