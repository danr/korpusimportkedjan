$(window.document).ready () ->

    for key of examples
        do (key) ->
            example_button = $("""<button>#{key}</button>""").click () ->
                console.log "Loading example ", key, " with value ", examples[key]
                load_example examples[key]
                false
            $("#examples").append example_button

    load_example examples.complex

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
    # console.log schema, path
    return switch schema.type

        when "string"
            [ dom = $ """<span class="string">#{schema.title}: <input id="#{path}"></span>"""
              (v) ->
                console.log "Setting ", v, " to input elements under ", dom
                $(dom).find(":input").val v
                return
              () ->
                console.log "Retreiving value from input elements under ", dom
                $(dom).find(":input").val()
            ]

        when "bool"
            [ dom = $ """<span class="bool"><input id="#{path}" type="checkbox"> #{schema.title}</span>"""
              (v) ->
                console.log "Setting ", v, " to checkbox elements under ", dom
                $(dom).find(":checkbox").attr 'checked', v
                return
              () ->
                console.log "Retreiving value from checkbox elements under ", dom
                'checked' == $(dom).find(":checkbox").attr 'checked'
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

            generate_item = () ->
                item_div = $("""<div class="item">""")

                [ item_dom, item_set, item_get ] = generate schema.items, "#{path}_element"

                get_indirect =
                    ref: item_get

                rm_button = $("""<button>rm</button>""").click () ->
                    item_div.remove(); false
                    get_indirect.ref = null
                    return

                item_div.append item_dom, rm_button

                items_div.append item_div
                items_get.push get_indirect
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
                (item_get.ref() for item_get in items_get when item_get.ref isnt null)

            [ dom, set, get ]


examples =
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
