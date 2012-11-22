window.FormCtrl = ($scope) ->
    $scope.schema =
        name:
            title: "Name"
            type: "string"
        street:
            title: "Street"
            type: "string"
        pets:
            title: "Pets"
            type: "array"
            default:
                pet: ""
            items:
                pet:
                    title: "Pet"
                    type: "string"
        i:
            title: "one"
            type: "array"
            default:
                ii: []
            items:
                ii:
                    title: "two"
                    type: "array"
                    default:
                        iii: []
                    items:
                        iii:
                            title: "three"
                            type: "string"

    $scope.clone = (obj) ->
        JSON.parse(JSON.stringify(obj))

    $scope.values =
        name: 'dan'
        street: 'tunnbindaregatan'
        pets: [{ pet: 'bosse' }, { pet: 'bjarne' }]
        i: []

    return

angular.module('formModule', [])
