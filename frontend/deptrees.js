var webFontURLs;

function init_brat() {

    var bratLocation = 'http://localhost/lib/brat';

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

function draw_brat_tree(words, to_div) {

    var posses = $.unique($.map(words, function (w) { return w.pos; }));

    var rels = $.unique($.map(words, function (w) { return w.deprel; }));

    function make_entity_from_pos (p) {
        var min = "A".charCodeAt(0) * 1.0;
        var max = "Z".charCodeAt(0) * 1.0 - min;
        var hue = Math.floor((p.charCodeAt(0) - min) * (100.0 / max));
        var sat = Math.floor((p.charCodeAt(1) - min) * (50.0 / max)) + 25;
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
            color: "black",
            args: [ { role: "parent", targets: [] },
                    { role: "child", targets: [] }
                  ]
        }
    }

    var collData = {
        entity_types: $.map(posses, make_entity_from_pos),
        relation_types: $.map(rels, make_relation_from_rel)
    };

    var text = words.join(" ")

    var pos = 0;
    var entities = []
    var relations = []
    $.map(words, function (w) {
        var entity = ["T" + w.ref, w.pos, [[pos, pos + w.length]]];
        entities = [].concat(entities,[entity]);

        if (w.deprel != "ROOT") {
            var relation = ["R" + w.ref, w.deprel, [["parent", "T" + w.dephead],["child", "T" + w.ref]]];
            relations = [].concat(relations,[relation]);
        }

        // advance position index
        pos += w.length + 1;
    });

    var docData = {
        // Our text of choice
        text: text,
        // The entities entry holds all entity annotations
        entities: entities,
        relations: relations
    };

    // console.log("collData", collData, "docData", docData);

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
