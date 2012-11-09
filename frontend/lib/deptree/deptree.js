// By Miles Shang <mail@mshang.ca>
// MIT license


var debug = true;
var margin = 15; // Number of pixels from tree to edge on each side.
var padding_above_text = 6; // Lines will end this many pixels above text.
var padding_below_text = 6;

var vert_space = 30;
var hor_space = 10;

var font_size  = 10;
var text_font  = "10pt sans-serif";
var rel_font   = "10pt sans-serif";
var text_color = "green"
var rel_color  = "blue"

function Node() {
    this.value        = null;
    this.x            = null;  // Where the node will eventually be drawn.
    this.parent       = null;  // The parent
    this.rel          = null;  // Dependency relation to the parent
    this.height       = 0;     // height of link height
    this.left_height  = 0;
    this.right_height = 0;
    this.pos          = null;  // The position of this node in the original string
    this.rel_offset   = 0;     // The offset of the arrow start from parent
}

// if a node's link is set, it's included in left height or right height as appropriate.
function make_link(nodes,from,to) {
    var u = from.pos;
    var v = to.pos;
    if (v < u) {
        var t = u; u = v; v = t;
    }
    var max = 0;
    max = Math.max(max, nodes[u].right_height, nodes[v].left_height);
//    console.log(from.value, " --> ", to.value, "u: ", u, "v: ", v);
    for (var i=u+1; i<v; i++) {
        var node = nodes[i];
        max = Math.max(max, node.left_height, node.right_height);
//        console.log(from.value, " --> ", to.value, " max: ", max, " after ", node.value);
    }
    max += vert_space;
    to.height = max;
    for (var i=u+1; i<v; i++) {
        var node = nodes[i];
        node.left_height = Math.max(max, node.left_height);
        node.right_height = Math.max(max, node.right_height);
    }
//    console.log(from.value, " --> ", to.value, " height: ", to.height);
    if (from.pos < to.pos) {
        from.right_height = Math.max(max,from.right_height);
        to.left_height = Math.max(max,to.left_height);
//        console.log(from.value, ".right_height updated to ", from.right_height);
//        console.log(to.value, ".left_height updated to ", to.left_height);
    } else {
        from.left_height = Math.max(max,from.left_height);
        to.right_height = Math.max(max,to.right_height);
//        console.log(from.value, ".left_height updated to ", from.left_height);
//        console.log(to.value, ".right_height updated to ", to.right_height);
    }
}

// invariant: this node is an element at pos this.pos in nodes
// complexity: O(n^2)
// This function sets the node's left_height and right_height,
// but the parent sets its height, which will be the height of the relation link.
Node.prototype.set_height = function(nodes) {
    // for both directions,
    for (var dir=-1; dir<=1; dir += 2) {
        // consider nodes by proximity
        for (var i=this.pos+dir; i>=0 && i<nodes.length; i+=dir) {
            var node = nodes[i];
            // if this is my child node, set its height
            if (node.parent == this) {
                node.set_height(nodes);
                make_link(nodes,this,node);
            }
        }
    }
}

// Javascript seems to suck, if this is inlined in set_rel_offset,
// the i, dir and child variables will vary after it is defined (!)
function set_rel_offset_closure(i, dir, child, nodes) {
//    console.log("making closure:", i, dir, child, nodes[i].value);
    function inner(children) {
        // The root node does not need to save space for an arrow head
        var addOne = (dir == -1 || nodes[i].parent.parent) ? 1 : 0;
        // console.log("evaluating closure:", i, dir, child, nodes[i].value, children, addOne);
        nodes[i].rel_offset = dir * (children - child + addOne);
    }
    return inner;
}

// Set the relative offset on the arrow tail
// O(n^2)
Node.prototype.set_rel_offset = function(nodes) {
    for (var dir=-1; dir<=1; dir += 2) {
        var fns = [];
        var child = 0;
        for (var i=this.pos+dir; i>=0 && i<nodes.length; i+=dir) {
            var node = nodes[i];
            if (node.parent == this) {
                child++;
                fns.push(set_rel_offset_closure(i, dir, child, nodes));
                node.set_rel_offset(nodes);
            }
        }
        // we now know that we have #child in this direction,
        // update all rel_offsets now that we know this.
        fns.map(function (fn) { fn(child); });
    }
}

function assign_locations(ctx, root, nodes) {
    var x = 0;
    for (var i=0; i<nodes.length; i++) {
        ctx.font = text_font;
        var word_width = ctx.measureText(nodes[i].value).width;
        ctx.font = rel_font;
        var rel_width = ctx.measureText(nodes[i].rel).width;
        nodes[i].x = Math.floor(x + word_width / 2) + 0.5;
        x += Math.max(word_width,rel_width) + hor_space;
    }
    return x;
}

function arrow(ctx, x1, x2, y1, y2) {
    // Arrow body
    ctx.fillStyle = "black";
    ctx.moveTo(x1, y1);
    ctx.lineTo(x1, y2);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x2, y1);
    ctx.stroke();

    // Arrowhead
    ctx.beginPath();
    ctx.lineTo(x2 + 2, y1 - 6);
    ctx.lineTo(x2 - 2, y1 - 6);
    ctx.lineTo(x2, y1);
    ctx.closePath();
    ctx.fill();
}

function draw(ctx, nodes) {
    for (var i=0; i < nodes.length; i++) {
        var node = nodes[i];
        var parent = node.parent;
        if (parent) {
            var with_offset = parent.x + node.rel_offset * 4;
            arrow(ctx, parent.x + node.rel_offset * 4, node.x, -10, -node.height);
            ctx.font = rel_font;
            ctx.fillStyle = rel_color;
            ctx.fillText(node.rel, (with_offset + node.x) / 2, -node.height - 2);
        }
        ctx.font = text_font;
        ctx.fillStyle = text_color;
        ctx.fillText(node.value, node.x, 5);
    }
}

function go(str) {
    // Clean up the string
    str = str.replace(/^\s+/, "");
    var open = 0;
    for (var i = 0; i < str.length; i++) {
        if (str[i] == "[") open++;
        if (str[i] == "]") open--;
    }
    while (open < 0) {
        str = "[" + str;
        open++;
    }
    while (open > 0) {
        str = str + "]";
        open--;
    }

    var parsed = parse(null, "", str);
    return go_from_root(parsed.root, parsed.res);
}

function to_array(x) {
    if (x == undefined) {
        return [];
    } else if (! (x instanceof Array)) {
        return [x];
    } else {
        return x;
    }
}

function go_from_root(root, nodes) {

    var canvas;
    var ctx;

    try {
        // Make a new canvas. Required for IE compatability.
        canvas = document.createElement("canvas");
        ctx = canvas.getContext('2d');
    } catch (err) {
        throw "canvas";
    }

    // Find out dimensions of the tree.
    roots = to_array(root);
    roots.map(function (root) { root.set_height(nodes); });
    roots.map(function (root) { root.set_rel_offset(nodes); });
    var root_height = 0;
    for (var i=0; i<nodes.length; i++) {
        root_height = Math.max(root_height, nodes[i].height);
    }

    var width = assign_locations(ctx, root, nodes) + 2 * margin;
    var height = root_height + vert_space + font_size + 2 * margin;

//    console.log("root ready to draw: ", root);

    canvas.id = "canvas";
    canvas.width = width;
    canvas.height = height;
    ctx.fillStyle = "rgba(255, 255, 255, 0)";
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = "rgb(0, 0, 0)";
    ctx.textAlign = "center";
    var x_shift = margin;
    var y_shift = Math.floor(root_height + vert_space + font_size + margin);
    ctx.translate(x_shift, y_shift);

    draw(ctx, nodes);
   // for (var i = 0; i < movement_lines.length; i++)
    //    if (movement_lines[i].should_draw) movement_lines[i].draw(ctx);

    // Swap out the image
    return Canvas2Image.saveAsPNG(canvas, true);
}

function subscriptify(in_str) {
    var out_str = "";
    for (var i = 0; i < in_str.length; ++i) {
        switch (in_str[i]) {
        case "0": out_str = out_str + "₀"; break;
        case "1": out_str = out_str + "₁"; break;
        case "2": out_str = out_str + "₂"; break;
        case "3": out_str = out_str + "₃"; break;
        case "4": out_str = out_str + "₄"; break;
        case "5": out_str = out_str + "₅"; break;
        case "6": out_str = out_str + "₆"; break;
        case "7": out_str = out_str + "₇"; break;
        case "8": out_str = out_str + "₈"; break;
        case "9": out_str = out_str + "₉"; break;
        }
    }
    return out_str;
}

function parse(parent, parent_rel, str) {
    var n = new Node();

    var res = [];

    n.rel = parent_rel;

    function clr() {
        while (str && str[0] == " ") {
            str = str.substring(1);
        }
    }

    function parse_children(left) {
        while (str && str[0] == "[") {
            str = str.substring(1);
            var rel = ""
            while (str && str[0] != " ") {
                rel += str[0];
                str = str.substring(1);
            }
            clr();
            res_and_str = parse(n, rel, str);
            if (left) {
                res = res_and_str.res.concat(res);
            } else {
                res = res.concat(res_and_str.res);
            }
            str = res_and_str.str;
            str = str.substring(1);
            clr();
        }
    }

    clr();
    parse_children(true);
    clr();
    n.value = ""
    while (str && str[0] != "[" && str[0] != "]" && str[0] != " ") {
        n.value += str[0];
        str = str.substring(1);
    }
    res.push(n);
    if (parent) {
        n.parent = parent;
    }
    clr();
    parse_children(false);
    clr();

    for (var i = 0; i < res.length; i++) {
        res[i].pos = i;
    }

    return {
        str: str,
        res: res,
        root: n
    };

}
