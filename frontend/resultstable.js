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
    var deprel_div = $('<div/>');

    table.append(wide_row(deprel_div));

    array_to_rows(table,words.map(function(word) {
        return columns.map(function(col) {
            return span(col.correct(word[col.id] || "&nbsp;"));
        });
    }));

    if (make_deptrees) {
        //        console.log("Adding a waypoint for " + sent.id);
        //        deprel_div.waypoint(function() {
        //            console.log("Drawing a tree for " + sent.id);
        var img = draw_sentence_tree(words);
        deprel_div
            .empty(img)
            .append(img)
            .css("text-align","center")
            .css("overflow","auto");
        //        }, {
        //            offset: '100%',
        //            triggerOnce: true,
        //            onlyOnScroll: true
        //        });
    }

    return table;

}

function make_table(data, attributes) {

    $('#progress-div').css("display","none");

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

    // Remove those columns that are not part of the generated attributes
    columns = $.grep(columns, function (col, _ix) {
        return $.inArray(col.name, attributes) != -1;
    });

    $.each(columns, function (_ix, col) {
        col.correct = correct[col.id] || id;
    });

    var rows = [];
    json = $.xml2json(data);

    var tables = $('<div/>');

    var make_deptrees = true;

    sentences = to_array(json.corpus.sentence);

    var SLICE_SIZE = 8;

    var loading = $("<div class='loading'><p>Laddar fler meningar&hellip;</p></div>");

    opts = { offset: '100%',
             triggerOnce: true,
             onlyOnScroll: true
           };

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

    $('#result').empty().append(tables);
}
