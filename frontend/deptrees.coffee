###
# Initialise brat
###
webFontURLs = undefined

window.init_brat = ->
    bratLocation = "lib/brat"

    head.js(

        # brat helper modules
        bratLocation + '/client/src/configuration.js',
        bratLocation + '/client/src/util.js',
        bratLocation + '/client/src/annotation_log.js',
        bratLocation + '/client/lib/webfont.js',

        # brat modules
        bratLocation + '/client/src/dispatcher.js',
        bratLocation + '/client/src/url_monitor.js',
        bratLocation + '/client/src/visualizer.js'
    )

    webFontURLs = [
        bratLocation + "/static/fonts/Astloch-Bold.ttf"
        bratLocation + "/static/fonts/PT_Sans-Caption-Web-Regular.ttf"
        bratLocation + "/static/fonts/Liberation_Sans-Regular.ttf"
    ]

###
#
# words are from one sentence and are Strings with extra attributes
# including rel, dephead and deprel and pos
#
###
color_from_chars = (w, sat_min, sat_max, lightness) ->
    v = 1.0
    hue = 0.0
    sat = 0.0
    len = w.length
    i = 0

    while i < len
        v = v / 26.0
        sat += ((w.charCodeAt(i)) % 26) * v
        hue += ((w.charCodeAt(i)) % 26) * (1.0 / 26 / len)
        i++
    hue = hue * 360
    sat = sat * (sat_max - sat_min) + sat_min
    color = $.Color
        hue: hue
        saturation: sat
        lightness: lightness
    color.toHexString 0

###
# Makes a brat entity from a positional attribute
###
make_entity_from_pos = (p) ->
    type: p
    labels: [p]
    bgColor: color_from_chars(p, 0.8, 0.95, 0.95)
    borderColor: "darken"

###
# Makes a brat relation from a dependency relation
###
make_relation_from_rel = (r) ->
    type: r
    labels: [r]
    color: "#000000"
    args: [
        role: "parent"
        targets: []
    ,
        role: "child"
        targets: []
    ]

###
# Draws a brat tree from a XML words array to a div given its id
###
window.draw_brat_tree = (words, to_div) ->

    entity_types = []
    relation_types = []
    entities = []
    relations = []
    added_pos = []
    added_rel = []

    add_word = (word, start, stop) ->

        [pos,ref,dephead,deprel] = for attr in ["pos", "ref", "dephead", "deprel"]
            word.attributes.getNamedItem(attr).value

        unless _.contains added_pos, pos
            added_pos.push pos
            entity_types.push make_entity_from_pos pos

        unless _.contains added_rel, deprel
            added_rel.push deprel
            relation_types.push make_relation_from_rel deprel

        entity = ["T" + ref, pos, [[start, stop]]]
        entities.push entity

        unless deprel is "ROOT"
            relation =
                [ "R" + ref, deprel
                , [ ["parent", "T" + dephead ]
                  , ["child", "T" + ref]
                  ]
                ]
            relations.push relation

    text = (word.textContent for word in words).join(" ")
    ix = 0
    for word in words
        len = word.textContent.length
        add_word word, ix, ix + len
        ix += len + 1

    collData =
        entity_types: entity_types
        relation_types: relation_types

    docData =
        text: text
        entities: entities
        relations: relations

    Util.embed to_div, collData, docData, webFontURLs

