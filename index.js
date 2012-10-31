function main() {
    $('.header span').tooltip({placement: "bottom"});
    var codeMirror = CodeMirror.fromTextArea(document.getElementById("textarea_text"), {
        lineNumbers: true
    });
    codeMirror.setValue(examples[0].content);

    var word_tag_form = $('<div class="form-horizontal"/>')
    word_tag_form.append(mkControlGroupText("word_tag", "taggnamn:"));

    mkSection("Ord", "word_nav", [
        { id: "punkt_word", label: "punkt ord", active: true },
        { id: "whitespace", label: "blanktecken" },
        { id: "word_custom_tag", label: "egen tagg...", obj: word_tag_form }
    ]).appendTo($('#dynamic'));

    // Activate all navs
    $('ul.nav li').click(function (e) {
        e.preventDefault();
        $(this).tab('show');
    });

}

// Makes a section with a title and tabs, which is an array of objects like this:
// { id : "punkt_word", label : "punkt ord", obj : ..., active : true }
function mkSection(title, id, tabs) {

    var ul = $('<ul/>', {
        class: "nav btn-group",
        "data-toggle": "buttons-radio",
        id: id
    });

    var tab_content = $('<div class="tab-content"/>');

    $.each(tabs, function (_index, dict) {
        return mkTabButton(ul, tab_content, dict.id, dict.label, dict.obj, dict.active);
    });

    return $('<div/>', { class: "span12" })
        .append($('<h3>' + title + '</h3>'))
        .append(ul)
        .append(tab_content);
}

// Make a text input with an id and a label to a control group.
function mkControlGroupText(id, label) {
    var lbl  = $('<label class="control-label"></label>', { for: id }).text(label);
    var cdiv = $('<div class="controls"><input type="text" id="' + id + '"></div>');
    return $('<div class="control-group"/>').append(lbl,cdiv);
}

// Adds a button and an empty tab to a nav.
function mkTabButton(bar, tab_content, id, text, obj, active) {
    bar.append(mkButton("#"+id, text, active));
    tab_content.append(mkTab(id, active, obj));
}

// Makes a li button for nav.
function mkButton(href, text, active) {
    return $('<li/>', {
        class: "btn" + (active ? " active" : ""),
        href: href,
        text: text
    });
}

// Makes an tab for nav.
function mkTab(id, active, obj) {
    return $('<div/>', {
        class: "tab-pane" + (active ? " active" : ""),
        id: id
    }).append(obj);
}

$(document).ready(main);
