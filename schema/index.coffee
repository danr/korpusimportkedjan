$(window.document).ready () ->
    [form_dom, form_load, form_get] = generate schema, "value"
    $("#form").empty().append form_dom
    console.log value
    form_load value
    $('#get').click () ->
        v = form_get()
        console.log v
        console.log JSON.stringify v
        $('#result').text JSON.stringify v

generate = (schema, path) ->
    # console.log schema, path
    return switch schema.type
        when "string"
            [ dom = $ """<span class="string">#{schema.title}: <input id="#{path}"></span>"""
              (v) ->
                console.log "Setting ", v, " to input elements under ", dom
                $(dom).find(":input").val v
              () ->
                console.log "Retreiving value from input elements under ", dom
                $(dom).find(":input").val()
            ]
        when "bool"
            [ dom = $ """<span class="bool"><input id="#{path}" type="checkbox"> #{schema.title}</span>"""
              (v) ->
                console.log "Setting ", v, " to checkbox elements under ", dom
                $(dom).find(":checkbox").attr 'checked', v
              () ->
                console.log "Retreiving value from checkbox elements under ", dom
                $(dom).find(":checkbox").attr 'checked'
            ]
        when "object"
            dom = $ """<div class="object"><strong>#{schema.title}</strong></div>"""
            setters = []
            getters = []
            for key of schema.properties
                [ dom_key, set_key, get_key ] = generate schema.properties[key], "#{path}_#{key}"
                dom.append $("<div>").append(dom_key)
                setters.push [ key, set_key ]
                getters.push [ key, get_key ]
            set = (x) ->
                console.log "Setting object ", x, " to ", dom
                for [ key, set_key ] in setters
                    console.log "Setting ", key, " with value ", x[key], " of object ", x, " pertaining to ", dom
                    set_key x[key]
                return
            get = () ->
                console.log "Getting object from items " , dom
                obj = {}
                obj[key] = get_key() for [ key, get_key ] in getters
                obj
            [ dom, set, get ]
        when "array"
            dom = $ """<div class="array"><strong>#{schema.title}</strong></div>"""

            items_div = $ """<div class="items">"""
            items_get = []

            new_button = $("""<button>mk</button>""").click () ->
                [ item_div, _item_load , item_get ] = generate_item schema.items, path
                items_div.append item_div
                items_get.push item_get
                false

            [ dom.append new_button, items_div
              (vs) ->
                console.log "Setting array", vs, " to items div ", items_div
                items_div.empty()
                for v in vs
                    [ item_dom, item_set, item_get ] = generate_item schema.items, path
                    items_div.append item_dom
                    items_get.push item_get
                    item_set(v)
              () ->
                console.log "Getting array from items " , items_div
                (item_get() for item_get in items_get)
            ]

generate_item = (schema, path) ->
    item_div = $("""<div class="item">""")
    rm_button = $("""<button>rm</button>""").click () ->
        item_div.remove(); false
    [ item_dom, item_load, item_get ] = generate schema, "#{path}_element"
    [ item_div.append item_dom, rm_button
      item_load
      item_get
    ]

test = "complex"

if test == "complex"
    schema =
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

    value =
        extra:
            [
                tag: "chapter"
                attrs: ["title", "author"]
            ,
                tag: "header"
                attrs: ["date", "journal"]
            ]

if test == "object"
    schema =
        title: "Two objects"
        type: "object"
        properties:
            name:
                title: "Name"
                type: "string"
            happy:
                title: "Happy"
                type: "bool"

    value =
        name: "Test name"
        happy: true

if test == "array"
    schema =
        title: "An array of strings"
        type: "array"
        items:
            title: "A string in the array"
            type: "string"
            default: "default string value"

    value =
        [ "first string"
          "second string"
        ]

if test == "string"
    schema =
        title: "A string"
        type: "string"

    value = "a string value"

if test == "bool"
    schema =
        title: "A checkbox"
        type: "bool"

    value = true
