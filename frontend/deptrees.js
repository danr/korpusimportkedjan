var webFontURLs;

function init_brat() {

    var bratLocation = 'lib/brat';

    head.js(
        // External libraries
        // bratLocation + '/client/lib/jquery.svg.min.js',
        // buggy svgdom:
        // bratLocation + '/client/lib/jquery.svgdom.min.js',

        // brat helper modules
        bratLocation + '/client/src/configuration.js',
        bratLocation + '/client/src/util.js',
        bratLocation + '/client/src/annotation_log.js',
        bratLocation + '/client/lib/webfont.js',

        // brat modules
        bratLocation + '/client/src/dispatcher.js',
        bratLocation + '/client/src/url_monitor.js',
        bratLocation + '/client/src/visualizer.js'
    );

    webFontURLs = [
        bratLocation + '/static/fonts/Astloch-Bold.ttf',
        bratLocation + '/static/fonts/PT_Sans-Caption-Web-Regular.ttf',
        bratLocation + '/static/fonts/Liberation_Sans-Regular.ttf'
    ];
}

/*
  words are from one sentence and are Strings with extra attributes
  including rel, dephead and deprel and pos
*/

function color_from_chars (w, sat_min, sat_max, lightness) {
    var v = 1.0;
    var hue = 0.0;
    var sat = 0.0;
    var len = w.length;
    for (var i=0; i < len; i++) {
        v = v / 26.0;
        sat += ((w.charCodeAt(i)) % 26) * v;
        hue += ((w.charCodeAt(i)) % 26) * (1.0 / 26 / len);
    }

	hue = hue * 360;
	sat = sat * (sat_max - sat_min) + sat_min;

	var color = $.Color({ hue: hue, saturation: sat, lightness: lightness})

    return color.toHexString(0);
}

function make_entity_from_pos (p) {
    return {
        type: p,
        labels: [p],
        bgColor: color_from_chars(p, 0.8, 0.95, 0.95),
        borderColor: 'darken'
    }
};

function make_relation_from_rel (r) {
    return {
        type: r,
        labels: [r],
        color: "#000000", // color_from_chars(r, 0.5, 0.6, 0.2),
        args: [ { role: "parent", targets: [] },
                { role: "child", targets: [] }
              ]
    }
}

function draw_brat_tree(words, to_div) {

    var entity_types = [];
    var relation_types = [];
    var entities = [];
    var relations = [];

    var added_pos = [];
    var added_rel = [];

    function add_word (word, start, stop) {
        if ($.inArray(word.pos, added_pos) == -1) {
            added_pos.push(word.pos);
            entity_types.push(make_entity_from_pos(word.pos));
        }
        if ($.inArray(word.deprel, added_rel) == -1) {
            added_rel.push(word.deprel);
            relation_types.push(make_relation_from_rel(word.deprel));
        }

        var entity = ["T" + word.ref, word.pos, [[start, stop]]];
        entities.push(entity);

        if (word.deprel != "ROOT") {
            var relation = ["R" + word.ref, word.deprel, [["parent", "T" + word.dephead],["child", "T" + word.ref]]];
            relations.push(relation);
        }

    }

    var text = words.join(" ");

    var ix = 0;
    $.map(words, function (word) {
        add_word(word, ix, ix + word.length);
        ix += word.length + 1;
    });

    var collData = {
        entity_types: entity_types,
        relation_types: relation_types,
    };

    var docData = {
        text: text,
        entities: entities,
        relations: relations,
    };

    Util.embed(to_div, collData, docData, webFontURLs);
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
