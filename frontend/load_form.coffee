window.loadExample = () -> console.log "Error: Form not loaded!"
window.mkJsonSetting = () -> console.log "Error: Form not loaded!"

set_form = (schema, value) ->

    form = json_schema_form.generate schema, "settings"
    $("#form").empty().append form.dom
    form.set value

    window.loadExample = (xml_editor, example) ->
        xml_editor.setValue example.corpus_xml
        form.set example

    window.mkJsonSetting = form.get

window.load_form = () ->

    $.ajax
        url: "http://localhost:8051"
        data:
            format: "schema"
        dataType: "json"
        timeout: 300000
        type: "GET"
        success: (data, textStatus, xhr) ->
            schema = json_schema_utils.flatten_singleton_unions json_schema_utils.follow_references data
            defaults = json_schema_utils.get_default schema
            console.log schema, defaults
            set_form schema, defaults
        error: (info...) ->
            console.log info

