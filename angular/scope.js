// http://plnkr.co/edit/gist:3172544?p=preview&s=danr

app.directive('scope', function() {
  return {
    scope: {
      scope: '='
    },
    transclude: true,
    replace: true,
    template: '<div></div>',
    compile: function(tElement, attr, transclude) {
      return function(scope, iElement, attr) {
        var $scope = scope.$new();
        angular.forEach(scope.scope, function(value, key) {
          $scope[key] = value;
        });
        iElement.append(transclude($scope));
      };
    }
  };
});

/*
app.controller('MainCtrl', function($scope) {
  $scope.name = 'World';
  $scope.sub = {
    name: "World!!!!"
  };
});
*/

/*
<body ng-controller="MainCtrl">
  A. Hello {{name}}!
  <input ng-model="name">
  <div scope="sub">
    inner A. Hello {{name}}!
    <input ng-model="name">
  </div>
</body>
*/
