function main() {
    // Activate tooltips
    $('.header span').tooltip({placement: "bottom"});

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
            { id: "word_custom", label: "egen tagg...", obj: mkTagForm("word") }
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

        mkRow("Rot", mkTagForm("root"))

    );

    // Activate all navs
    $('ul.nav li').click(function (e) {
        e.preventDefault();
        $(this).tab('show');
    });

    // Add example buttons
    $.each(examples, function (idx, val) {
        var button_id = "example" + idx;
        $('<button class="btn btn-small btn-info" style="margin:5px"/>')
            .attr("id",button_id)
            .text(" " + val.corpus)
            .prepend($('<i class="icon-book"/>'))
            .appendTo('#example_buttons');
        $('#' + button_id).click(function () {
            loadExample(xml_editor, examples[idx]);
        })
    });
}

/* Making the Json object */

// str is one of "word", "sentence", "paragraph"
function activeTab(str) {
    var targets = $('ul .active').map(function () { return this.dataset.target; });
    var res = null;
    targets.map(function () {
        if (this.indexOf("#" + str) == 0) {
            res = this.slice(this.indexOf('_') + 1);
        }
    });
    return res;
}

function tagSetting(str) {
    return {
        tag: $('#' + str + '_tag').val(),
        attributes: $('.' + str + '-attribute').map(function () { return $(this).val(); }).get()
    };
}


// str is one of "word", "sentence", "paragraph"
function segmenterSetting(str) {
    var active = activeTab(str);
    if (active.indexOf('custom') != -1) {
		return tagSetting(str);
    } else {
        return active;
    }
}

function mkJsonSetting() {
    return {
        corpus: "",
        word_segmenter: segmenterSetting('word'),
        sentence_segmenter: segmenterSetting('sentence'),
        paragraph_segmenter: segmenterSetting('paragraph'),
        root_tag: tagSetting('root'),
        extra_tags:
        [
            { tag: "kaptiel",
              attributes: ["namn"]
            }
        ],
        attributes: ["word", "pos", "msd", "lemma", "lex", "saldo", "prefix", "suffix", "ref", "dephead", "deprel"]
    };
}

/* Loads an example and sets the form accordingly */
function loadExample(xml_editor, ex) {

	function setTag(t,v) {
        $("#" + t + "_tag").val(v.tag);
		$("#" + t + "_controls").replaceWith(mkAttributes(t,v.attributes));
	}

	setTag("root",ex.root);

    $.each(["word","sentence","paragraph"], function(_ix,segmenter) {
        v = ex[segmenter + "_segmenter"];
        if (typeof v == "string") {
            var tabstring = v;
        } else {
            var tabstring = 'custom';
        }
		setTag(segmenter,v);
        var tab = $('li[data-target=#' + segmenter + "_" + tabstring + ']');
        tab.tab('show');
        tab.addClass('active');

    });
    xml_editor.setValue(ex.corpus_xml);
}

/* Making the form */

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
function mkNewButton(id) {
    return $('<button class="btn btn-success row-button"/>')
		.append(newIcon("icon-plus-sign"))
        .click(function () {
			var par = $(this).parent()
            par.after(mkAttribute(id));
			if (par.hasClass("temp")) {
				par.remove();
			}
            return false;
        });
};

// Makes the input field, and close and add button, possibly with initial text
function mkAttribute(id, initial_text) {
	var input = $('<input type="text"/>')
		.addClass(id + "-attribute")
		.attr('value',initial_text || "");
    var close_button = $('<button class="btn btn-danger row-button"/>')
		.append(newIcon("icon-minus-sign"))
        .click(function () {
            var grandpa = $(this).parent().parent();
            $(this).parent().remove();
            if (grandpa.children().length == 0) {
                grandpa.append($('<div class="temp">').append(mkNewButton(id)));
            }
            return false;
        });
    return $('<div style="margin-bottom:10px;"/>')
		.addClass(id + "-row")
		.append(input,close_button,mkNewButton(id));
}

function mkAttributes(id, texts) {
	var div = $('<div class="controls"/>').attr("id",id + "_controls");
	if (!texts || texts.length == 0) {
		div.append($('<div class="temp">').append(mkNewButton(id)));
	} else {
		texts.map(function (text) { return div.append(mkAttribute(id,text)); });
	}
	return div;
}

// Makes the form for tags
function mkTagForm(id) {
    return $('<div class="form-horizontal"/>')
        .append(mkControlGroupText(id + "_tag", "taggnamn:"))
        .append(mkControlGroupText(id + "_attr", "attribut:", function () {
			return mkAttributes(id, [""]);
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

    var tab_content = $('<div class="tab-content"/>');

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

$(document).ready(main);
