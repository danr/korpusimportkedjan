
window.address = {}

window.address.set_from_xml = (data) ->
    if (build = data.getElementsByTagName "build").length == 1
        window.location.hash = build[0].attributes.getNamedItem("hash").value

window.address.try_join_with_hash = () ->
    if window.location.hash.length == 41 and window.location.hash[0] == '#'
        submit undefined, false, window.location.hash[1..]

