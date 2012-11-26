
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
            example =
                schema: schema
                value: schema_utils.get_default schema
            add_example_button 'annoteringslabbet', example
            load_example example
        error: (info...) ->
            console.log info

    add_example_button key, examples[key] for key of examples

    load_example examples.array

logger = (f) -> (args...) ->
    res = f(args...)
    console.log "args: " + (JSON.stringify arg for arg in args) + " = ", res
    res

load_example = (example) ->
    form = generate example.schema, "path"
    $("#form").empty().append form.dom
    form.set example.value
    $('#get').unbind('click').click () ->
        v = form.get()
        console.log v
        console.log JSON.stringify v
        $('#result').text JSON.stringify v

simplify_type = (schema) ->
    if schema.type == "array" and schema.items.type == "string" and schema.items.enum?
        enum: schema.items.enum
        multi: true
        desc: "multi-enum"
    else if schema.type == "string" and schema.enum?
        if schema.enum.length == 1
            only: schema.enum[0]
            desc: "only"
        else
            enum: schema.enum
            multi: false
            desc: if schema.style_enum == "dropdown" then "dropdown-enum" else "single-enum"
    else
        schema.type

generate = (schema, path) -> do ->

    schema.type = simplify_type schema

    decorator = (make) ->
        obj = make()
        inner_dom = obj.dom
        type = schema.type.desc or if _.isArray schema.type then "union" else schema.type
        obj.dom = $ """<div class="#{type} nest" id="#{path}"/>"""
        if schema.title?
            obj.dom.append $ """<div class="title #{type}-title">#{schema.title}</div>"""
        else
            console.log "no title:", schema
        if schema.description?
            obj.dom.append $ """<div class="description">#{schema.description}</div>"""
        obj.dom.append dom for dom in inner_dom
        obj

    decorator ->

        if schema.type.only?
            dom: []
            set: (v) -> return
            get: () -> schema.only

        else if schema.type.enum?
            if schema.style_enum == "dropdown" and not schema.type.multi
                dom = $ """<select>"""

                for v in schema.type.enum
                    dom.append $ """<option value="#{v}">#{v}</option>"""

                dom: dom
                set : (s) -> dom.val(s)
                get: () -> dom.val()
            else
                toggle = if schema.type.multi then "buttons-checkbox" else "buttons-radio"
                dom = $ """<div class="btn-group" data-toggle="#{toggle}"/>"""
                for v in schema.type.enum
                    dom.append $ """<button type="button" class="btn" id="#{v}">#{v}</button>"""
                dom: dom
                set: (vs) ->
                    if schema.type.multi
                        dom.children("button").removeClass("active")
                        dom.find("##{v}").addClass "active" for v in vs
                    else
                        dom.children("button").removeClass("active").filter("##{vs}").addClass "active"
                get: () ->
                    if schema.type.multi
                        $(c).attr "id" for c in dom.children ".active"
                    else
                        dom.children(".active").attr("id")

        else if schema.type == "string"
            dom: dom = $ """<input type="text">"""
            set: (v) -> dom.val v; return
            get: () -> dom.val()

        else if schema.type == "bool"
            dom: dom = $ """<input type="checkbox">"""
            set: (v) -> dom.attr 'checked', v; return
            get: () -> 'checked' == dom.attr 'checked'

        else if schema.type == "object"
            objects = for key of schema.properties
                _.extend {key: key}, generate schema.properties[key], "#{path}_#{key}"

            dom: (object.dom for object in objects)
            set: (obj) -> object.set obj[object.key] for object in objects; return
            get: () -> _.object ([object.key, object.get()] for object in objects)

        else if schema.type == "array"
            items_div = $ """<div class="items">"""
            items = []

            generate_item = () ->
                item = generate schema.items, "#{path}_item"
                item_div = $ """<div class="item">"""

                rm_button = $("""<button class="btn btn-danger item-btn"><i class="icon-minus-sign">""").click () ->
                    item_div.remove()
                    items = _.without(items, item)
                    false

                items_div.append item_div.append item.dom, rm_button
                return item

            new_button = $("""<button class="btn btn-success item-btn"><i class="icon-plus-sign">""").click () ->
                items.push generate_item()
                false

            dom: [new_button, items_div]
            set: (vs) ->
                items_div.empty()
                items = for v in vs
                    item = generate_item()
                    item.set v
                    item
                return
            get: () -> item.get() for item in items

        else if (_.isArray schema.type) and schema.type.length == 1
            res = generate schema.type[0], "#{path}_single"
            res.dom.addClass "single"
            res

        else if _.isArray schema.type
            select_dom = $ """<select>"""

            options = for subschema, i in schema.type
                select_dom.append $ """<option value="#{i}">#{subschema.title}</option>"""
                option = generate subschema, "#{path}_#{i}"
                if subschema.default?
                    option.set subschema.default
                option

            # The selected item index is stored in the closed variable selected
            with_selected = do ->
                selected = null
                set : (s) ->
                    selected = s if s?
                    for option, i in options
                        if i == Number selected
                            option.dom.show()
                        else
                            option.dom.hide()
                    # select_parent.find("input:hidden").val selected
                    select_dom.val(selected)
                get: () -> selected

            with_selected.set(0)

            select_dom.change -> with_selected.set select_dom.val()
            # select_parent = $ """<div class="select-parent">"""
            # select_parent.append select_dom
            # select_dom.buttonSelect(false)
            # select_parent.find("input:hidden").change -> console.log $(@); with_selected.set $(@).val()

            doms = (option.dom for option in options)
            doms.unshift select_dom

            dom: doms
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
        else if schema.enum?
            _.contains schema.enum, value
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
