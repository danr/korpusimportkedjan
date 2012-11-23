
// follow references in json schema
function follow_json_schema_references(p) {
    for (var k in p) {
        if (p[k]["$ref"]) {
            var arr = p[k]["$ref"].slice(2).split('/')
            var find = schema;
            for (var i in arr) {
                find = find[arr[i]];
            }
            delete p[k]["$ref"]
            for (var i in find) {
                if(!p[k][i]) {
                    p[k][i] = find[i];
                }
            }
        } else if (typeof(p[k]) != "string") {
            follow_json_schema_references(p[k]);
        }
    }
}

