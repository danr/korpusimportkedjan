
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

# How to present the different columns (link to Karp etc)
display_column = do ->
    lookup =
        msd:    (s) -> s.split(".").join ". "
        lemma:  split_pipes _.identity
        lex:    split_pipes lemgram_link
        saldo:  split_pipes saldo_link
        prefix: split_pipes lemgram_link
        suffix: split_pipes lemgram_link
    (attr) -> lookup[attr] or _.identity

# Makes a table and deptree for a sentence
# First argument is a tuple of settings, second argument is the sentence in XML
#
# tabulate_sentence :: ([Column], Bool) -> XML -> IO ()
tabulate_sentence = (attributes, make_deptrees) -> (sent) ->
    table = $("""<table class="table table-striped table-bordered table-condensed"/>""")

    fill_table = ->

        prepend_to_table = (div) ->
            table
                .prepend $("<tr/>")
                .append($("<td/>")
                    .attr("colspan", attributes.length + 1)  # word is not in attributes list
                    .css("background-color", "#FFFFFF")
                    .append(div))

        append_array_to_table = (array) ->
            table.append (for row in array
                $("<tr/>").append (for col in row
                    $("<td>").append(col)
                )...
            )...

        # Add header
        table.append $("<tr/>").append [
                $("<th>").localize_element { se: "ord", en: "word" }
            ].concat(
                _.map attributes, (attr) -> $("<th>#{attr}</th>")
            )...

        # The info div on the top
        info_div = $('<div style="padding-left: 24px"/>')

        # Write information about the words and their attributes
        append_array_to_table _.map $(sent).children(),
            (word) ->
                [$("<span/>").text word.textContent].concat _.map attributes,
                    (attr) ->
                        value = xml_attr_value word, attr
                        span = $("<span/>").html (display_column attr) value
                        if _.contains(["pos","deprel","msd"], attr)
                            loc = localization_info attr, value
                            span.hover -> info_div.localize_element loc
                        span

        if make_deptrees

            iframe = $('<iframe src="deptrees/index.html">')

            prepend_to_table iframe

            iframe.load ->

                try
                    i_window = iframe.get(0).contentWindow

                    json_sent = i_window.sentence_xml_to_json sent

                    console.log json_sent

                    i_window.draw_deptree.call i_window, json_sent, (msg) ->
                        [[k,v]] = _.pairs msg
                        info_div.localize_element localization_info k,v
                catch e
                    console.log e

                delay_viewport_change()

        prepend_to_table info_div

        delay_viewport_change()

    table.append $("<div style='height: 30px'/>").one 'inview', ->
        # console.log "Showing more from sentence #{xml_attr_value sent, 'id'}", table
        $(this).detach()
        fill_table()
        false

# First argument is the sentence_handler (tabulate_sentence partially applied with settings),
# second argument is the current position in the XML, and the div to append to.
#
# display :: (XML -> IO ()) -> (XML, DOM) -> IO ()
display = (sentence_handler) ->
    disabled = $("#show_tags").attr("checked") isnt "checked"
    rec = (tag,div) -> for child in $(tag).children()
        do (child) ->
            header = $ "<span class='tag_header'>#{child.nodeName}</span>"
            for attr in child.attributes
                header.append $ """
                    <span class="name">#{attr.name}</span><span class="value">#{attr.value}</span>
                """
            xml_button = $("<span class='tag_xmlbutton'>XML</span>").localize_element(
                    en: "Show XML"
                    se: "Visa XML"
                ).click ->
                    new_window (new XMLSerializer()).serializeToString child
                    false

            closed = header.clone().removeClass("tag_header").addClass("tag_closed").addClass("hide")
            footer = $ """
                <span class='tag_floatfix'>&nbsp;</span>
                <span class='tag_footer'>#{child.nodeName}</span>
            """
            contents = $ "<div width='100%'/>"
            outline = $("<div width='100%' class='tag_outline table-bordered'/>")
                .append closed, header, xml_button, contents, footer
            fields = [header,footer,xml_button]

            if disabled
                e.addClass("disabled") for e in [outline].concat(fields)

            div.append outline

            for el in [header,footer]
                el.click ->
                    closed.removeClass("hide")
                    e.addClass("hide") for e in [contents].concat(fields)
                    delay_viewport_change()

            closed.click ->
                closed.addClass("hide")
                e.removeClass("hide") for e in [contents].concat(fields)
                delay_viewport_change()

            if child.nodeName == "sentence"
                outline.addClass "tag_sentence"
                contents.append sentence_handler child
            else
                rec child, contents

$(document).ready ->
    $("#show_tags").change ->
        disabled = $(this).attr("checked") is "checked"
        query = $(".tag_header,.tag_xmlbutton,.tag_outline,.tag_footer,.tag_floatfix")
        if disabled
            query.removeClass("disabled")
        else
            query.addClass("disabled")
    return

new_window = (content) ->
    w = window.open '', '_blank'
    w.document.open "text/plain", "replace"
    # This will make a body tag in the document
    w.document.write "hello"
    # Replace the body with the content
    $("body", w.document).empty().append($("<pre/>").text(content))
    # Without this, Firefox thinks the page is already loaded
    w.document.close()


window.make_table = (data) ->

    attributes = []

    words = data.getElementsByTagName("w")
    if words.length > 0
        for attr in words[0].attributes
            attributes.push attr.name

    # Only make dependency trees if all required attributes are present
    make_deptrees = _.all ["pos", "ref", "dephead", "deprel"], (attr) -> _.contains(attributes, attr)

    # Then remove pos if msd is present
    if _.contains(attributes, "msd")
        attributes = _.without attributes, "pos"

    do ->
        $("#result").empty().append tables_div = $ "<div/>"
        corpus = (data.getElementsByTagName "corpus")[0]
        (display tabulate_sentence attributes, make_deptrees) corpus, tables_div

    $("#extra_buttons").empty().append $("""<button class="btn">XML</button>""").click ->
        new_window (new XMLSerializer()).serializeToString data
        false

    delay_viewport_change()

    address.set_from_xml data

    return

