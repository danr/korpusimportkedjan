
###
Follows internal json schema references, i.e. objects of type
   { "$ref": "#/segmenters" },
which means replace this object with the attribute segmenters
from the top schema. Arrays and objects are traversed in the schema,
which gets mutated, and eventually returned. Cyclic references
voids termination.
###
follow_references = (schema) ->
    rec = (pos) -> for key of pos
        ref = pos[key]["$ref"]
        if ref? and ref[0..1] == "#/"
            relocate = schema
            for addr in ref[2..].split('/')
                relocate = relocate[addr]
            delete pos[key]["$ref"]
            for i of relocate
                pos[key][i] ?= relocate[i]
        if (_.isArray pos[key]) or _.isObject pos[key]
            rec pos[key]
    rec schema
    schema

get_default = (schema) ->
    if schema.type == "object"
        _.object _.map schema.properties, (subschema, key) -> [key, get_default(subschema)]
    else
       return schema.default

window.schema_utils =
    follow_references: follow_references
    get_default: get_default
