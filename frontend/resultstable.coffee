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

xml_attr_value = (x,a) -> x.attributes.getNamedItem(a).value

delay_viewport_change = () -> window.setTimeout($.fn.handleViewPortChange, 100)

# Makes a table and deptree for a sentence
# First argument is a tuple of settings, second argument is the sentence in XML
#
# tabulate_sentence :: ([Column], Bool) -> XML -> ()
tabulate_sentence = (columns, make_deptrees) -> (sent) ->
    table = $("""<table class="table table-striped table-bordered table-condensed"/>""")

    fill_table = ->
        header = $("<tr/>")
        header.append $("<th>").localize_element
            se: "ord"
            en: "word"
        header.append $ """<th>#{col.name}</th>""" for col in columns
        table.append header

        append_array_to_table table,
            for word in sent.children
                cols = for col in columns
                    $("<span/>").html col.correct xml_attr_value word, col.id
                cols.unshift $("<span/>").text word.textContent
                cols

        if make_deptrees
            sent_id = xml_attr_value sent, "id"

            deprel_div = $("<div class='drawing'/>").attr("id", sent_id).show().appendTo("body")

            outer_div = $("<div/>")
            table
                .prepend $("<tr/>")
                .append($("<td/>")
                    .attr("colspan", columns.length)
                    .css("background-color", "#FFFFFF")
                    .append(outer_div))

            render_deprel = ->
                console.log "Showing dependency tree for #{sent_id} now", deprel_div, table
                draw_brat_tree sent.children, sent_id, outer_div
                false

            outer_div.one 'inview', render_deprel

        delay_viewport_change()

    dom_load_more = $ "<div/>"
    table.append dom_load_more
    show_more = ->
        console.log "Showing more from sentence #{xml_attr_value sent, 'id'}", table
        dom_load_more.detach()
        fill_table()
        false
    dom_load_more.one 'inview', show_more

    table

# First argument is the sentence_handler (tabulate_sentence partially applied with settings),
# second argument is the current position in the XML, and the div to append to.
#
# display :: (XML -> ()) -> (XML, DOM) -> Coroutine
display = (sentence_handler) ->
    rec = (tag,div) ->
        for child in tag.children
            do ->
                header = $ "<span class='tag_header'>#{child.nodeName}</span>"
                for attr in child.attributes
                    header.append $ """
                        <span class="name">#{attr.name}</span><span class="value">#{attr.value}</span>
                    """
                footer = $ "<span class='tag_footer'>#{child.nodeName}</span><span>&nbsp;</span>"
                contents = $ "<div/>"
                closed = header.clone().removeClass("tag_header").addClass("tag_closed").hide()
                for el in [header,footer]
                    el.click ->
                        closed.show()
                        e.hide() for e in [header,contents,footer]
                        delay_viewport_change()
                closed.click ->
                    closed.hide()
                    e.show() for e in [header,contents,footer]
                    delay_viewport_change()
                div.append $("<div class='tag_outline table-bordered'/>").append closed, header, contents, footer

                if child.nodeName == "sentence"
                    contents.append sentence_handler child
                else
                    rec child, contents


window.make_table = (data, attributes) ->

    columns = for s in ["pos", "msd", "lemma", "lex", "saldo", "prefix", "suffix", "ref", "dephead", "deprel"]
        name: s
        id: s

    # Always write the word
    # columns.unshift
    #     name: "ord"
    #     id: "text"

    # Remove those columns that are not part of the generated attributes,
    columns = _.filter columns, (col) -> _.contains(attributes, col.id)

    # and remove pos if msd is present
    if _.contains(attributes, "msd")
        columns = _.reject columns, (col) -> col.id == "pos"

    # How to present the different columns (link to Karp etc)
    do ->
        correct =
            msd:    (s) -> s.split(".").join ". "
            lemma:  split_pipes _.identity
            lex:    split_pipes lemgram_link
            saldo:  split_pipes saldo_link
            prefix: split_pipes lemgram_link
            suffix: split_pipes lemgram_link

        for col in columns
            col.correct = correct[col.id] or _.identity

    # Only make dependency trees if all required attributes are present
    make_deptrees = true
    for required in ["word", "pos", "ref", "dephead", "deprel"]
        make_deptrees = make_deptrees and _.contains(attributes, required)

    do ->
        $("#result").empty().append tables_div = $ "<div/>"
        corpus = (data.getElementsByTagName "corpus")[0]
        (display tabulate_sentence columns, make_deptrees) corpus, tables_div

    new_window = (mime, content) ->
        w = window.open(",")
        w.document.open mime, "replace"
        w.document.write content
        w.document.close()

    $("#extra_buttons").empty().append $("""<button class="btn">Visa XML</button>""").click ->
        new_window "application/xml", (new XMLSerializer()).serializeToString data
        false

    delay_viewport_change()

    return

