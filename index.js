function main() {
    $('.header span').tooltip({placement: "bottom"});
    var xml_editor = CodeMirror.fromTextArea(document.getElementById("corpus_xml"), {
        lineNumbers: true
    });

    mkSection("Ord", "word_nav", [
        { id: "word_punkt", label: "punkt ord", active: true },
        { id: "word_whitespace", label: "blanktecken" },
        { id: "word_blanklines", label: "radbrytning" },
        { id: "word_custom", label: "egen tagg...", obj: mkTagForm("word_tag") }
    ]).appendTo($('#dynamic'));

    mkSection("Meningar", "sentence_nav", [
        { id: "sentence_punkt", label: "punkt mening", active: true },
        { id: "sentence_whitespace", label: "radbrytning" },
        { id: "sentence_blanklines", label: "blankrader" },
        { id: "sentence_custom", label: "egen tagg...", obj: mkTagForm("sentence_tag") }
    ]).appendTo($('#dynamic'));

    mkSection("Stycken", "paragraph_nav", [
        { id: "paragraph_none", label: "icke" },
        { id: "paragraph_whitespace", label: "radbrytning" },
        { id: "paragraph_blanklines", label: "blankrader", active: true },
        { id: "paragraph_custom", label: "egen tagg...", obj: mkTagForm("paragraph_tag") }
    ]).appendTo($('#dynamic'));


    // Activate all navs
    $('ul.nav li').click(function (e) {
        e.preventDefault();
        $(this).tab('show');
    });

    $.each(examples, function (idx, val) {
        var button_id = "example" + idx;
        var foo = $('<button class="btn btn-small"/>')
            .attr("id",button_id)
            .text(val.title)
            .appendTo('#example_buttons');
        $('#' + button_id).click(function () {
            console.log("click!");
            loadExample(xml_editor, examples[idx]);
        })
    });
}

function loadExample(xml_editor, ex) {
    $.each(ex, function (k,v) {
        var is_nav = k.indexOf("nav") != -1;
        if (k == "corpus_xml") {
            xml_editor.setValue(v);
        } else if (is_nav) {
            var tab = $('li[data-target=#' + v + ']');
            tab.tab('show');
            tab.addClass('active');
        } else if (k != "title") {
            $('#' + k).val(v);
        }
    });
}

function mkTagForm(id) {
    return $('<div class="form-horizontal"/>').append(mkControlGroupText(id, "taggnamn:"));
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
function mkButton(data_target, text, active) {
    return $('<li/>', {
        class: "btn" + (active ? " active" : ""),
        "data-target": data_target,
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
