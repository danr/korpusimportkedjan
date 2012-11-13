function dismiss_button() {
    return $('<button type="button" class="close" data-dismiss="alert">')
        .append($('<i class="icon-remove"/>'));
}

function show_errors(data) {
    var errors = data.getElementsByTagName("error")
    $.each(errors, function (_ix, error) {
        console.log(error.textContent);
        $('#errors')
            .append($('<div class="alert alert-error"/>')
                    .append(dismiss_button(),
                            $('<span>').text("Importkedjan gav följande varningar:"),
                            $('<pre class="original-pre">').text(error.textContent)));
    });
}

function submit(xml_editor,only_makefile) {

    var settings = mkJsonSetting();

    var incremental = !only_makefile;

    var text = xml_editor.getValue();

    var req_url = "http://demo.spraakdata.gu.se/dan/backend/"
        + "?settings=" + JSON.stringify(settings)
        + "&incremental=" + (incremental ? "true" : "false")
        + "&fmt=xml"
        + "&only_makefile=" + (only_makefile ? "true" : "false");

    if (incremental) {
        initialize_progress_bar();
    }

    $.ajax({
        url: req_url,
        dataType: only_makefile ? "text" : "xml",
        timeout: 300000,
        type: "POST",
        data: text,
        success: function(data, textStatus, xhr) {
            clear_progress_bar();
            if (only_makefile) {
                $('#query')
                    .append($('<div class="alert"/>')
                            .append(dismiss_button(),
                                    $('<pre class="original-pre">').text(data)));
            } else {
                show_errors(data);
                make_table(data, settings.attributes);
            }
        },
        progress: function(data, e) {
            if (incremental) {
                handle_progress(e.target.response);
            }
        },
        error: function(jqXHR, textStatus, errorThrown) {
            clear_progress_bar();
            console.log("error", jqXHR, textStatus, errorThrown);
        }
    });
    return false;
}
