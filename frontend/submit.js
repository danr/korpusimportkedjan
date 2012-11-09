
function submit(xml_editor,only_makefile) {

	settings = mkJsonSetting();

    var text = xml_editor.getValue();
    var req_url = "http://localhost:8051"
        + "?settings=" + JSON.stringify(settings)
        + "&incremental=true"
        + "&fmt=xml"
        + "&only_makefile=" + (only_makefile ? "true" : "false")
        + "&add_root_tag=false";

    $('#progress-div').css("display","");
	$('#progress-bar').css("width","0%");

    $.ajax({
        url: req_url,
        dataType: "text",
        timeout: 300000,
        type: "POST",
        data: text,
        success: function(data, textStatus, xhr) {
            console.log("Success:", data)
            var res = make_table(data, settings.attributes);
            $('#result').empty().append(res.table);
            res.deptrees.map(function (fn) { fn(); });
        },
        progress: function(data, e) {
			console.log("Progress!", e.target.response);
            handle_progress(e.target.response);
        },
        error: function(jqXHR, textStatus, errorThrown) {
            console.log("error", jqXHR, textStatus, errorThrown);
        }
    });
    return false;
}
