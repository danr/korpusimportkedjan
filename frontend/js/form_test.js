// Generated by CoffeeScript 1.4.0
(function() {
  var add_example_button, load_example,
    __slice = [].slice;

  add_example_button = function(key, example) {
    var example_button;
    example_button = $("<button class=\"btn btn-info\">" + key + "</button>").click(function() {
      load_example(example);
      return false;
    });
    return $("#examples").append(example_button);
  };

  load_example = function(example) {
    var form;
    form = json_schema_form.generate(example.schema, "settings");
    $("#form").empty().append(form.dom);
    form.set(example.value);
    $('#get_set').unbind('click').click(function() {
      var v;
      v = form.get();
      $('#result').text(JSON.stringify(v));
      return form.set(v);
    });
    return $('#get').unbind('click').click(function() {
      var v;
      v = form.get();
      console.log(v);
      console.log(JSON.stringify(v));
      return $('#result').text(JSON.stringify(v));
    });
  };

  $(window.document).ready(function() {
    var key;
    $.ajax({
      url: "http://localhost:8051",
      data: {
        format: "schema"
      },
      dataType: "json",
      timeout: 300000,
      type: "GET",
      success: function(data, textStatus, xhr) {
        var example, schema;
        schema = json_schema_utils.flatten_singleton_unions(json_schema_utils.follow_references(data));
        console.log(schema);
        example = {
          schema: schema,
          value: json_schema_utils.get_default(schema)
        };
        add_example_button('annoteringslabbet', example);
        return load_example(example);
      },
      error: function() {
        var info;
        info = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        return console.log(info);
      }
    });
    for (key in json_schema_form.examples) {
      add_example_button(key, json_schema_form.examples[key]);
    }
    return load_example(json_schema_form.examples.array);
  });

}).call(this);
