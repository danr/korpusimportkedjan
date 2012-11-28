
add_example_button = (key, example) ->
    example_button = $("""<button class="btn btn-info">#{key}</button>""").click () ->
        load_example example
        false
    $("#examples").append example_button

load_example = (example) ->
    form = json_schema_form.generate example.schema, "settings"
    $("#form").empty().append form.dom
    form.set example.value
    $('#get_set').unbind('click').click () ->
        v = form.get()
        $('#result').text JSON.stringify v
        form.set v
    $('#get').unbind('click').click () ->
        v = form.get()
        console.log v
        console.log JSON.stringify v
        $('#result').text JSON.stringify v

$(window.document).ready () ->

    $.ajax
        url: "http://localhost:8051"
        data:
            format: "schema"
        dataType: "json"
        timeout: 300000
        type: "GET"
        success: (data, textStatus, xhr) ->
            schema = json_schema_utils.flatten_singleton_unions json_schema_utils.follow_references data
            console.log schema
            example =
                schema: schema
                value: json_schema_utils.get_default schema
            add_example_button 'annoteringslabbet', example
            load_example example
        error: (info...) ->
            console.log info

    add_example_button key, json_schema_form.examples[key] for key of json_schema_form.examples

    load_example json_schema_form.examples.array

