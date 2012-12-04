to_array = (x) -> if !x? then [] else if not _.isArray(x) then [x] else x

append_array_to_table = (tbl, array) ->
    for row in array
        tr = $("<tr/>")
        for col in row
            tr.append $("<td>").append(col)
        tbl.append tr

split_pipes = (f) ->
    (s) ->

        # s without surrounding pipes
        sp = (if s is "|" then "" else s.substring(1, s.length - 1))

        # the array of values delimited by pipes
        a = sp.split("|")

        # return them comma separated, of if the array contains no
        # characters, just return a space char
        (if a.join("") then _.map(a,f).join(", ") else "&nbsp;")

saldo_link = (s) -> """<a target="_blank" href="#{config.karp_address}#search=sense%7C#{s}">#{s}</a>"""

lemgram_link = (s) -> """<a target="_blank" href="#{config.karp_address}#search=lemgram%7C#{s}">#{s}</a>"""

span = (w) -> $("<span/>").html w

id = (x) -> x

tabulate_sentence = (columns, sent, make_deptrees) ->
    table = $("""<table class="table table-striped table-bordered table-condensed"/>""")
    header = $("<tr/>")
    header.append $ """<th>#{col.name}</th>""" for col in columns
    table.append header

    words = to_array(sent.w)
    append_array_to_table table, _.map(words, (word) ->
        _.map(columns, (col) ->
            span col.correct(word[col.id] or "&nbsp;")))

    if make_deptrees
        deprel_div = $("<div/>").attr("id", sent.id)
        table.prepend $("<tr/>").append($("<td/>").attr("colspan", columns.length).css("background-color", "#FFFFFF").append(deprel_div))
        ###
        deprel_div.waypoint (-> draw_brat_tree words, sent.id),
                offset: "100%"
                triggerOnce: true
                onlyOnScroll: true
        ###
        deprel_div.show "slow", ->
            draw_brat_tree words, sent.id

    table

window.make_table = (data, attributes) ->

    window.data = data

    col = (s) ->
        name: s
        id: s

    columns = (col(s) for s in ["pos", "msd", "lemma", "lex", "saldo", "prefix", "suffix", "ref", "dephead", "deprel"])

    correct =
        msd:    (s) -> s.split(".").join ". "
        lemma:  split_pipes(id)
        lex:    split_pipes(lemgram_link)
        saldo:  split_pipes(saldo_link)
        prefix: split_pipes(lemgram_link)
        suffix: split_pipes(lemgram_link)

    # Always write the word
    columns.unshift
        name: "ord"
        id: "text"

    # Remove those columns that are not part of the generated attributes,
    # and remove pos if msd is present
    columns = $.grep(columns, (col, _ix) ->
        $.inArray(col.id, attributes) isnt -1 and not (col.id is "pos" and $.inArray("msd", attributes) isnt -1)
    )

    # How to present the different columns (link to Karp etc)
    $.each columns, (_ix, col) ->
        col.correct = correct[col.id] or id

    # Only make dependency trees if all four required attributes are present
    make_deptrees = true
    $.each ["pos", "ref", "dephead", "deprel"], (_ix, a) ->
        make_deptrees = make_deptrees and $.inArray(a, attributes) isnt -1

    # Get sentences by looking for xml tags named "sentence"...
    xml_sentences = data.getElementsByTagName "sentence"

    # ... then convert them to json
    sentences = []
    $.each xml_sentences, (_, s) ->
        sentences.push $.xml2json(s)

    loading = $ """<div class="loading"><p>Laddar fler meningar&hellip;</p></div>"""

    tables = $ "<div/>"

    display = (tag,div) ->
        co.forM tag.childNodes, (child) ->
            if child.nodeName == "#text"
                co.ret "ignored"
            else if child.nodeName == "sentence"
                co.yld -> div.append tabulate_sentence columns, $.xml2json(child), make_deptrees
            else
                new_div = $("<div style='border: 3px grey solid; margin:3px; padding: 3px'><span>&lt;#{child.nodeName}&gt;</span></div>")
                div.append(new_div)
                display(child,new_div)

    corpus = data.getElementsByTagName "corpus"
    display_suspended = display(corpus[0],tables)

    SLICE_SIZE = 4

    show_next = (m_suspended, fuel) ->
        m = m_suspended()
        if m.result?
            console.log "RESULT:", m.result
        else if m.cont?
            console.log "OUTPUT:", m.output, m.output()
            new_suspended = m.cont("created!")
            if fuel > 0
                show_next new_suspended, (fuel-1)
            else
                link = $ """<a href="#">Ladda fler meningar...</a>"""
                load_more = $("<div/>").append(link)
                show_more = ->
                    load_more.detach()
                    show_next new_suspended, SLICE_SIZE
                    false
                tables.append load_more
                link.click show_more
                load_more.waypoint show_more,
                    offset: "100%"
                    triggerOnce: true
                    onlyOnScroll: true

    show_next(display_suspended, SLICE_SIZE)

    new_window = (mime, content) ->
        w = window.open(",")
        w.document.open mime, "replace"
        w.document.write content
        w.document.close()

    $("#extra_buttons").empty().append $("""<button class="btn">Visa XML</button>""").click ->
        new_window "application/xml", (new XMLSerializer()).serializeToString data
        false

    $("#result").empty().append tables

    return

