function to_array(x) {
    if (x == undefined) {
        return [];
    } else if (! (x instanceof Array)) {
        return [x];
    } else {
        return x;
    }
}

function array_to_rows(array) {
    return array.map(function (row)
                     { return tr(row.map(td).join('')); }
                    ).join('');
}

function enclose(t) {
    return function(s) {
        return "<" + t + ">" + s + "</" + t + ">";
    }
}

tr = enclose("tr");
td = enclose("td");
th = enclose("th");
pre = enclose("pre");

function table(s) {
    return '<table class="table table-striped table-bordered table-condensed">' + s + '</table>';
}

function split_pipes(f) {
    return function(s) {
        // s without surrounding pipes
        var sp = s == "|" ? "" : s.substring(1,s.length-1);
        // the array of values delimited by pipes
        var a = sp.split("|");
        // return them comma separated, of if the array contains no
        // characters, just return a space char
        return a.join("") ? a.map(f).join(", ") : "&nbsp;";
    };
}

function saldo_link(s) {
    return '<a href="http://spraakbanken.gu.se/karp/#search=sense%7C' + s + '">' + s + '</a>';
}

function lemgram_link(s) {
    return '<a href="http://spraakbanken.gu.se/karp/#search=lemgram%7C' + s + '">' + s + '</a>';
}


function id(x) {
    return x;
}

function handle_progress(data) {
    var footer = '</incremental></result>'
    var finished = data.indexOf('</result>') != -1;
    if (!finished) {
        data = data + footer;
    }
    var json = $.xml2json(data);
    var progress = 100;
    var i = json.incremental;
    if (i && !finished) {
        var steps = i.steps;
        var step = i.increment ? i.increment.length : 0;
        progress = step / steps * 100;
    }
    $('#progress').html('\
       <div class="progress progress-striped active">\
         <div class="bar" style="width: ' + progress + '%;"></div>\
       </div>');
}

function make_table(data) {

    $('#progress').html('');

    var col = function(s) { return { name: s, id: s }; }
    var columns = ["msd","lemma","lex","saldo","prefix","suffix","ref"].map(col);
    columns.push({ name: "head", id: "dephead" });
    columns.push({ name: "rel", id: "deprel" });
    columns.unshift({ name: "word", id: "text" });

    var correct = {
        msd : function (s) { return s.split(".").join(". "); },
        lemma : split_pipes(id),
        lex : split_pipes(lemgram_link),
        saldo : split_pipes(saldo_link),
        prefix : split_pipes(lemgram_link),
        suffix : split_pipes(lemgram_link)
    };


    var rows = [];
    json = $.xml2json(data);

    var tbl = tr(columns.map(function(col) { return th(col.name);}).join(''));

    var wide_row = function(s) {
        return tr('<td colspan="' + columns.length + '">' + s + '</td>');
    }

    var make_deptrees = true;
    deptrees = []

    sentences = to_array(json.corpus.sentence);
    sentences.map(function(sent) {
        var words = to_array(sent.w);
        var div_id = "div-" + sent.id;
        tbl += wide_row('<div id="' + div_id + '"></div>');
        tbl += array_to_rows(words.map(function(word) {
            return columns.map(function(col) {
                var f = correct[col.id] || id;
                return f(word[col.id] || "&nbsp;");
            });
        }));

        if (make_deptrees) {
            deptrees.push(function() {
                var roots = [];
                var nodes = new Array(words.length);
                for (var i=0; i<words.length; i++) {
                    nodes[i] = new Node();
                    nodes[i].pos = i;
                }
                for (var i=0; i<words.length; i++) {
                    nodes[i].value = words[i].text;
                    nodes[i].rel = words[i].deprel;
                    if (words[i].dephead == "") {
                        roots.push(nodes[i]);
                    } else {
                        var parent = words[i].dephead-1;
                        nodes[i].rel = words[i].deprel;
                        nodes[i].parent = nodes[parent];
                    }
                }
	        var img = go_from_root(roots, nodes);
                $('#' + div_id).empty(img);
                $('#' + div_id).append(img);
                $('#' + div_id).css("text-align","center");
                $('#' + div_id).css("overflow","auto");
            });
        }
    });

    return { html : table(tbl), deptrees : deptrees };
}

/*
    $('#text_submit').click(function() {
        var $text = $('#textarea_text').val();
        var fmt = get_fmt();
        var raw = fmt != "table" && get_raw();
        var req_url = "http://demo.spraakdata.gu.se/dan/pipeline/";
        var req_fmt = fmt == "vrt" ? "vrt" : "xml";
        var new_url = req_url + "?text=" + encodeURI($text) + "&fmt=" + encodeURI(req_fmt);
        if (raw) {
            window.location = new_url;
        } else {
            $.ajax({
                url: req_url,
                dataType: "text",
                timeout: 300000,
                type: "GET",
                data: {
                    text: $text,
                    fmt: req_fmt,
                    incremental: (fmt == "table").toString()
                },
                success: function(data, textStatus, xhr) {
                    var fmt = $("#text_form input[name=fmt]");
                    var checked = fmt.filter(':checked')[0];
                    if (checked.id == "table") {
                        var res = make_table(data);
                        $('#result').html(res.html);
                        res.deptrees.map(function (fn) { fn(); });
                    } else {
                        $('#result').html('<pre id="result_code" class="code"></pre>');
                        $('#result_code').text(data);
                    }
                },
                progress: function(data, e) {
                    if (fmt == "table") {
                        handle_progress(e.target.response);
                    }
                },
                error: function(jqXHR, textStatus, errorThrown) {
                    console.log("error", jqXHR, textStatus, errorThrown);
                }
            });
        }
        return false;
    });
*/
