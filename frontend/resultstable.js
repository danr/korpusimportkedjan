function to_array(x) {
    if (x == undefined) {
        return [];
    } else if (! (x instanceof Array)) {
        return [x];
    } else {
        return x;
    }
}

function array_to_rows(tbl, array) {
    $.each(array, function (_ix, row) {
        var tr = $('<tr/>');
        $.each(row, function (_ix, col) {
            tr.append($('<td>').append(col));
        });
        tbl.append(tr);
    });
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

function span(w) {
    return $('<span/>').html(w);
}

function id(x) {
    return x;
}

function draw_sentence_tree(words) {
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
    return go_from_root(roots, nodes);
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
    $('#progress-bar').css("width",progress + '%');
}

function tabulate_sentence(columns, sent, make_deptrees) {

    var table = $('<table class="table table-striped table-bordered table-condensed">');

    var header = $('<tr/>');

    $.each(columns,function(_ix, col) {
        header.append($('<th/>').text(col.name));
    });

    table.append(header);

    var wide_row = function(s) {
        return $('<tr/>').append($('<td/>').attr("colspan",columns.length).append(s));
    }

    var words = to_array(sent.w);

    array_to_rows(table,words.map(function(word) {
        return columns.map(function(col) {
            return span(col.correct(word[col.id] || "&nbsp;"));
        });
    }));

    if (make_deptrees) {
        var deprel_div = $('<div/>');
        table.prepend(wide_row(deprel_div));
        var img = draw_sentence_tree(words);
        deprel_div
            .empty(img)
            .append(img)
            .css("text-align","center")
            .css("overflow","auto");
    }

    return table;

}

function make_table(data, attributes) {

    $('#progress-div').css("display","none");

    var col = function(s) { return { name: s, id: s }; }
    var columns = ["msd","lemma","lex","saldo","prefix","suffix","ref"].map(col);
    columns.push({ name: "huvud", id: "dephead" });
    columns.push({ name: "relation", id: "deprel" });

    var correct = {
        msd : function (s) { return s.split(".").join(". "); },
        lemma : split_pipes(id),
        lex : split_pipes(lemgram_link),
        saldo : split_pipes(saldo_link),
        prefix : split_pipes(lemgram_link),
        suffix : split_pipes(lemgram_link)
    };

    // Remove those columns that are not part of the generated attributes
    columns = $.grep(columns, function (col, _ix) {
        return $.inArray(col.id, attributes) != -1;
    });

    // Always write the word
    columns.unshift({ name: "ord", id: "text" });

    // How to present the different columns (link to Karp etc)
    $.each(columns, function (_ix, col) {
        col.correct = correct[col.id] || id;
    });

    // Only make dependency trees if all three required attributes are present
    var make_deptrees = true;
    $.each(["ref", "dephead", "deprel"], function (_ix, a) {
        make_deptrees = make_deptrees && $.inArray(a, attributes) != -1;
    });

    // Get sentences by looking for xml tags named "sentence"...
    var xml_sentences = data.getElementsByTagName("sentence")

    // ... then convert them to json
    var sentences = [];
    $.each(xml_sentences, function (_, s) {
        sentences.push($.xml2json(s));
    });

    var SLICE_SIZE = 8;

    var loading = $("<div class='loading'><p>Laddar fler meningar&hellip;</p></div>");

    opts = { offset: '100%',
             triggerOnce: true,
             onlyOnScroll: true
           };

    var tables = $('<div/>');

    function show_from(ix) {
        var next = ix + SLICE_SIZE;
        if (sentences.length > ix) {
            for (var i=ix; i < next; i++) {
                if (i < sentences.length) {
                    tables.append(tabulate_sentence(columns, sentences[i], make_deptrees));
                }
            }
        }
        if (sentences.length > next) {
            var link = $('<a href="#"/>').text("Ladda fler meningar...");
            var load_more = $('<div/>').append(link);
            tables.append(load_more);
            function show_more () {
                load_more.detach();
                show_from(next);
                return false;
            }
            load_more.waypoint(show_more, opts);
            link.click(show_more);
        }
    }

    show_from(0);

    function new_window(mime, content) {
        var w = window.open(",")
        w.document.open(mime, "replace");
        w.document.write(content);
        w.document.close();
    }

    $('#extra_buttons').empty().append(

        $('<button class="btn">').text("Visa JSON").click(function () {
            var json = $.xml2json(data);
            new_window("application/json", JSON.stringify(json));
            return false;
        }),

        $('<button class="btn">').text("Visa XML").click(function () {
            new_window("application/xml", (new XMLSerializer()).serializeToString(data));
            return false;
        })
    );

    $('#result').empty().append(tables);
}
