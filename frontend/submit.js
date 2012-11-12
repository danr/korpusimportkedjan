
function submit(xml_editor,only_makefile) {

    var settings = mkJsonSetting();

    var incremental = !only_makefile;

    var text = xml_editor.getValue();

    var req_url = "http://localhost:8051"
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
                $('#query').text(data).css("display","");
				$('#query').click(function () {
					$(this).css("display","none");
					return false;
				});
            } else {
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
