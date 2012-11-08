$(document).ready(main);

function main() {

    // Activate tooltips
    $('.header span').tooltip({placement: "bottom"});

    // Make the xml editor
    var xml_editor = CodeMirror.fromTextArea(document.getElementById("corpus_xml"), {
        lineNumbers: true
    });

    xml_editor.setValue("<text>En exempeltext kommer lastad. Med vadå?</text>");

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

    // Show query button
    $('#show_query').click(function () {
        console.log(mkJsonSetting(), JSON.stringify(mkJsonSetting()));
        submit(xml_editor,true);
        return false;
    });

    // Submit
    $('#text_submit').click(function () { return submit(xml_editor); });
}

function submit(xml_editor,only_makefile) {

    var text = xml_editor.getValue();
    var req_url = "http://localhost:8051"
        + "?settings=" + JSON.stringify(mkJsonSetting())
        + "&incremental=false"
        + "&fmt=xml"
        + "&only_makefile=" + (only_makefile ? "true" : "false")
        + "&add_root_tag=false";

    $.ajax({
        url: req_url,
        dataType: "text",
        timeout: 300000,
        type: "POST",
        data: text,
        success: function(data, textStatus, xhr) {
            if (only_makefile) {
				$('#query').text(data);
            } else {
                $('#result').text(data);
            }
        },
        error: function(jqXHR, textStatus, errorThrown) {
            console.log("error", jqXHR, textStatus, errorThrown);
        }
    });
    return false;
}
