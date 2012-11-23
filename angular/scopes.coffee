
app.directive 'subScope', () ->
    scope:
        desc: '='
        values: '='
        prop: '='
    transclude: true
    replace: true
    compile: (element, attr, transclude) ->
        (scope, iElement, attr) ->
            console.log scope

            $scope = scope.$new()

            $scope.desc = {}
            angular.forEach scope.desc, (value, key) ->
                console.log "desc", key, "->", value
                $scope.desc[key] = value

            $scope.values = (x for x in scope.values)
            console.log "scope.values", scope.values
            console.log "$scope.values", $scope.values

            $scope.prop = scope.prop
            console.log "prop", "->", $scope.prop

            iElement.append(transclude($scope));
