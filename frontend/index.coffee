$.fn.set_show = (b) -> if b then $(this).show() else $(this).hide()

main = ->

    # Make the xml editor
    xml_editor = CodeMirror.fromTextArea(document.getElementById("corpus_xml"),
        lineNumbers: true
    )

    # Make the form
    load_form(xml_editor)

    # Set the initial text
    xml_editor.setValue "En exempeltext kommer lastad. Med vadå?"

    # Add example buttons
    example_buttons = for example in examples
        do (example) ->
            $("""
                <button class="btn btn-small btn-info" style="margin:5px;"">
                    <i class="icon-book"></i> #{example.title}
                </button>""").click ->
                    with_form.set example
                    xml_editor.setValue example.corpus_xml

    $("#example_buttons").append(example_buttons...)

    language_buttons = for [lang_key, lang] in [["se", "Svenska"],["en","English"]]
        do (lang_key, lang) ->
            $("""
                <button class="btn btn-small btn-warning" style="margin:5px;"">
                    <i class="icon-flag"></i> #{lang}
                </button>""").click -> $.bbq.pushState lang: lang_key

    $("#language_buttons").append(language_buttons...)

    $("#activate_form").click   -> $.bbq.pushState advanced: true
    $("#deactivate_form").click -> $.bbq.pushState advanced: false

    $(window).bind 'hashchange', (e) ->
        lang = $.bbq.getState "lang"
        if not lang
            lang = "se"
        $.fn.set_language lang
        advanced = "true" == $.bbq.getState "advanced"
        $("#deactivate_form").set_show advanced
        $("#activate_form").set_show !advanced
        $(".advanced").set_show advanced
        $(".not-advanced").set_show !advanced

    $("#title_text").click ->
        with_form.load_defaults()
        xml_editor.setValue ""
        $.bbq.removeState "hash"
        $("#result").empty()
        false

    $("#query").click ->
        $(this).text ""
        false

    # Show query button
    $("#show_query").click ->
        submit xml_editor, true
        false

    # Show json settings button
    $("#show_settings_json").click ->
        $("#query").text JSON.stringify with_form.get(), undefined, 4
        false

    # Submit
    $(".btn_submit").click ->
        submit xml_editor
        false

    # Set initial language to Swedish. This also sets the text value of uninitialized items.
    $(window).trigger 'hashchange'

    # We used to check if we have a hash in the status bar, but now we wait for this
    # for after the form is loaded. See load_form.coffee

$(document).ready main

# Warn users that use old browsers
$ -> $.reject
    reject:
        all: false
        msie5: true
        msie6: true
        msie7: true
        msie8: true
        msie9: true
    imagePath: "lib/jquery-reject/images/"
    display: ['firefox','chrome','safari','opera']
    browserShow: true
    # Settings for which browsers to display
    browserInfo:
        firefox:
            # Text below the icon
            text: 'Firefox'
            # URL For icon/text link
            url: 'http://www.mozilla.com/firefox/'
        safari:
            text: 'Safari'
            url: 'http://www.apple.com/safari/download/'
        opera:
            text: 'Opera'
            url: 'http://www.opera.com/download/'
        chrome:
            text: 'Chrome'
            url: 'http://www.google.com/chrome/'
    # Header of pop-up window
    header: 'Du använder en omodern webbläsare'
    # Paragraph 1
    paragraph1: 'Korp och annoteringslabbet använder sig av moderna webbteknologier som inte stödjs av din webbläsare. En lista på de mest populära moderna alternativen visas nedan. Firefox rekommenderas varmt.'
    # Paragraph 2
    paragraph2: ''
     # Message displayed below closing link
    closeMessage: 'Du kan fortsätta ändå – med begränsad funktionalitet – men så fort du önskar att Korp och annoteringslabbet vore snyggare och snabbare är det bara att installera Firefox, det tar bara en minut.'
    # Text for closing link
    closeLink: 'Stäng varningen'
    # If cookies should be used to remmember if the window was closed (see cookieSettings for more options)
    closeCookie: true
    # Cookie settings are only used if closeCookie is true
    cookieSettings:
        path: '/' # Path for the cookie to be saved on (should be root domain in most cases)
        expires: 100000 # Expiration Date (in seconds), 0 (default) means it ends with the current session
