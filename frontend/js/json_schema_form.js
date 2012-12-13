// Generated by CoffeeScript 1.4.0

/*
# Simplify type: Finds single, multi and only enums
*/


(function() {
  var examples, generate, logger, simplify_type, test_examples, type_match,
    __slice = [].slice;

  simplify_type = function(schema) {
    if (schema.type === "array" && schema.items.type === "string" && (schema.items["enum"] != null)) {
      return {
        "enum": schema.items["enum"],
        multi: true,
        desc: "multi-enum",
        enum_loc: schema.items.enum_loc
      };
    } else if (schema.type === "string" && (schema["enum"] != null)) {
      if (schema["enum"].length === 1) {
        return {
          only: schema["enum"][0],
          desc: "only"
        };
      } else {
        return {
          "enum": schema["enum"],
          multi: false,
          desc: schema.style_enum === "dropdown" ? "dropdown-enum" : "single-enum",
          enum_loc: schema.enum_loc
        };
      }
    } else {
      return schema.type;
    }
  };

  /*
  # Is the first argument of the type described in the second argument?
  # Used to set union types
  */


  type_match = (function() {
    var all, any, map, _ref;
    _ref = [_.all, _.any, _.map], all = _ref[0], any = _ref[1], map = _ref[2];
    return function(value, schema) {
      if (schema.type === "object" && _.isObject(value)) {
        return all(map(schema.properties, function(subschema, key) {
          return (value[key] != null) && type_match(value[key], subschema);
        }));
      } else if (schema.type === "array" && _.isArray(value)) {
        return all(value, function(v) {
          return type_match(v, schema.items);
        });
      } else if (_.isArray(schema.type)) {
        return any(schema.type, function(s) {
          return type_match(value, s);
        });
      } else if (schema["enum"] != null) {
        return _.contains(schema["enum"], value);
      } else {
        return schema.type === "string" && _.isString(value) || schema.type === "bool" && _.isBoolean(value);
      }
    };
  })();

  /*
  # Generates a form from a given json schema and a dom id for the top entry.
  # Returns an object with keys
  #     dom: The form dom element
  #     set: A function that takes a value that validates the json schema,
  #          and populates the form from it
  #     get: A function that takes no arguments and gets the value in the form.
  #          This value validates the json schema.
  #
  # Various classes are given to the nested divs in the form. These include:
  #
  #   nesting indicator: .nest
  #   types: .array, .union, .object, .string, .bool,
  #   derived types: .simple-type, .complex-type, .multi-enum, .single-enum, .dropdown-enum, .only, .single
  #   auxiliary: .item, .items
  #   titles: .title, and from the types list above, for example .string-title
  */


  generate = function(schema, path) {
    return (function() {
      var decorator, type;
      type = simplify_type(schema);
      decorator = function(make) {
        var dom, inner_div, inner_dom, obj, type_desc, _i, _len;
        obj = make();
        inner_dom = obj.dom;
        type_desc = type.desc || (_.isArray(type) ? "union" : type);
        obj.dom = $("<div class=\"" + type_desc + " nest\" id=\"" + path + "\"/>");
        if (schema.title != null) {
          obj.dom.append($("<div class=\"title " + type_desc + "-title\">").localize_element({
            en: schema.title,
            se: schema.title_se
          }));
        } else {
          console.log("warning: no title on schema ", schema);
        }
        if (schema.type === "object") {
          if (_.all(_.map(schema.properties, (function(subschema) {
            return subschema.type === "string";
          })))) {
            obj.dom.addClass("simple-object");
          } else {
            obj.dom.addClass("complex-object");
          }
        }
        if (schema.description != null) {
          obj.dom.append($("<div class=\"description\"/>").localize_element({
            en: schema.description,
            se: schema.description_se
          }));
        }
        inner_div = $("<div class=\"inner " + type_desc + "-inner\">/");
        if (schema["class"]) {
          inner_div.addClass(schema["class"]);
        }
        for (_i = 0, _len = inner_dom.length; _i < _len; _i++) {
          dom = inner_dom[_i];
          inner_div.append(dom);
        }
        obj.dom.append(inner_div);
        return obj;
      };
      return decorator(function() {
        var dom, doms, generate_item, i, items, items_div, key, new_button, object, objects, option, options, select, select_dom, select_parent, subschema, toggle, v, with_selected, _i, _j, _len, _len1, _ref, _ref1, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7, _ref8, _ref9;
        if (type.only != null) {
          return {
            dom: [],
            set: function(v) {},
            get: function() {
              return type.only;
            }
          };
        } else if (type["enum"] != null) {
          if (schema.style_enum === "dropdown" && !type.multi) {
            select = $("<select>");
            _ref = type["enum"];
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              v = _ref[_i];
              select.append($("<option value=\"" + v + "\"/>").localize_element({
                se: ((_ref1 = type.enum_loc) != null ? (_ref2 = _ref1.se) != null ? _ref2[v] : void 0 : void 0) || v,
                en: ((_ref3 = type.enum_loc) != null ? (_ref4 = _ref3.en) != null ? _ref4[v] : void 0 : void 0) || v
              }));
            }
            dom = $("<div class=\"select-parent\">");
            dom.append(select);
            select.buttonSelect(true);
            return {
              dom: dom,
              set: function(s) {
                return dom.find("input:hidden").val(s).trigger('change');
              },
              get: function() {
                return dom.find("input:hidden").val();
              }
            };
          } else {
            toggle = type.multi ? "buttons-checkbox" : "buttons-radio";
            dom = $("<div class=\"btn-group\" data-toggle=\"" + toggle + "\"/>");
            _ref5 = type["enum"];
            for (_j = 0, _len1 = _ref5.length; _j < _len1; _j++) {
              v = _ref5[_j];
              dom.append($("<button type=\"button\" class=\"btn button-enum\" id=\"" + v + "\"/>").localize_element({
                se: ((_ref6 = type.enum_loc) != null ? (_ref7 = _ref6.se) != null ? _ref7[v] : void 0 : void 0) || v,
                en: ((_ref8 = type.enum_loc) != null ? (_ref9 = _ref8.en) != null ? _ref9[v] : void 0 : void 0) || v
              }));
            }
            return {
              dom: dom,
              set: function(vs) {
                var _k, _len2, _results;
                if (type.multi) {
                  dom.children("button").removeClass("active");
                  _results = [];
                  for (_k = 0, _len2 = vs.length; _k < _len2; _k++) {
                    v = vs[_k];
                    _results.push(dom.find("#" + v).addClass("active"));
                  }
                  return _results;
                } else {
                  return dom.children("button").removeClass("active").filter("#" + vs).addClass("active");
                }
              },
              get: function() {
                var c, _k, _len2, _ref10, _results;
                if (type.multi) {
                  _ref10 = dom.children(".active");
                  _results = [];
                  for (_k = 0, _len2 = _ref10.length; _k < _len2; _k++) {
                    c = _ref10[_k];
                    _results.push($(c).attr("id"));
                  }
                  return _results;
                } else {
                  return dom.children(".active").attr("id");
                }
              }
            };
          }
        } else if (type === "string") {
          return {
            dom: dom = $("<input type=\"text\">"),
            set: function(v) {
              dom.val(v);
            },
            get: function() {
              return dom.val();
            }
          };
        } else if (type === "bool") {
          return {
            dom: dom = $("<input type=\"checkbox\">"),
            set: function(v) {
              dom.attr('checked', v);
            },
            get: function() {
              return 'checked' === dom.attr('checked');
            }
          };
        } else if (type === "object") {
          objects = (function() {
            var _results;
            _results = [];
            for (key in schema.properties) {
              _results.push(_.extend({
                key: key
              }, generate(schema.properties[key], "" + path + "_" + key)));
            }
            return _results;
          })();
          return {
            dom: (function() {
              var _k, _len2, _results;
              _results = [];
              for (_k = 0, _len2 = objects.length; _k < _len2; _k++) {
                object = objects[_k];
                _results.push(object.dom);
              }
              return _results;
            })(),
            set: function(obj) {
              var _k, _len2;
              for (_k = 0, _len2 = objects.length; _k < _len2; _k++) {
                object = objects[_k];
                object.set(obj[object.key]);
              }
            },
            get: function() {
              return _.object((function() {
                var _k, _len2, _results;
                _results = [];
                for (_k = 0, _len2 = objects.length; _k < _len2; _k++) {
                  object = objects[_k];
                  _results.push([object.key, object.get()]);
                }
                return _results;
              })());
            }
          };
        } else if (type === "array") {
          items_div = $("<div class=\"items\">");
          items = [];
          generate_item = function() {
            var item, item_div, rm_button;
            item = generate(schema.items, "" + path + "_item");
            item_div = $("<div class=\"item\">");
            rm_button = $("<button class=\"btn btn-danger item-btn item-remove-btn\"><i class=\"icon-remove\">").click(function() {
              item_div.remove();
              items = _.without(items, item);
              return false;
            });
            items_div.append(item_div.append(item.dom, rm_button));
            return item;
          };
          new_button = $("<button class=\"btn btn-success item-btn item-add-btn\"><i class=\"icon-plus\">").click(function() {
            items.push(generate_item());
            return false;
          });
          return {
            dom: [new_button, items_div],
            set: function(vs) {
              var item;
              items_div.empty();
              items = (function() {
                var _k, _len2, _results;
                _results = [];
                for (_k = 0, _len2 = vs.length; _k < _len2; _k++) {
                  v = vs[_k];
                  item = generate_item();
                  item.set(v);
                  _results.push(item);
                }
                return _results;
              })();
            },
            get: function() {
              var item, _k, _len2, _results;
              _results = [];
              for (_k = 0, _len2 = items.length; _k < _len2; _k++) {
                item = items[_k];
                _results.push(item.get());
              }
              return _results;
            }
          };
        } else if (_.isArray(type)) {
          select_dom = $("<select>");
          options = (function() {
            var _k, _len2, _results;
            _results = [];
            for (i = _k = 0, _len2 = type.length; _k < _len2; i = ++_k) {
              subschema = type[i];
              select_dom.append($("<option value=\"" + i + "\">").localize_element({
                en: subschema.title,
                se: subschema.title_se
              }));
              option = generate(subschema, "" + path + "_" + i);
              if (subschema["default"] != null) {
                option.set(subschema["default"]);
              }
              _results.push(option);
            }
            return _results;
          })();
          select_parent = $("<div class=\"select-parent\">");
          select_parent.append(select_dom);
          select_dom.buttonSelect(false);
          with_selected = (function() {
            var selected;
            selected = null;
            return {
              set: function(s) {
                var hidden, _k, _len2;
                if (s != null) {
                  selected = s;
                }
                for (i = _k = 0, _len2 = options.length; _k < _len2; i = ++_k) {
                  option = options[i];
                  if (i === Number(selected)) {
                    option.dom.show();
                  } else {
                    option.dom.hide();
                  }
                }
                hidden = select_parent.find("input:hidden");
                if (hidden.val() !== selected) {
                  hidden.val(selected);
                  return hidden.trigger('change');
                }
              },
              get: function() {
                return selected;
              }
            };
          })();
          with_selected.set(0);
          select_parent.find("input:hidden").change(function() {
            return with_selected.set($(this).val());
          });
          doms = (function() {
            var _k, _len2, _results;
            _results = [];
            for (_k = 0, _len2 = options.length; _k < _len2; _k++) {
              option = options[_k];
              _results.push(option.dom.addClass("union-child"));
            }
            return _results;
          })();
          doms.unshift(select_parent);
          return {
            dom: doms,
            set: function(x) {
              var _k, _len2;
              for (i = _k = 0, _len2 = type.length; _k < _len2; i = ++_k) {
                subschema = type[i];
                if (type_match(x, subschema)) {
                  options[i].set(x);
                  with_selected.set(i);
                  break;
                }
              }
            },
            get: function() {
              return options[with_selected.get()].get();
            }
          };
        } else {
          throw new Error("The type of " + (JSON.stringify(schema)) + " is not supported!");
        }
      });
    })();
  };

  /*
  # Examples, each with a schema and an example value
  */


  examples = {
    union: {
      schema: {
        title: "Union type",
        type: [
          {
            title: "Checkbox",
            type: "bool"
          }, {
            title: "String",
            type: "string"
          }
        ]
      },
      value: "hello"
    },
    complex: {
      schema: {
        title: "Complex Schema",
        type: "object",
        properties: {
          extra: {
            title: "Extra Tags",
            type: "array",
            items: {
              title: "Extra Tag",
              type: "object",
              properties: {
                tag: {
                  title: "Tag Name",
                  type: "string"
                },
                attrs: {
                  title: "Attributes",
                  type: "array",
                  items: {
                    title: "Attribute",
                    type: "string"
                  }
                }
              }
            }
          }
        }
      },
      value: {
        extra: [
          {
            tag: "chapter",
            attrs: ["title", "author"]
          }, {
            tag: "header",
            attrs: ["date", "journal"]
          }
        ]
      }
    },
    object: {
      schema: {
        title: "Two objects",
        type: "object",
        properties: {
          name: {
            title: "Name",
            type: "string"
          },
          happy: {
            title: "Happy",
            type: "bool"
          }
        }
      },
      value: {
        name: "Test name",
        happy: true
      }
    },
    array: {
      schema: {
        title: "An array of strings",
        type: "array",
        items: {
          title: "A string in the array",
          type: "string",
          "default": "default string value"
        }
      },
      value: ["first string", "second string"]
    },
    string: {
      schema: {
        title: "A string",
        type: "string"
      },
      value: "a string value"
    },
    bool: {
      schema: {
        title: "A checkbox",
        type: "bool"
      },
      value: true
    }
  };

  examples.combine = {
    schema: {
      title: "All of them combined, as an array!!",
      description: "Might work!",
      type: 'array',
      items: {
        title: "An item!",
        type: _.values(_.pluck(examples, 'schema'))
      }
    },
    value: _.values(_.pluck(examples, 'value'))
  };

  /*
  # Verify that every value of the example schemas are of the type they should be
  */


  test_examples = function() {
    return _.map(examples, function(example, key) {
      return console.log(key, type_match(example.value, example.schema));
    });
  };

  /*
  # A logger debugging function
  */


  logger = function(f) {
    return function() {
      var arg, args, res;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      res = f.apply(null, args);
      console.log("args: " + ((function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = args.length; _i < _len; _i++) {
          arg = args[_i];
          _results.push(JSON.stringify(arg));
        }
        return _results;
      })()) + " = ", res);
      return res;
    };
  };

  /*
  # Export in the json_schema_form name space
  */


  window.json_schema_form = {
    generate: generate,
    examples: examples
  };

}).call(this);
