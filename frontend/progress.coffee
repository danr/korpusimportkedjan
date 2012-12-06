
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
    if -1 != data.indexOf '</result>'
        progress.clear()
        return
    else
        data += '</result>'

    try
        data = $.parseXML data
    catch e
        progress.clear()
        return

    address.set_from_xml data

    json = $.xml2json data

    if increment = _.last(json.increment)
        steps = Number increment.steps
        step = Number increment.step
        command = increment.command
        percent = if steps > 0 then step / steps * 100 else 100
        $('#progress-bar').css "width",(percent + '%')
        if command?
            $('#progress-text').localize_element
                se: "Kör kommando #{command}..."
                en: "Running command #{command}..."
        else
            $('#progress-text').localize_element
                se: ""
                en: ""
