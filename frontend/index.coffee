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
    buttons = for example in examples
        do (example) ->
            button = $("""
                <button class="btn-small btn-info" style="margin:5px;"">
                    <i class="icon-book"></i> #{example.title}
                </button>""").click ->
                    with_form.set xml_editor, example
    $("#example_buttons").append(buttons...)

    # Show query button
    $("#show_query").click ->
        submit xml_editor, "makefile"
        false

    # Submit
    $("#btn_submit").click ->
        submit xml_editor, "xml"
        false

    # Install
    $("#btn_install").click ->
        submit xml_editor, "cwb"
        false

$(document).ready main
