// Generated by CoffeeScript 1.4.0
(function() {
  var dismiss_button, show_errors;

  dismiss_button = function() {
    return $("<button type=\"button\" class=\"close\" data-dismiss=\"alert\">\n    <i class=\"icon-remove\"></i>\n</button>");
  };

  show_errors = function(data) {
    var error, error_div, errors, _i, _len;
    errors = data.getElementsByTagName("error");
    for (_i = 0, _len = errors.length; _i < _len; _i++) {
      error = errors[_i];
      console.log(error.textContent);
      error_div = $("<div class=\"alert alert-error\"/>");
      error_div.append(dismiss_button(), $("<span>Importkedjan gav följande varningar:</span>\n<pre class=\"original-pre\">" + error.textContent + "</pre>"));
      $("#errors").append(error_div);
    }
  };

  window.submit = function(xml_editor, makefile) {
    var incremental, req_url, settings, text;
    if (makefile == null) {
      makefile = false;
    }
    settings = with_form.get();
    incremental = !makefile;
    text = xml_editor.getValue();
    req_url = config.address + (makefile ? "/makefile" : "/") + "?settings=" + JSON.stringify(settings) + "&incremental=" + (String(incremental));
    if (incremental) {
      progress.initialize();
    }
    $.ajax({
      url: req_url,
      dataType: makefile ? "text" : "xml",
      timeout: 300000,
      type: "POST",
      data: text,
      success: function(data, textStatus, xhr) {
        progress.clear();
        if (makefile) {
          $("#query").text(data);
        } else {
          show_errors(data);
          make_table(data, settings.attributes);
        }
      },
      progress: function(data, e) {
        if (incremental) {
          return progress.handle(e.target.response);
        }
      },
      error: function(jqXHR, textStatus, errorThrown) {
        progress.clear();
        return console.log("error", jqXHR, textStatus, errorThrown);
      }
    });
    return false;
  };

}).call(this);
