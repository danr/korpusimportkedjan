
/* Making the form */

// Makes the form and return the editor
function mkForm() {

    // Make the xml editor
    var xml_editor = CodeMirror.fromTextArea(document.getElementById("corpus_xml"), {
        lineNumbers: true
    });

    // Make sections for word, sentence, and paragraph
    $('#dynamic').append(

        mkSection("Ord", "word_nav", [
            { id: "word_punkt_word", label: "punkt ord", active: true },
            { id: "word_whitespace", label: "blanktecken" },
            { id: "word_blanklines", label: "radbrytning" },
            { id: "word_custom", label: "egen tagg...", obj: mkTagForm("word", true) }
        ]),

        $('<hr/>'),

        mkSection("Meningar", "sentence_nav", [
            { id: "sentence_punkt_sentence", label: "punkt mening", active: true },
            { id: "sentence_whitespace", label: "radbrytning" },
            { id: "sentence_blanklines", label: "blankrader" },
            { id: "sentence_custom", label: "egen tagg...", obj: mkTagForm("sentence") }
        ]),

        $('<hr/>'),

        mkSection("Stycken", "paragraph_nav", [
            { id: "paragraph_none", label: "icke" },
            { id: "paragraph_whitespace", label: "radbrytning" },
            { id: "paragraph_blanklines", label: "blankrader", active: true },
            { id: "paragraph_custom", label: "egen tagg...", obj: mkTagForm("paragraph") }
        ]),

        $('<hr/>'),

        mkRow("Rot", mkTagForm("root", false, "text")),

        $('<hr/>'),

        mkRow("Uppmärkning", mkGenerateBoxes())

    );

	return xml_editor;

}

var attributes = ["pos", "msd", "lemma", "lex", "saldo", "prefix", "suffix", "ref", "dephead", "deprel"];

function mkGenerateBoxes() {
    var div = $('<div class="btn-group" data-toggle="buttons-checkbox" id="generate">');
    $.each(attributes,function (_ix,attr) {
        div.append($('<button type="button" class="btn active">')
                   .attr("id","generate_" + attr).text(attr));
    });
    return div;
}

function updateGenerateBoxes() {
    $('#generate').children().attr("disabled",false);
    $('.word-row').find('input:hidden').map(function () {
        var v = $(this).val();
        if (v != "custom") {
            $('#generate_' + v).attr("disabled",true).addClass("active");
        }
    });
    return false;
}

// Make a row in the form ("ord" and its buttons, and so on...)
function mkRow(left, right) {
    return $('<div class="row"/>')
        .append($('<div class="span2" style="text-align: right;"/>')
                .append($('<strong/>').css("line-height","30px").text(left)))
        .append($('<div class="span10"/>').append(right));
}

function newIcon(icon) {
    return $('<i/>').addClass(icon);
}

// Makes the new buttons in the input fields
function mkNewButton(id, positional) {
    return $('<button class="btn btn-success row-button"/>')
        .append(newIcon("icon-plus-sign"))
        .click(function () {
            var par = $(this).parent()
            par.after(mkAttribute(id, positional));
            if (par.hasClass("temp")) {
                par.remove();
            }
            return false;
        });
}

// Positional attributes select option
function mkPosOption(id) {
    var select = $('<select/>');
    function newOption(val,txt) {
        select.append($('<option/>').attr("value",val).text(txt));
    }
    newOption("custom","ny");
    $.each(attributes, function (_,a) { select.append(newOption(a,a)) });
    var span = $('<span/>').append(select);
    select.buttonSelect(true);
    return span;
}


// Makes the input field, and close and add button, possibly with initial text
function mkAttribute(id, positional, initial_ix, initial_val) {
    var initial_text = positional ? initial_ix : initial_val;
    var input = $('<input type="text"/>')
        .addClass(id + "-attribute")
        .attr('value',initial_text || "");
    var close_button = $('<button class="btn btn-danger row-button"/>')
        .append(newIcon("icon-minus-sign"))
        .click(function () {
            var grandpa = $(this).parent().parent();
            $(this).parent().remove();
            if (grandpa.children().length == 0) {
                grandpa.append($('<div class="temp">').append(mkNewButton(id, positional)));
            }
            return false;
        });
    var div = $('<div style="margin-bottom:10px;"/>').addClass(id + "-row").append(input);
    if (positional) {
        var options = mkPosOption(id);
        var sel = options.find('input:hidden');
        sel.change(updateGenerateBoxes);
        sel.val(initial_val ? initial_val : "custom").change();
        div.append(options);
    }
    return div.append(close_button,mkNewButton(id, positional));
}

function mkAttributes(id, positional, initials) {
    var div = $('<div class="controls"/>').attr("id",id + "_controls");
    if (!initials || initials.length == 0) {
        div.append($('<div class="temp">').append(mkNewButton(id, positional)));
    } else {
        $.each(initials,function (ix,val) {
            return div.append(mkAttribute(id, positional, ix, val));
        });
    }
    return div;
}

// Makes the form for tags
function mkTagForm(id, positional, initial_value) {
    return $('<div class="form-horizontal"/>')
        .append(mkControlGroupText(id + "_tag", "taggnamn:", function (div) {
			div.find('input:text').val(initial_value);
			return div;
		}))
        .append(mkControlGroupText(id + "_attr", "attribut:", function () {
            return mkAttributes(id, positional, []);
        }));

}

// Makes a section with a title and tabs, which is an array of objects like this:
// { id : "punkt_word", label : "punkt ord", obj : ..., active : true }
function mkSection(title, id, tabs) {

    var ul = $('<ul/>', {
        class: "nav btn-group",
        "data-toggle": "buttons-radio",
        id: id
    });

    // Must set overflow to visible or else popdown menus will get scrollbars
    var tab_content = $('<div class="tab-content" style="overflow:visible"/>');

    $.each(tabs, function (_index, dict) {
        return mkTabButton(ul, tab_content, dict.id, dict.label, dict.obj, dict.active);
    });

    return mkRow(title, [ul,tab_content]);
}

// Make a text input with an id and a label to a control group.
function mkControlGroupText(id, label, mod_control_div) {
    mod_control_div = mod_control_div || function (x) { return x; };
    return $('<div class="control-group"/>')
        .append($('<label class="control-label"></label>', { for: id }).text(label))
        .append(mod_control_div($('<div class="controls"><input type="text" id="' + id + '"></div>')));
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

// Makes a tab for nav.
function mkTab(id, active, obj) {
    return $('<div/>', {
        class: "tab-pane" + (active ? " active" : ""),
        id: id
    }).append(obj);
}
