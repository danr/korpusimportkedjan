
window.progress = {}

progress.initialize = ->
    $('#progress-div').css "display", ""
    $('#progress-bar').css "width", "0%"
    $('#progress-text').text ""

progress.clear = ->
    $('#progress-div').css "display", "none"
    $('#progress-bar').css "width", "0%"
    $('#progress-text').text ""

# Returns null if it is already complete or if there is an
# error in the XML, otherwise returns the parsed xml
progress.complete_partial_xml = (data) ->
    if -1 != data.indexOf '</result>'
        return null
    else
        data += '</result>'

    try
        xml = $.parseXML data
    catch e
        return null

    return xml

progress.handle = (data) ->
    if not data = progress.complete_partial_xml(data)
        progress.clear()

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
