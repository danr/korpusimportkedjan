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

window.submit = (xml_editor, format) ->

    settings = with_form.get()

    incremental = format isnt "makefile"

    text = xml_editor.getValue()

    req_url = "http://localhost:8051" +
        "?settings=" + JSON.stringify(settings) +
        "&incremental=" + (String incremental) +
        "&format=" + format

    progress.initialize() if incremental

    $.ajax
        url: req_url
        dataType: if format is "makefile" then "text" else "xml"
        timeout: 300000
        type: "POST"
        data: text
        success: (data, textStatus, xhr) ->
            progress.clear()
            if format is "makefile"
                $("#query").append $("""<div class="alert"/>""").append(dismiss_button(), $ """<pre class="original-pre">#{data}</pre>""")
            else if format is "cwb"
                $("#result").empty().append $ """<a href="http://localhost/app">Visa korpusen i Korp</a>"""
            else
                show_errors data
                make_table data, settings.attributes
            return

        progress: (data, e) ->
            progress.handle e.target.response if incremental

        error: (jqXHR, textStatus, errorThrown) ->
            progress.clear()
            console.log "error", jqXHR, textStatus, errorThrown

    false
