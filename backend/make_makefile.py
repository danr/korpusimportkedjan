# Makes a makefile from a JSON object that validates the schema

import re
import json

def is_str_str_tuple(t):
    """Is this object is a tuple of two strings?"""
    return (isinstance(t,tuple) and len(t) == 2
            and isinstance(t[0],basestring)
            and isinstance(t[1],basestring))

def linearise_Makefile(content):
    res = []
    for i in content:
        if isinstance(i,basestring):
            res.append(i)
        elif is_str_str_tuple(i):
            res.append("%s = %s" % (i[0], i[1]))
        elif isinstance(i,list):
            res += align_table([ [k,"="] + v for (k,v) in i ])
        else:
            raise TypeError(str(i) + " is neither string, tuple (of str * str) or list!")
    return '\n'.join(res)

def align_table(rows, empty="-"):
    max_row_len = max(map(len,rows) + [0])
    rows = [ row + [empty] * (max_row_len - len(row)) for row in rows ]
    cols = zip(*rows)
    col_widths = [ max(map(len,col)) for col in cols ]
    fmt = ' '.join('{%s:<%s}' % (ix, width)
                   for ix, width
                   in zip(xrange(len(cols)),col_widths))
    return [ fmt.format(*row) for row in rows ]


def makefile_comment(s):
    """Makes a string to a valid makefile comment"""
    return "\n".join(map(lambda l: "# "+l, s.split("\n")))

def make_Makefile(settings):

    # vrt_columns[_annotations] as column-by-column, initially with default settings
    columns = [('word','word'),
               ('pos','pos'),
               ('msd','msd'),
               ('baseform','lemma'),
               ('lemgram','lex'),
               ('saldo','saldo'),
               ('prefix','prefix'),
               ('suffix','suffix'),
               ('ref','ref'),
               ('dephead.ref','dephead'),
               ('deprel','deprel')]

    # vrt_structs[_annotations]
    structs = []

    # Remove positional attributes that should not be generated
    columns = filter(lambda u : u[1] in settings['attributes'],columns)

    # The root tag
    text = settings['root']['tag']

    # Initial parents. All tags are assumed to have the root node as parent
    parents = []

    # xml_elements and xml_annotations as column-by-column
    xml_cols = []

    # custom rules (used for dephead.ref)
    custom_rules = []

    def add_parent(tag):
        parents.append("token|" + tag)

    def mk_xml_attr(tag,attr):
        return tag + ":" + attr

    def mk_file_attr(tag,attr):
        return tag + "." + attr

    def add_attribute(tag,attr,structural,filename=None):
        filename = filename or tag
        xml_attr = mk_xml_attr(tag,attr)
        file_attr = mk_file_attr(filename,attr)
        struct_attr = mk_xml_attr(filename,attr)
        xml_cols.append((xml_attr,file_attr))
        if structural:
            structs.append((file_attr,struct_attr))
        else:
            columns.append((file_attr,struct_attr))

    # Word (token) segmentation
    ws = settings['word_segmenter']
    if isinstance(ws,basestring):
        """Example:

            word_segmenter: "punkt_word"

        """
        token = ([("token_chunk","sentence"),
                  ("token_segmenter",ws)] +
                ([("token_model","$(punkt_model)")] if "punkt" in ws else []))
    else:
        """Example:

            word_segmenter: { tag: "w",
                              attributes: { pos: "msd", "language": null }
                            }
        """
        token = [makefile_comment("Using tag " + ws['tag'] + " for words")]
        # Adds w -> token in xml
        xml_cols.append((ws['tag'],"token"))
        for e in ws['attributes']:
            key = e['key']
            replace = e['attribute']
            if replace != "custom":
                # Adds w:pos -> msd in xml
                if replace == "dephead":
                    replace += ".ref"
                xml_cols.append((mk_xml_attr(ws['tag'],key),
                                 mk_file_attr('token',replace)))
            else:
                # Adds w:language -> token.language in xml and
                #      token.language -> language in columns
                xml_cols.append((mk_xml_attr(ws['tag'],key),
                                 mk_file_attr('token',key)))
                columns.append((mk_file_attr('token',key),key))

    # Sentence and Paragraph segmentation
    def add_segmenter(setting,name,chunk,model=None):
        if setting == "none":
            return [makefile_comment("No segmentation for " + name)]
        if isinstance(setting,basestring):
            res = [(name + "_chunk",chunk),
                   (name + "_segmenter",setting)]
            if model and "punkt" in setting:
                res.append((name + "_model",model))
            return res
        else:
            """Example

                sentence_segmenter: { tag: "s",
                                      attributes: ["mood","id"]
                                    }
            """
            xml_cols.append((setting['tag'],name))
            add_parent(name)
            for attr in setting['attributes']:
                add_attribute(setting['tag'],attr,
                              structural=True,
                              filename=name)
            return [makefile_comment("Using tag " + setting['tag'] + " for " + name)]

    # add the obligatory structural attribute sentence.id
    structs.append(('sentence.id','sentence:id'))

    # and similar for paragraph if there is some segmentation
    if settings['paragraph_segmenter'] != "none":
        structs.append(('paragraph.n','paragraph'))

    sentence_chunk = text if settings['paragraph_segmenter'] == "none" else "paragraph"
    sentence = add_segmenter(settings['sentence_segmenter'], "sentence", sentence_chunk, "$(punkt_model)")
    paragraph = add_segmenter(settings['paragraph_segmenter'], "paragraph", text, "$(punkt_model)")

    def add_structural_attributes(tag,attributes,add_xml=False):
        if len(attributes) > 0 or add_xml:
            xml_cols.append((tag,tag))
        if len(attributes) > 0:
            add_parent(tag)
            for attr in attributes:
                add_attribute(tag,attr,structural=True)

    # Extra tags
    for t in settings['extra_tags']:
        add_structural_attributes(t['tag'],t['attributes'])

    # Add the root tag to xml and its attributes
    add_structural_attributes(text,settings['root']['attributes'],add_xml=True)

    # Assemble the makefile
    rows = ([("corpus",settings['corpus']),  # TODO: escaping of non-filename characters!
             ("original_dir","original"),
             ("files","$(basename $(notdir $(wildcard $(original_dir)/*.xml)))"),
             "",
             zip(["vrt_columns_annotations","vrt_columns"], map(list,zip(*columns))),
             "",
             zip(["vrt_structs_annotations","vrt_structs"], map(list,zip(*structs))),
             "",
             zip(["xml_elements","xml_annotations"], map(list,zip(*xml_cols))),
             ""] +

            token + [""] +
            sentence + [""] +
            paragraph + [""] +

            [("parents"," ".join(parents)),
             ""
             "include ../Makefile.common",
             ""
             ])

    custom_rule_names = map(lambda t:t[0],custom_rules)
    if len(custom_rule_names) > 0:
        for custom in custom_rules:
            rows += [makefile_comment("Custom rule for " + custom[0] + ":"), custom[1], ""]

        rows += [("custom_rules",' '.join(custom_rule_names)), ""]

    rows.append("include ../Makefile.rules")

    # Intersperse a blank row
    return rows

def makefile(d):
    """
    Makes a makefile from a dictionary of settings, which should be
    validated against the schema in settings_schema.json.
    """
    return str(linearise_Makefile(make_Makefile(d)))

if __name__ == '__main__':

    import sb.util

    def jsjson_to_json(s):
        """
        JavaScript JSON to JSON (as strings)
        """
        def stringifyKeys(s):
            return re.sub(r'(\w+):',r'"\1":',s)

        return '\n'.join(filter(lambda l : "//" not in l,
                                map(stringifyKeys,s.split('\n'))))

    def json_to_Makefile(filename):
        """
        Makes a makefile from a javascript json description in filename
        """
        with open(filename,"r") as f:
            initial_json = f.read()

        settings = json.loads(jsjson_to_json(initial_json))

        sb.util.log.info("Writing Makefile...")
        with open("Makefile","w") as f:
            f.write(makefile(settings))
        sb.util.log.info("... done!")

    sb.util.run.main(json_to_Makefile)

