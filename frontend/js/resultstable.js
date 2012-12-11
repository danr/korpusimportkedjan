// Generated by CoffeeScript 1.4.0
(function() {
  var append_array_to_table, delay_viewport_change, display, lemgram_link, new_window, saldo_link, split_pipes, tabulate_sentence, to_array, xml_attr_value;

  to_array = function(x) {
    if (!(x != null)) {
      return [];
    } else if (!_.isArray(x)) {
      return [x];
    } else {
      return x;
    }
  };

  append_array_to_table = function(tbl, array) {
    var col, row, tr, _i, _j, _len, _len1, _results;
    _results = [];
    for (_i = 0, _len = array.length; _i < _len; _i++) {
      row = array[_i];
      tr = $("<tr/>");
      for (_j = 0, _len1 = row.length; _j < _len1; _j++) {
        col = row[_j];
        tr.append($("<td>").append(col));
      }
      _results.push(tbl.append(tr));
    }
    return _results;
  };

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

  tabulate_sentence = function(columns, make_deptrees) {
    return function(sent) {
      var dom_load_more, fill_table, show_more, table;
      table = $("<table class=\"table table-striped table-bordered table-condensed\"/>");
      fill_table = function() {
        var col, cols, deprel_div, header, outer_div, render_deprel, sent_id, word, _i, _len;
        header = $("<tr/>");
        header.append($("<th>").localize_element({
          se: "ord",
          en: "word"
        }));
        for (_i = 0, _len = columns.length; _i < _len; _i++) {
          col = columns[_i];
          header.append($("<th>" + col.name + "</th>"));
        }
        table.append(header);
        append_array_to_table(table, (function() {
          var _j, _len1, _ref, _results;
          _ref = $(sent).children();
          _results = [];
          for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
            word = _ref[_j];
            cols = (function() {
              var _k, _len2, _results1;
              _results1 = [];
              for (_k = 0, _len2 = columns.length; _k < _len2; _k++) {
                col = columns[_k];
                _results1.push($("<span/>").html(col.correct(xml_attr_value(word, col.id))));
              }
              return _results1;
            })();
            cols.unshift($("<span/>").text(word.textContent));
            _results.push(cols);
          }
          return _results;
        })());
        if (make_deptrees) {
          sent_id = xml_attr_value(sent, "id");
          deprel_div = $("<div class='drawing'/>").attr("id", sent_id).show().appendTo("body");
          outer_div = $("<div/>");
          table.prepend($("<tr/>").append($("<td/>").attr("colspan", columns.length).css("background-color", "#FFFFFF").append(outer_div)));
          render_deprel = function() {
            console.log("Showing dependency tree for " + sent_id + " now", deprel_div, table);
            draw_brat_tree($(sent).children(), sent_id, outer_div);
            return false;
          };
          outer_div.one('inview', render_deprel);
        }
        return delay_viewport_change();
      };
      dom_load_more = $("<div/>");
      table.append(dom_load_more);
      show_more = function() {
        console.log("Showing more from sentence " + (xml_attr_value(sent, 'id')), table);
        dom_load_more.detach();
        fill_table();
        return false;
      };
      dom_load_more.one('inview', show_more);
      return table;
    };
  };

  display = function(sentence_handler) {
    var disabled, rec;
    disabled = $("#show_tags").attr("checked") !== "checked";
    console.log("Disabled:", disabled);
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
    $("body", w.document).text(content);
    return w.document.close();
  };

  window.make_table = function(data) {
    var attr, attributes, columns, make_deptrees, required, words, _i, _j, _len, _len1, _ref, _ref1;
    columns = [];
    attributes = [];
    words = data.getElementsByTagName("w");
    if (words.length > 0) {
      _ref = words[0].attributes;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        attr = _ref[_i];
        attributes.push(attr.name);
        columns.push({
          name: attr.name,
          id: attr.name
        });
      }
    }
    if (_.contains(attributes, "msd")) {
      columns = _.reject(columns, function(col) {
        return col.id === "pos";
      });
    }
    (function() {
      var col, correct, _j, _len1, _results;
      correct = {
        msd: function(s) {
          return s.split(".").join(". ");
        },
        lemma: split_pipes(_.identity),
        lex: split_pipes(lemgram_link),
        saldo: split_pipes(saldo_link),
        prefix: split_pipes(lemgram_link),
        suffix: split_pipes(lemgram_link)
      };
      _results = [];
      for (_j = 0, _len1 = columns.length; _j < _len1; _j++) {
        col = columns[_j];
        _results.push(col.correct = correct[col.id] || _.identity);
      }
      return _results;
    })();
    make_deptrees = true;
    _ref1 = ["pos", "ref", "dephead", "deprel"];
    for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
      required = _ref1[_j];
      make_deptrees = make_deptrees && _.contains(attributes, required);
    }
    (function() {
      var corpus, tables_div;
      $("#result").empty().append(tables_div = $("<div/>"));
      corpus = (data.getElementsByTagName("corpus"))[0];
      return (display(tabulate_sentence(columns, make_deptrees)))(corpus, tables_div);
    })();
    $("#extra_buttons").empty().append($("<button class=\"btn\">XML</button>").click(function() {
      new_window((new XMLSerializer()).serializeToString(data));
      return false;
    }));
    delay_viewport_change();
    address.set_from_xml(data);
  };

}).call(this);
