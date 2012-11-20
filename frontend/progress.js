
function initialize_progress_bar() {
    $('#progress-div').css("display","");
    $('#progress-bar').css("width","0%");
    $('#progress-text').text("");
}

function clear_progress_bar() {
    $('#progress-div').css("display","none");
    $('#progress-bar').css("width","0%");
    $('#progress-text').text("");
}

function handle_progress(data) {
    var finished = data.indexOf('</result>') != -1;
    if (finished) {
        clear_progress_bar();
    } else {
        if (data.indexOf('</incremental>') == -1) {
            data = data + '</incremental>';
        }
        data = data + '</result>';
        var json = $.xml2json(data);
        var progress = 100;
        var command = ""
        var i = json.incremental;
        if (i) {
            var steps = Number(i.steps) + 1;
            var step = 0;
            if (i.increment) {
                var ilen = i.increment.length;
                if (ilen > 0) {
                    step = i.increment[ilen-1].step;
                    command = i.increment[ilen-1].command;
                }
            }
            progress = (steps > 0) ? (step / steps * 100) : 100;
            if (command && command != "undefined") {
                $('#progress-text').text("Kör kommando " + command + "...");
            } else {
                $('#progress-text').text("");
            }
            console.log("Progress, step:", step, " steps:", steps, " progress:", progress, " command:", command)
            $('#progress-bar').css("width",progress + '%');
        } else {
            console.log("Progress: no incremental tag in ", data);
        }
    }
}
