window.FormCtrl = ($scope) ->
    $scope.schema =
        happy:
            title: "Happy"
            type: "bool"
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
        union:
            title: "Segmenter"
            type:
                [
                    title: "Punkt"
                    default: true
                    type: "bool"
                ,
                    title: "Tag"
                    default: "w"
                    type: "string"
                ]

    $scope.clone = (obj) ->
        JSON.parse(JSON.stringify(obj))

    $scope.values =
        name: 'dan'
        street: 'tunnbindaregatan'
        pets: [{ pet: 'bosse' }, { pet: 'bjarne' }]
        happy: true
        i: []
        union: "w"
        _union: $scope.schema.union.type[0]


    return

angular.module('formModule', [])
