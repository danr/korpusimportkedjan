$(document).ready(main);

function main() {

    // Activate tooltips
    $('.header span').tooltip({placement: "bottom"});

    // Make the form
    xml_editor = mkForm()

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
        submit(xml_editor,true);
        return false;
    });

    // Submit
    $('#text_submit').click(function () { return submit(xml_editor); });
}
