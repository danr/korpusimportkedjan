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
    [form_dom, form_load, form_get] = generate example.schema, "value"
    $("#form").empty().append form_dom
    form_load example.value
    $('#get').unbind('click').click () ->
        v = form_get()
        console.log v
        console.log JSON.stringify v
        $('#result').text JSON.stringify v

generate = (schema, path) ->

    if schema.type == "string"
        [ dom = $ """<span class="string">#{schema.title}: <input id="#{path}"></span>"""
          (v) ->
            console.log "Setting ", v, " to input elements under ", dom
            $(dom).find(":input").val v
            return
          () ->
            console.log "Retreiving value from input elements under ", dom
            $(dom).find(":input").val()
        ]

    else if schema.type == "bool"
        [ dom = $ """<span class="bool"><input id="#{path}" type="checkbox"> #{schema.title}</span>"""
          (v) ->
            console.log "Setting ", v, " to checkbox elements under ", dom
            $(dom).find(":checkbox").attr 'checked', v
            return
          () ->
            console.log "Retreiving value from checkbox elements under ", dom
            'checked' == $(dom).find(":checkbox").attr 'checked'
        ]

    else if schema.type == "object"
        dom = $ """<div class="object"><strong>#{schema.title}</strong></div>"""
        objects = for key of schema.properties
            [].concat [key], generate schema.properties[key], "#{path}_#{key}"

        for [ _, object_dom, _, _ ] in objects
            dom.append object_dom

        set = (obj) ->
            console.log "Setting object ", obj, " to ", dom
            for [ key, _ , object_set, _ ] in objects
                console.log "Setting ", key, " with value ", obj[key],
                    " of object ", obj, " pertaining to ", dom
                object_set obj[key]
            return

        get = () ->
            console.log "Getting object from items " , dom
            obj = {}
            obj[key] = get_key() for [ key, _, _, get_key ] in objects
            obj

        [ dom, set, get ]

    else if schema.type == "array"
        dom = $ """<div class="array"><strong>#{schema.title}</strong></div>"""

        items_div = $ """<div class="items">"""
        items_get = []

        generate_item = () ->
            item_div = $("""<div class="item">""")

            [ item_dom, item_set, item_get ] = generate schema.items, "#{path}_element"

            item_get_indirect = ref: item_get

            rm_button = $("""<button>rm</button>""").click () ->
                item_div.remove()
                item_get_indirect.ref = null
                false

            item_div.append item_dom, rm_button

            items_div.append item_div
            items_get.push item_get_indirect
            return item_set

        new_button = $("""<button>mk</button>""").click () ->
            generate_item()
            false

        dom.append new_button, items_div

        set = (vs) ->
            console.log "Setting array", vs, " to items div ", items_div
            items_div.empty()
            generate_item()(v) for v in vs
            return

        get = () ->
            console.log "Getting array from items " , items_div
            for item_get_indirect in items_get when item_get_indirect.ref isnt null
                item_get_indirect.ref()

        [ dom, set, get ]

    else if $.isArray schema.type
        dom = $ """<div class="union"><strong>#{schema.title}</strong></div>"""
        select = $ """<select>"""

        options = for subschema, i in schema.type
            select.append $ """<option id="#{i}">#{subschema.title}</option>"""
            [ object_dom, object_set, object_get ] = generate subschema, "#{path}_#{i}"
            display = if i == 0 then "block" else "none"
            dom.append $("""<div class="option" id="#{i}_div" style="display: none;">""").append object_dom

        select.change () ->
            dom.children(".option").css "display","none"
            selected = $(@).children(":selected").attr "id"
            console.log "Selected:", selected
            dom.children("##{selected}_div").css "display", "block"

        for [ object_dom, _, _ ], i in options
            dom.append $("""<div class="option" id="#{i}_div" style="display: none;">""").append object_dom

        dom.prepend select

        [ dom
          (x) -> x
          () -> return
        ]
    else
        throw new Error "The type of #{JSON.stringify(schema)} is not supported!"

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
