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

function submit(xml_editor,format) {

    var settings = mkJsonSetting();

    var incremental = format != "makefile";

    var text = xml_editor.getValue();

    var req_url = "http://localhost:8051"
        + "?settings=" + JSON.stringify(settings)
        + "&incremental=" + (incremental ? "true" : "false")
        + "&format=" + format

    if (incremental) {
        progress.initialize();
    }

    $.ajax({
        url: req_url,
        dataType: (format == "makefile") ? "text" : "xml",
        timeout: 300000,
        type: "POST",
        data: text,
        success: function(data, textStatus, xhr) {
            progress.clear();
			/*
            xml_data = (new XMLSerializer()).serializeToString(data);
			console.log(xml_data);
			*/
            if (format == "makefile") {
                $('#query')
                    .append($('<div class="alert"/>')
                            .append(dismiss_button(),
                                    $('<pre class="original-pre">').text(data)));
            } else if (format == "cwb") {
				$('#result').empty().append(
					$('<a href="http://localhost/app"/>').text("Visa korpusen i Korp"));
			} else {
                show_errors(data);
                make_table(data, settings.attributes);
            }
        },
        progress: function(data, e) {
            if (incremental) {
                progress.handle(e.target.response);
            }
        },
        error: function(jqXHR, textStatus, errorThrown) {
            progress.clear();
            console.log("error", jqXHR, textStatus, errorThrown);
        }
    });
    return false;
}
