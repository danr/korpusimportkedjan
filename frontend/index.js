// Generated by CoffeeScript 1.4.0
(function() {
  var main;

  main = function() {
    var buttons, example, xml_editor, _ref;
    load_form();
    init_brat();
    xml_editor = CodeMirror.fromTextArea(document.getElementById("corpus_xml"), {
      lineNumbers: true
    });
    xml_editor.setValue("En exempeltext kommer lastad. Med vadå?");
    buttons = (function() {
      var _i, _len, _results;
      _results = [];
      for (_i = 0, _len = examples.length; _i < _len; _i++) {
        example = examples[_i];
        _results.push((function(example) {
          var button;
          return button = $("<button class=\"btn-small btn-info\" style=\"margin:5px;\"\">\n    <i class=\"icon-book\"></i> " + example.title + "\n</button>").click(function() {
            return with_form.set(xml_editor, example);
          });
        })(example));
      }
      return _results;
    })();
    (_ref = $("#example_buttons")).append.apply(_ref, buttons);
    $("#show_query").click(function() {
      submit(xml_editor, "makefile");
      return false;
    });
    $("#btn_submit").click(function() {
      submit(xml_editor, "xml");
      return false;
    });
    return $("#btn_install").click(function() {
      submit(xml_editor, "cwb");
      return false;
    });
  };

  $(document).ready(main);

}).call(this);
