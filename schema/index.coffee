$(window.document).ready () ->
    $("#form").html generate schema, "value"

generate = (schema, path) ->
    console.log schema, path
    return switch schema.type
        when "string"
            $ """<span>#{schema.title}: <input id="#{path}"></span>"""
        when "bool"
            $ """<span><input id="#{path}" type="checkbox"> #{schema.title}</span>"""
        when "object"
            dom = $ """<div><strong>#{schema.title}</strong></div>"""
            for key of schema.properties
                dom_key = generate schema.properties[key], "#{path}_#{key}"
                dom.append $("<div>").append(dom_key)
            dom
        when "array"
            dom = $ """<div><strong>#{schema.title}</strong></div>"""
            new_button = $("""<button>mk</button>""").click () ->
                dom.append generate_item schema.items, path; false
            dom.append new_button

generate_item = (schema, path) ->
    item_div = $("""<div>""")
    rm_button = $("""<button>rm</button>""").click () ->
        item_div.remove(); false
    item_div.append (generate schema, "#{path}_element"), rm_button

test = "array"

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
        ref:
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
        ref: ["first string","second string"]

if test == "string"
    schema =
        title: "A string"
        type: "string"

    value =
        ref: "a string value"

if test == "bool"
    schema =
        title: "A checkbox"
        type: "bool"
