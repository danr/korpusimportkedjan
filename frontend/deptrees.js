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

function make_entity_from_pos (p) {
    var min = "A".charCodeAt(0) * 1.0;
    var max = "Z".charCodeAt(0) * 1.0 - min;
    var hue = Math.floor((p.charCodeAt(0) - min) * (100.0 / max));
    var sat = Math.floor((p.charCodeAt(1) - min) * (30.0 / max)) + 70;
    // console.log(p, hue, sat);
    var rgb = $.colors('hsl(' + hue + ',' + sat + '%,70%)').toString('hex');
    // console.log(p + " gets " + rgb);
    return {
        type: p,
        labels: [p],
        bgColor: rgb,
        borderColor: 'darken'
    }
};

function make_relation_from_rel (r) {
    return {
        type: r,
        labels: [r],
		dashArray: "3,3",
        color: "purple",
        args: [ { role: "parent", targets: [] },
                { role: "child", targets: [] }
              ]
    }
}

function draw_brat_tree(words, to_div) {

    var entity_types = [];
    var relation_types = [];
    var event_types = [];
    var entities = [];
    var relations = [];
    var triggers = [];
    var events = [];

    var added_pos = [];
    var added_rel = [];

    function add_word (word, start, stop) {
        if ($.inArray(word.pos, added_pos) == -1) {
            added_pos.push(word.pos);
            entity_types.push(make_entity_from_pos(word.pos));
        }
        if ($.inArray(word.deprel, added_rel) == -1) {
            added_rel.push(word.deprel);
            relation_types.push(make_relation_from_rel(word.rel));
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
        event_types: event_types
    };

    var docData = {
        text: text,
        entities: entities,
        relations: relations,
        triggers: triggers,
        events: events
    };

    console.log("collData", collData, "docData", docData);

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
