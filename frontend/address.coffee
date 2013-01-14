
window.address = {}

window.address.set_from_xml = (data) ->
    if (build = data?.getElementsByTagName "build")?.length == 1
        new_hash = build[0].attributes.getNamedItem("hash").value
        console.log "pushing bbq hash #{new_hash}"
        $.bbq.pushState hash: new_hash

window.address.try_join_with_hash = (xml_editor) ->
    hash = $.bbq.getState "hash"
    if hash? and hash.length == 40
        submit xml_editor, false, hash

