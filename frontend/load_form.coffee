window.with_form =
    get: () -> {}
    set: () -> console.log "Error: Form not loaded!"
    load_defaults: () -> {}

set_form = (schema, value) ->

    form = json_schema_form.generate schema, "settings"
    $("#form").empty().append form.dom
    form.set value

    window.with_form.set = form.set

    window.with_form.load_defaults = () ->
        form.set value

    window.with_form.get = form.get


window.load_form = (xml_editor) ->

    $.ajax
        url: config.address + "/schema"
        dataType: "json"
        timeout: 300000
        type: "GET"
        success: (data, textStatus, xhr) ->
            schema = json_schema_utils.flatten_singleton_unions json_schema_utils.follow_references data
            defaults = json_schema_utils.get_default schema
            set_form schema, defaults

            # Check if we have a hash in the status bar, if so, load it
            address.try_join_with_hash(xml_editor)
        error: (info...) ->
            console.log info

