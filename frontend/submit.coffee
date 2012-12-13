dismiss_button = ->
    $("""
        <button type="button" class="close" data-dismiss="alert">
            <i class="icon-remove"></i>
        </button>
    """)

show_errors = (data) ->
    errors = data.getElementsByTagName("error")
    for error in errors
        console.log error.textContent
        error_div = $ """<div class="alert alert-error"/>"""
        error_div.append dismiss_button(), $("""
            <span>Importkedjan gav följande varningar:</span>
            <pre class="original-pre">#{error.textContent}</pre>
        """)
        $("#errors").append error_div
    return

window.submit = (xml_editor, makefile=false, join_with_hash=null) ->

    settings = with_form.get()

    incremental = not makefile

    text = if join_with_hash then "" else xml_editor.getValue()

    req_url = config.address

    if join_with_hash
        req_url += "/join?hash=" + join_with_hash
    else
        if makefile
            req_url += "/makefile"
        req_url += "?settings=" + JSON.stringify(settings)

    req_url += "&incremental=" + (String incremental)

    progress.initialize() if incremental

    set = false
    set_form_and_editor_when_joining = (data_lazy) ->
        if not set and join_with_hash and data = data_lazy()
            set = true
            window.first_data = data
            if settings = data.getElementsByTagName("settings")?[0]?.textContent
                with_form.set JSON.parse settings
            if original = data.getElementsByTagName("original")?[0]?.textContent
                xml_editor.setValue original

    $.ajax
        url: req_url
        dataType: if makefile then "text" else "xml"
        timeout: 300000
        type: "POST"
        data: text
        success: (data, textStatus, xhr) ->
            set_form_and_editor_when_joining -> data
            progress.clear()
            if makefile
                $("#query").text data
            else
                show_errors data
                make_table data
            return

        progress: (data, e) ->
            set_form_and_editor_when_joining -> progress.complete_partial_xml(e.target.response)
            progress.handle e.target.response if incremental

        error: (jqXHR, textStatus, errorThrown) ->
            progress.clear()
            console.log "error", jqXHR, textStatus, errorThrown

    false
