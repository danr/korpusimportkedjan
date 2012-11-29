
# The language key is stored in this private variable
language_key = 'se'
fallback_key = 'en'

# Localizes elements with the current language_key, or with the provided one specified
jQuery.fn.localize = () ->
    # console.log "Localizing ", $(this), " with language key #{language_key}"
    data_loc = "data-loc-#{language_key}"
    data_loc_fallback = "data-loc-#{fallback_key}"
    localize_element = (el) ->
        el = $(el)
        if el.attr data_loc
            el.text el.attr data_loc
        else if el.attr data_loc_fallback
            el.text el.attr data_loc_fallback
    $(this).find("[#{data_loc}]").each (_key, el) -> localize_element el
    localize_element $(this)
    $(this)

# Set the language key (typically to 'en' or 'se'), and change all values
jQuery.fn.set_language = (new_language_key, new_fallback_key) ->
    language_key = new_language_key
    fallback_key ?= new_fallback_key
    $("body").localize()

