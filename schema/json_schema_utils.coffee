
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

###
# Gets a value of the gives schema populated with the default values specified in it
###
get_default = (schema) ->
    if schema.type == "object"
        _.object _.map schema.properties, (subschema, key) -> [key, get_default(subschema)]
    else
       return schema.default

###
# Flattens out union types of only one type
###
flatten_singleton_unions = (schema) ->
    if _.isArray(schema.type) and schema.type.length == 1
        for key of schema.type[0]
            schema[key] ?= schema.type[0][key]
        schema.type = schema.type[0].type
    if schema.properties?
        for key of schema.properties
            flatten_singleton_unions schema.properties[key]
    if schema.items?
        flatten_singleton_unions subschema for subschema in schema.items
    if _.isArray(schema.type)
        flatten_singleton_unions subschema for subschema in schema.type
    schema

###
# Export in the json_schema_utils namespace
###
window.json_schema_utils =
    follow_references: follow_references
    get_default: get_default
    flatten_singleton_unions: flatten_singleton_unions
