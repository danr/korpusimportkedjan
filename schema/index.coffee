
$(window.document).ready () ->

    for key of examples
        do (key) ->
            example_button = $("""<button>#{key}</button>""").click () ->
                console.log "Loading example ", key, " with value ", examples[key]
                load_example examples[key]
                false
            $("#examples").append example_button

    load_example examples.union

load_example = (example) ->
    console.log example
    form = generate example.schema, "value"
    $("#form").empty().append form.dom
    form.set example.value
    $('#get').unbind('click').click () ->
        v = form.get()
        console.log v
        console.log JSON.stringify v
        $('#result').text JSON.stringify v

generate = (schema, path) ->

    if schema.type == "string"
        dom: dom = $ """<span class="string">#{schema.title}: <input id="#{path}"></span>"""
        set: (v) -> $(dom).find(":input").val v; return
        get: () -> $(dom).find(":input").val()

    else if schema.type == "bool"
        dom: dom = $ """<span class="bool"><input id="#{path}" type="checkbox"> #{schema.title}</span>"""
        set: (v) -> $(dom).find(":checkbox").attr 'checked', v; return
        get: () -> 'checked' == $(dom).find(":checkbox").attr 'checked'

    else if schema.type == "object"
        dom = $ """<div class="object"><strong>#{schema.title}</strong></div>"""
        objects = for key of schema.properties
            _.extend {key: key}, generate schema.properties[key], "#{path}_#{key}"

        dom.append object.dom for object in objects

        dom: dom
        set: (obj) -> object.set obj[object.key] for object in objects; return
        get: () -> _.object ([object.key, object.get()] for object in objects)

    else if schema.type == "array"
        dom = $ """<div class="array"><strong>#{schema.title}</strong></div>"""

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
        dom = $ """<div class="union">"""
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

        select_dom.change -> set_selected select_dom.val()

        dom: dom.prepend $("""<strong>#{schema.title}</strong>"""), select_dom
        set: (x) ->
            # Picks the first option with correct type
            for subschema, i in schema.type when type_match x, subschema
                options[i].set(x)
                with_selected.set(i)
                break
            return
        get: () -> options[with_selected.get()].get()
    else
        throw new Error "The type of #{JSON.stringify(schema)} is not supported!"

# True if first argument is of the type described by the second argument. Used to set union types
type_match = do ->
    [all, any, map] = [_.all, _.any, _.map]
    (value, schema) ->
        any [ schema.type == "string" and _.isString(value)
              schema.type == "bool" and _.isBoolean(value)
              schema.type == "object" and _.isObject(value) and
                all map schema.properties, (key, subschema) -> type_match value.key, subschema
              _.isArray(schema.type) and any schema.type, (s) -> type_match value, s
            ]

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
