window.FormCtrl = ($scope) ->
    $scope.schema =
        happy:
            title: "Happy"
            type: "bool"
        name:
            title: "Name"
            type: "string"
        pets:
            title: "Pets"
            type: "array"
            items:
                title: "Pet"
                default: ""
                type: "string"
        segmenter:
            title: "Segmenter"
            type: "string"
            enum: ["punkt", "whitespace", "none"]

        generate:
            title: "Generate"
            type: "array"
            default: []
            items:
                title: "Annotation"
                type: "string"
                default: "word"
                enum: ["word", "msd", "pos"]
        union:
            title: "Union"
            type:
                [
                    title: "Punkt"
                    default: true
                    type: "bool"
                ,
                    title: "Tag"
                    default: "w"
                    type: "string"
                ,
                    title: "Nest"
                    default: []
                    type: "array"
                    items:
                        title: "Inhabitant"
                        type: "string"
                        default: ""
                ]

    $scope.clone = (obj) ->
        JSON.parse(JSON.stringify(obj))

    $scope.values =
        name: 'dan'
        street: 'tunnbindaregatan'
        pets: ['bosse','bjarne']
        happy: true
        i: []
        segmenter: "punkt"
        generate: []
        union: "w"
        _union: $scope.schema.union.type[0]


    return

window.app = angular.module('formModule', [])
