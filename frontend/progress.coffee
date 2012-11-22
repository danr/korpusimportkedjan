
window.progress = {}

progress.initialize = ->
    $('#progress-div').css "display", ""
    $('#progress-bar').css "width", "0%"
    $('#progress-text').text ""

progress.clear = ->
    $('#progress-div').css "display", "none"
    $('#progress-bar').css "width", "0%"
    $('#progress-text').text ""

progress.handle = (data) ->
    finished = -1 != data.indexOf '</result>'

    if finished
        progress.clear()
        return

    if -1 == data.indexOf '</incremental>'
        data += '</incremental>'
    data += '</result>'

    json = $.xml2json data
    percent = 100
    command = ""
    i = json.incremental

    if i
        steps = (Number i.steps) + 1
        step = 0
        if i.increment
            ilen = i.increment.length
            if ilen > 0
                step = i.increment[ilen-1].step
                command = i.increment[ilen-1].command
        percent = if steps > 0 then step / steps * 100 else 100
        if command?
            $('#progress-text').text "Kör kommando #{command}..."
        else
            $('#progress-text').text ""
        $('#progress-bar').css "width",(percent + '%')
