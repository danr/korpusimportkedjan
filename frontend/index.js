$(document).ready(main);

function s(str, pos, ref, head, rel) {
    var res = new String(str);
    res.pos = pos;
    res.ref = ref;
    res.dephead = head;
    res.deprel = rel;
    return res;
}

function main() {

    // Make the form
    load_form();

    // Initialize brat
    init_brat();

    // Activate tooltips
    $('.header span').tooltip({placement: "bottom"});

    // Make the xml editor
    var xml_editor = CodeMirror.fromTextArea(document.getElementById("corpus_xml"), {
        lineNumbers: true
    });


    // Set the initial text
    xml_editor.setValue("En exempeltext kommer lastad. Med vadå?");

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
        submit(xml_editor, "makefile");
        return false;
    });

    // Submit
    $('#btn_submit').click(function () {
		submit(xml_editor, "xml");
        return false;
    });

    // Install
    $('#btn_install').click(function () {
        submit(xml_editor, "cwb");
        return false;
    });
}
