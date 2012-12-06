window.with_form =
    get: () -> console.log "Error: Form not loaded!"
    set: () -> console.log "Error: Form not loaded!"
    load_defaults: () -> console.log "Error: Form not loaded!"

set_form = (schema, value) ->

    form = json_schema_form.generate schema, "settings"
    $("#form").empty().append form.dom
    form.set value

    window.with_form.set = (xml_editor, example) ->
        xml_editor.setValue example.corpus_xml
        form.set example

    window.with_form.load_defaults = () ->
        form.set value

    window.with_form.get = form.get

window.load_form = () ->

    $.ajax
        url: config.address + "/schema"
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

