window.app = angular.module('formModule', [])

window.MainCtrl = ($scope) ->
    $scope.schema =
        title: "Schema"
        type: "object"
        properties:
            name:
                title: "Name"
                type: "string"
            pets:
                title: "Pets"
                type: "array"
                items:
                    title: "Name"
                    default: ""
                    type: "string"
            object:
                title: "Checkbox object"
                type: "object"
                properties:
                    one:
                        title: "One"
                        type: "bool"
                    two:
                        title: "Two"
                        type: "bool"

    $scope.value =
        name: "Dan"
        pets: []
        object:
            one: true
            two: false

    $scope.clone = (obj) ->
        console.log obj
        JSON.parse JSON.stringify obj

    return


#    $scope.change_enumarray = (array, id, value) ->
#        console.log array, id, value
#        if value and -1 == array.indexOf id
#            array.push id
#        if !value
#            v = array.indexOf id
#            if (v != -1)
#                array.splice v, 1
#
#    $scope.enumarray = (desc) ->
#        (desc.type == "array" and desc.items.type == "string" and desc.items.enum?).toString()


# old schema

#        object:
#            title: "Object"
#            type: "object"
#            properties:
#                happy:
#                    title: "Happy"
#                    type: "bool"
#                name:
#                    title: "Name"
#                    type: "string"
#        objlist:
#            title: "Object List"
#            type: "array"
#            items:
#                title: "List Object"
#                type: "object"
#                default:
#                    happy: true
#                    name: ""
#                properties:
#                    happy:
#                        title: "Happy"
#                        type: "bool"
#                    name:
#                        title: "Name"
#                        type: "string"
#        happy:
#            title: "Happy"
#            type: "bool"
#        name:
#            title: "Name"
#            type: "string"
#        pets:
#            title: "Pets"
#            type: "array"
#            items:
#                title: "Pet"
#                default: ""
#                type: "string"
#        segmenter:
#            title: "Segmenter"
#            type: "string"
#            enum: ["punkt", "whitespace", "none"]
#
#        generate:
#            title: "Generate"
#            type: "array"
#            default: []
#            items:
#                title: "Annotation"
#                type: "string"
#                default: "word"
#                enum: ["word", "msd", "pos"]
#        union:
#            title: "Union"
#            type:
#                [
#                    title: "Punkt"
#                    default: true
#                    type: "bool"
#                ,
#                    title: "Tag"
#                    default: "w"
#                    type: "string"
#                ,
#                    title: "Nest"
#                    default: []
#                    type: "array"
#                    items:
#                        title: "Inhabitant"
#                        type: "string"
#                        default: ""
#                ]

# old values

#        objlist: []
#        object:
#            name: 'johan'
#            happy: true
#        name: 'dan'
#        street: 'tunnbindaregatan'
#        happy: true
#        i: []
#        segmenter: "punkt"
#        generate: []
#        union: "w"
#        _union: $scope.schema.union.type[0]
