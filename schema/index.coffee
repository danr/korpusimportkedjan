
add_example_button = (key, example) ->
    example_button = $("""<button>#{key}</button>""").click () ->
        load_example example
        false
    $("#examples").append example_button

$(window.document).ready () ->

    $.ajax
        url: "http://localhost:8051"
        data:
            format: "schema"
        dataType: "json"
        timeout: 300000
        type: "GET"
        success: (data, textStatus, xhr) ->
            schema = schema_utils.follow_references data
            console.log schema
            add_example_button 'taxi',
                schema: schema
                value: schema_utils.get_default schema
        error: (info...) ->
            console.log info

    for key of examples
        do (key) -> add_example_button key, examples[key]

    load_example examples.array

load_example = (example) ->
    form = generate example.schema, "value"
    $("#form").empty().append form.dom
    form.set example.value
    $('#get').unbind('click').click () ->
        v = form.get()
        console.log v
        console.log JSON.stringify v
        $('#result').text JSON.stringify v

generate = (schema, path) -> do ->

    decorator = (make) ->
        obj = make()
        inner_dom = obj.dom
        type = if _.isArray schema.type then "union" else schema.type
        obj.dom = $ """<div class="#{type}"/>"""
        if schema.title?
            obj.dom.append $ """<div class="title">#{schema.title}</div>"""
        if schema.description?
            obj.dom.append $ """<div class="description">#{schema.description}</div>"""
        obj.dom.append inner_dom
        obj

    decorator ->

        if schema.type == "string"
            dom: dom = $ """<input id="#{path}">"""
            set: (v) -> dom.val v; return
            get: () -> dom.val()

        else if schema.type == "bool"
            dom: dom = $ """<input id="#{path}" type="checkbox">"""
            set: (v) -> dom.attr 'checked', v; return
            get: () -> 'checked' == dom.attr 'checked'

        else if schema.type == "object"
            dom = $ """<div class="object">"""
            objects = for key of schema.properties
                _.extend {key: key}, generate schema.properties[key], "#{path}_#{key}"

            dom.append object.dom for object in objects

            dom: dom
            set: (obj) -> object.set obj[object.key] for object in objects; return
            get: () -> _.object ([object.key, object.get()] for object in objects)

        else if schema.type == "array"
            dom = $ """<div class="inner">"""

            items_div = $ """<div class="items">"""
            items = []

            generate_item = () ->
                item = generate schema.items, "#{path}_item"
                item_div = $ """<div class="item">"""

                rm_button = $("""<button>rm</button>""").click () ->
                    item_div.remove()
                    items = _.without(items, item)
                    false

                items_div.append item_div.append item.dom, rm_button
                return item

            new_button = $("""<button>mk</button>""").click () ->
                items.push generate_item()
                false

            dom: dom.append new_button, items_div
            set: (vs) ->
                items_div.empty()
                items = for v in vs
                    item = generate_item()
                    item.set v
                    item
                return
            get: () -> item.get() for item in items

        else if $.isArray schema.type
            dom = $ """<div class="inner">"""
            select_dom = $ """<select>"""

            options = for subschema, i in schema.type
                select_dom.append $ """<option value="#{i}">#{subschema.title}</option>"""
                generate subschema, "#{path}_#{i}"

            for option, i in options
                option_div = $ """<div class="option" id="#{i}"/>"""
                dom.append option_div.append option.dom

            # The selected item index is stored in the closed variable selected
            with_selected = do ->
                selected = null
                set : (s) ->
                    selected = s if s?
                    dom.children(".option").css "display","none"
                    dom.children(".option##{selected}").css "display", "block"
                    select_dom.val(selected)
                get: () -> selected

            with_selected.set(0)

            select_dom.change -> with_selected.set select_dom.val()

            dom: dom.prepend select_dom
            set: (x) ->
                # Picks the first option with correct type
                for subschema, i in schema.type when type_match x, subschema
                    options[i].set(x)
                    with_selected.set(i)
                    break
                return
            get: () -> options[with_selected.get()].get()
        else
            throw new Error "The type of #{JSON.stringify schema} is not supported!"

logger = (f) -> (args...) ->
    res = f(args...)
    console.log "args: " + (JSON.stringify arg for arg in args) + " = ", res
    res

# True if first argument is of the type described by the second argument. Used to set union types
type_match = do ->
    [all, any, map] = [_.all, _.any, _.map]

    (value, schema) ->
        if schema.type == "object" and _.isObject(value)
            all map schema.properties, (subschema, key) -> do ->
                value[key]? and type_match value[key], subschema
        else if schema.type == "array" and _.isArray(value)
            all value, (v) -> type_match v, schema.items
        else if _.isArray(schema.type)
            any schema.type, (s) -> type_match value, s
        else
            schema.type == "string" and _.isString(value) or
            schema.type == "bool" and _.isBoolean(value)

examples =
    union:
        schema:
            title: "Union type"
            type:
                [
                    title: "Checkbox"
                    type: "bool"
                ,
                    title: "String"
                    type: "string"
                ]
        value: "hello"

    complex:
        schema:
            title: "Complex Schema"
            type: "object"
            properties:
                extra:
                    title: "Extra Tags"
                    type: "array"
                    items:
                        title: "Extra Tag"
                        type: "object"
                        properties:
                            tag:
                                title: "Tag Name"
                                type: "string"
                            attrs:
                                title: "Attributes"
                                type: "array"
                                items:
                                    title: "Attribute"
                                    type: "string"

        value:
            extra:
                [
                    tag: "chapter"
                    attrs: ["title", "author"]
                ,
                    tag: "header"
                    attrs: ["date", "journal"]
                ]

    object:
        schema:
            title: "Two objects"
            type: "object"
            properties:
                name:
                    title: "Name"
                    type: "string"
                happy:
                    title: "Happy"
                    type: "bool"

        value:
            name: "Test name"
            happy: true

    array:
        schema:
            title: "An array of strings"
            type: "array"
            items:
                title: "A string in the array"
                type: "string"
                default: "default string value"

        value:
            [ "first string"
              "second string"
            ]

    string:
        schema:
            title: "A string"
            type: "string"

        value: "a string value"

    bool:
        schema:
            title: "A checkbox"
            type: "bool"

        value: true

examples.combine =
    schema:
        title: "All of them combined, as an array!!"
        description: "Might work!"
        type: 'array'
        items:
            title: "An item!"
            type: _.values _.pluck examples, 'schema'
    value: _.values _.pluck examples, 'value'

# Verify that every value of the example schemas are of the type they should be
test_examples = () ->
    _.map examples, (example, key) ->
        console.log key, type_match example.value, example.schema
