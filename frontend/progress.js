
function initialize_progress_bar() {
    $('#progress-div').css("display","");
    $('#progress-bar').css("width","0%");
    $('#progress-text').text("");
}

function clear_progress_bar() {
    $('#progress-div').css("display","none");
}

function handle_progress(data) {
    var finished = data.indexOf('</result>') != -1;
    if (finished) {
        clear_progress_bar();
    } else {
        data = data + '</incremental></result>';
        var json = $.xml2json(data);
        var progress = 100;
        var command = ""
        var i = json.incremental;
        if (i) {
            var steps = i.steps;
            var step = 0;
            if (i.increment) {
                var ilen = i.increment.length;
                if (ilen > 0) {
                    step = ilen;
                    command = i.increment[ilen-1].command;
                }
            }
            progress = (steps > 0) ? (step / steps * 100) : 100;
            $('#progress-text').text("Kör kommando " + command + "...");
        }
        $('#progress-bar').css("width",progress + '%');
    }
}
