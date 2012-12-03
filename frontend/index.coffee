main = ->

    # Make the form
    load_form()

    # Initialize brat
    init_brat()

    # Make the xml editor
    xml_editor = CodeMirror.fromTextArea(document.getElementById("corpus_xml"),
        lineNumbers: true
    )

    # Set the initial text
    xml_editor.setValue "En exempeltext kommer lastad. Med vadå?"

    # Add example buttons
    example_buttons = for example in examples
        do (example) ->
            $("""
                <button class="btn btn-small btn-info" style="margin:5px;"">
                    <i class="icon-book"></i> #{example.title}
                </button>""").click ->
                    with_form.set xml_editor, example

    $("#example_buttons").append(example_buttons...)

    language_buttons = for [lang_key, lang] in [["se", "Svenska"],["en","English"]]
        do (lang_key, lang) ->
            $("""
                <button class="btn btn-small btn-warning" style="margin:5px;"">
                    <i class="icon-flag"></i> #{lang}
                </button>""").click ->
                    $.fn.set_language(lang_key)

    $("#language_buttons").append(language_buttons...)

    $("#query").click ->
        $(this).text ""
        false

    # Show query button
    $("#show_query").click ->
        submit xml_editor, "makefile"
        false

    # Show json settings button
    $("#show_settings_json").click ->
        $("#query").text JSON.stringify with_form.get(), undefined, 4
        false

    # Submit
    $("#btn_submit").click ->
        submit xml_editor, "xml"
        false

    # Set initial language to Swedish. This also sets the text value of uninitialized items.
    $.fn.set_language('se')

$(document).ready main
