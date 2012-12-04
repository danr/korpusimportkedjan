// Generated by CoffeeScript 1.4.0
(function() {
  var main;

  main = function() {
    var example, example_buttons, lang, lang_key, language_buttons, xml_editor, _ref, _ref1;
    load_form();
    init_brat();
    xml_editor = CodeMirror.fromTextArea(document.getElementById("corpus_xml"), {
      lineNumbers: true
    });
    xml_editor.setValue("En exempeltext kommer lastad. Med vadå?\n\nEn korp, en karp och ett labb!");
    example_buttons = (function() {
      var _i, _len, _results;
      _results = [];
      for (_i = 0, _len = examples.length; _i < _len; _i++) {
        example = examples[_i];
        _results.push((function(example) {
          return $("<button class=\"btn btn-small btn-info\" style=\"margin:5px;\"\">\n    <i class=\"icon-book\"></i> " + example.title + "\n</button>").click(function() {
            return with_form.set(xml_editor, example);
          });
        })(example));
      }
      return _results;
    })();
    (_ref = $("#example_buttons")).append.apply(_ref, example_buttons);
    language_buttons = (function() {
      var _i, _len, _ref1, _ref2, _results;
      _ref1 = [["se", "Svenska"], ["en", "English"]];
      _results = [];
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        _ref2 = _ref1[_i], lang_key = _ref2[0], lang = _ref2[1];
        _results.push((function(lang_key, lang) {
          return $("<button class=\"btn btn-small btn-warning\" style=\"margin:5px;\"\">\n    <i class=\"icon-flag\"></i> " + lang + "\n</button>").click(function() {
            return $.fn.set_language(lang_key);
          });
        })(lang_key, lang));
      }
      return _results;
    })();
    (_ref1 = $("#language_buttons")).append.apply(_ref1, language_buttons);
    $("#title_text").click(function() {
      with_form.load_defaults();
      return false;
    });
    $("#query").click(function() {
      $(this).text("");
      return false;
    });
    $("#show_query").click(function() {
      submit(xml_editor, "makefile");
      return false;
    });
    $("#show_settings_json").click(function() {
      $("#query").text(JSON.stringify(with_form.get(), void 0, 4));
      return false;
    });
    $("#btn_submit").click(function() {
      submit(xml_editor, "xml");
      return false;
    });
    return $.fn.set_language('se');
  };

  $(document).ready(main);

  $(function() {
    return $.reject({
      reject: {
        all: false,
        msie5: true,
        msie6: true,
        msie7: true,
        msie8: true
      },
      imagePath: "lib/jquery-reject/images/",
      display: ['firefox', 'chrome', 'safari', 'opera'],
      browserShow: true,
      browserInfo: {
        firefox: {
          text: 'Firefox',
          url: 'http://www.mozilla.com/firefox/'
        },
        safari: {
          text: 'Safari',
          url: 'http://www.apple.com/safari/download/'
        },
        opera: {
          text: 'Opera',
          url: 'http://www.opera.com/download/'
        },
        chrome: {
          text: 'Chrome',
          url: 'http://www.google.com/chrome/'
        }
      },
      header: 'Du använder en omodern webbläsare',
      paragraph1: 'Korp och annoteringslabbet använder sig av moderna webbteknologier som inte stödjs av din webbläsare. En lista på de mest populära moderna alternativen visas nedan. Firefox rekommenderas varmt.',
      paragraph2: '',
      closeMessage: 'Du kan fortsätta ändå – med begränsad funktionalitet – men så fort du önskar att Korp och annoteringslabbet vore snyggare och snabbare är det bara att installera Firefox, det tar bara en minut.',
      closeLink: 'Stäng varningen',
      closeCookie: true,
      cookieSettings: {
        path: '/',
        expires: 100000
      }
    });
  });

}).call(this);
