// Generated by CoffeeScript 1.4.0
(function() {
  var delay_viewport_change, display, display_column, lemgram_link, new_window, saldo_link, split_pipes, tabulate_sentence, xml_attr_value;

  split_pipes = function(f) {
    return function(s) {
      var a, sp;
      sp = (s === "|" ? "" : s.substring(1, s.length - 1));
      a = sp.split("|");
      if (a.join("")) {
        return _.map(a, f).join(", ");
      } else {
        return "&nbsp;";
      }
    };
  };

  saldo_link = function(s) {
    return "<a target=\"_blank\" href=\"" + config.karp_address + "#search=sense%7C" + s + "\">" + s + "</a>";
  };

  lemgram_link = function(s) {
    return "<a target=\"_blank\" href=\"" + config.karp_address + "#search=lemgram%7C" + s + "\">" + s + "</a>";
  };

  xml_attr_value = function(x, a) {
    return x.attributes.getNamedItem(a).value;
  };

  delay_viewport_change = function() {
    return window.setTimeout($.fn.handleViewPortChange, 100);
  };

  display_column = (function() {
    var lookup;
    lookup = {
      msd: function(s) {
        return s.split(".").join(". ");
      },
      lemma: split_pipes(_.identity),
      lex: split_pipes(lemgram_link),
      saldo: split_pipes(saldo_link),
      prefix: split_pipes(lemgram_link),
      suffix: split_pipes(lemgram_link)
    };
    return function(attr) {
      return lookup[attr] || function(x) {
        if (x === "") {
          return '&nbsp;';
        } else {
          return x;
        }
      };
    };
  })();

  tabulate_sentence = function(attributes, make_deptrees) {
    return function(sent) {
      var fill_table, table;
      table = $("<table class=\"table table-striped table-bordered table-condensed\"/>");
      fill_table = function() {
        var append_array_to_table, iframe, info_div, prepend_to_table, _ref;
        prepend_to_table = function(div) {
          return table.prepend($("<tr/>").append($("<td/>").attr("colspan", attributes.length + 1).css("background-color", "#FFFFFF").append(div)));
        };
        append_array_to_table = function(array) {
          var col, row;
          return table.append.apply(table, (function() {
            var _i, _len, _ref, _results;
            _results = [];
            for (_i = 0, _len = array.length; _i < _len; _i++) {
              row = array[_i];
              _results.push((_ref = $("<tr/>")).append.apply(_ref, (function() {
                var _j, _len1, _results1;
                _results1 = [];
                for (_j = 0, _len1 = row.length; _j < _len1; _j++) {
                  col = row[_j];
                  _results1.push($("<td>").append(col));
                }
                return _results1;
              })()));
            }
            return _results;
          })());
        };
        table.append((_ref = $("<tr/>")).append.apply(_ref, [
          $("<th>").localize_element({
            se: "ord",
            en: "word"
          })
        ].concat(_.map(attributes, function(attr) {
          return $("<th>" + attr + "</th>");
        }))));
        info_div = $('<div style="padding-left: 24px"/>');
        append_array_to_table(_.map($(sent).children(), function(word) {
          return [$("<span/>").text(word.textContent)].concat(_.map(attributes, function(attr) {
            var loc, span, value;
            value = xml_attr_value(word, attr);
            span = $("<span/>").html((display_column(attr))(value));
            if (_.contains(["pos", "deprel", "msd"], attr)) {
              loc = localization_info(attr, value);
              span.hover(function() {
                return info_div.localize_element(loc);
              });
            }
            return span;
          }));
        }));
        if (make_deptrees) {
          iframe = $('<iframe src="deptrees/index.html">');
          prepend_to_table(iframe);
          iframe.load(function() {
            var i_window, json_sent;
            try {
              i_window = iframe.get(0).contentWindow;
              json_sent = i_window.sentence_xml_to_json(sent);
              i_window.draw_deptree.call(i_window, json_sent, function(msg) {
                var k, v, _ref1;
                _ref1 = _.pairs(msg)[0], k = _ref1[0], v = _ref1[1];
                return info_div.localize_element(localization_info(k, v));
              });
            } catch (e) {
              console.log(e);
            }
            return delay_viewport_change();
          });
        }
        prepend_to_table(info_div);
        return delay_viewport_change();
      };
      return table.append($("<div style='height: 30px'/>").one('inview', function() {
        $(this).detach();
        fill_table();
        return false;
      }));
    };
  };

  display = function(sentence_handler) {
    var disabled, rec;
    disabled = $("#show_tags").attr("checked") !== "checked";
    return rec = function(tag, div) {
      var child, _i, _len, _ref, _results;
      _ref = $(tag).children();
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        child = _ref[_i];
        _results.push((function(child) {
          var attr, closed, contents, e, el, fields, footer, header, outline, xml_button, _j, _k, _l, _len1, _len2, _len3, _ref1, _ref2, _ref3;
          header = $("<span class='tag_header'>" + child.nodeName + "</span>");
          _ref1 = child.attributes;
          for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
            attr = _ref1[_j];
            header.append($("<span class=\"name\">" + attr.name + "</span><span class=\"value\">" + attr.value + "</span>"));
          }
          xml_button = $("<span class='tag_xmlbutton'>XML</span>").localize_element({
            en: "Show XML",
            se: "Visa XML"
          }).click(function() {
            new_window((new XMLSerializer()).serializeToString(child));
            return false;
          });
          closed = header.clone().removeClass("tag_header").addClass("tag_closed").addClass("hide");
          footer = $("<span class='tag_floatfix'>&nbsp;</span>\n<span class='tag_footer'>" + child.nodeName + "</span>");
          contents = $("<div width='100%'/>");
          outline = $("<div width='100%' class='tag_outline table-bordered'/>").append(closed, header, xml_button, contents, footer);
          fields = [header, footer, xml_button];
          if (disabled) {
            _ref2 = [outline].concat(fields);
            for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
              e = _ref2[_k];
              e.addClass("disabled");
            }
          }
          div.append(outline);
          _ref3 = [header, footer];
          for (_l = 0, _len3 = _ref3.length; _l < _len3; _l++) {
            el = _ref3[_l];
            el.click(function() {
              var _len4, _m, _ref4;
              closed.removeClass("hide");
              _ref4 = [contents].concat(fields);
              for (_m = 0, _len4 = _ref4.length; _m < _len4; _m++) {
                e = _ref4[_m];
                e.addClass("hide");
              }
              return delay_viewport_change();
            });
          }
          closed.click(function() {
            var _len4, _m, _ref4;
            closed.addClass("hide");
            _ref4 = [contents].concat(fields);
            for (_m = 0, _len4 = _ref4.length; _m < _len4; _m++) {
              e = _ref4[_m];
              e.removeClass("hide");
            }
            return delay_viewport_change();
          });
          if (child.nodeName === "sentence") {
            outline.addClass("tag_sentence");
            return contents.append(sentence_handler(child));
          } else {
            return rec(child, contents);
          }
        })(child));
      }
      return _results;
    };
  };

  $(document).ready(function() {
    $("#show_tags").change(function() {
      var disabled, query;
      disabled = $(this).attr("checked") === "checked";
      query = $(".tag_header,.tag_xmlbutton,.tag_outline,.tag_footer,.tag_floatfix");
      if (disabled) {
        return query.removeClass("disabled");
      } else {
        return query.addClass("disabled");
      }
    });
  });

  new_window = function(content) {
    var w;
    w = window.open('', '_blank');
    w.document.open("text/plain", "replace");
    w.document.write("hello");
    $("body", w.document).empty().append($("<pre/>").text(content));
    return w.document.close();
  };

  window.make_table = function(data) {
    var attr, attributes, make_deptrees, words, _i, _len, _ref;
    attributes = [];
    words = data.getElementsByTagName("w");
    if (words.length > 0) {
      _ref = words[0].attributes;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        attr = _ref[_i];
        attributes.push(attr.name);
      }
    }
    make_deptrees = _.all(["pos", "ref", "dephead", "deprel"], function(attr) {
      return _.contains(attributes, attr);
    });
    if (_.contains(attributes, "msd")) {
      attributes = _.without(attributes, "pos");
    }
    (function() {
      var corpus, tables_div;
      $("#result").empty().append(tables_div = $("<div/>"));
      corpus = (data.getElementsByTagName("corpus"))[0];
      return (display(tabulate_sentence(attributes, make_deptrees)))(corpus, tables_div);
    })();
    $("#extra_buttons").empty().append($("<button class=\"btn advanced\">XML</button>").click(function() {
      new_window((new XMLSerializer()).serializeToString(data));
      return false;
    }));
    delay_viewport_change();
    address.set_from_xml(data);
  };

}).call(this);
