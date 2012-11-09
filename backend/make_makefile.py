
import re
import json
import pprint

import sb.util

pp = pprint.PrettyPrinter()

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

    # vrts as column-by-column, initially with default settings
    vrt_cols = [('word','word','-'),
                ('pos','pos','-'),
                ('msd','msd','-'),
                ('baseform','lemma','-'),
                ('lemgram','lex','-'),
                ('saldo','saldo','-'),
                ('prefix','prefix','-'),
                ('suffix','suffix','-'),
                ('ref','ref','-'),
                ('dephead.ref','dephead','-'),
                ('deprel','deprel','-')]

    # Remove positional attributes that should not be generated
    vrt_cols = filter(lambda u : u[1] in settings['attributes'],vrt_cols)

    # The root tag
    text = settings['root']['tag']

    # Initial parents and chains. All tags are assumed to have the root node as parent
    parents = []
    chains = []

    # xml_elements and xml_annotations as column-by-column
    xml_cols = []

    def add_parent(tag):
        parents.append("token.{0}|token|{0}".format(tag))

    def add_chain(tag,attr):
        chains.append("token.{0}.{1}".format(tag,attr))

    def mk_xml_attr(tag,attr):
        return tag + ":" + attr

    def mk_file_attr(tag,attr):
        return tag + "." + attr

    def add_attribute(tag,attr,structural,mk_chain,filename=None):
        filename = filename or tag
        xml_attr = mk_xml_attr(tag,attr)
        file_attr = mk_file_attr(filename,attr)
        struct_attr = mk_xml_attr(filename,attr)
        xml_cols.append((xml_attr,file_attr))
        if structural:
            vrt_cols.append((file_attr,"-",struct_attr))
        else:
            vrt_cols.append((file_attr,struct_attr,"-"))
        mk_chain and add_chain(filename,attr)

    # Word (token) segmentation
    ws = settings['word_segmenter']
    if isinstance(ws,basestring):
        """Example: word_segmenter: "punkt_word"""
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
        for attr in ws['attributes']:
            replace = ws['attributes'][attr]
            if replace:
                # Adds w:pos -> msd in xml
                xml_cols.append((mk_xml_attr(ws['tag'],attr),
                                 mk_file_attr('token',replace)))
            else:
                # Adds w:language -> token.language in xml and
                #      token.language -> (language, -) in vrt
                xml_cols.append((mk_xml_attr(ws['tag'],attr),
                                 mk_file_attr('token',attr)))
                vrt_cols.append((mk_file_attr('token',attr),attr,'-'))

    # add the obligatory structural attribute sentence.id
    vrt_cols.append(('sentence.id','-','sentence:id'))

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
                              structural=True,mk_chain=True,
                              filename=name)
            return [makefile_comment("Using tag " + setting['tag'] + " for " + name)]

    sentence_chunk = text if settings['paragraph_segmenter'] == "none" else "paragraph"
    sentence = add_segmenter(settings['sentence_segmenter'],
                             "sentence",sentence_chunk,"$(punkt_model)")
    paragraph = add_segmenter(settings['paragraph_segmenter'],
                              "paragraph",text)

    def add_structural_attributes(tag,attributes,add_xml=False):
        if len(attributes) > 0 or add_xml:
            xml_cols.append((tag,tag))
        if len(attributes) > 0:
            add_parent(tag)
            for attr in attributes:
                add_attribute(tag,attr,structural=True,mk_chain=True)

    # Extra tags
    for t in settings['extra_tags']:
        add_structural_attributes(t['tag'],t['attributes'])

    # Add the root tag to xml and its attributes
    add_structural_attributes(text,settings['root']['attributes'],add_xml=True)

    # Add the magic 'n' annotation
    vrt_cols.append(('n','-','-'))

    # Assemble the makefile
    hdr = [("corpus",settings['corpus']),  # TODO: escaping of non-filename characters!
           ("original_dir","original"),
           ("files","$(basename $(notdir $(wildcard $(original_dir)/*.xml)))")]

    common = ["include ../Makefile.common"]

    rules = ["include ../Makefile.rules"]

    vrt = [zip(["vrt_annotations","vrt_columns","vrt_structs"],
               map(list,zip(*vrt_cols)))]

    xml = [zip(["xml_elements","xml_annotations"],
               map(list,zip(*xml_cols)))]

    parents_and_chains = [("parents"," ".join(parents)),
                          ("chains"," ".join(chains))]

    # Add a blank row between sections
    res = []
    [ res.extend(row + [""])
      for row in (hdr, vrt, xml, common, token, sentence, paragraph, parents_and_chains, rules) ]

    return res

def jsjson_to_json(s):
    """JavaScript JSON to JSON (as strings)"""
    def stringifyKeys(s):
        return re.sub(r'(\w+):',r'"\1":',s)

    return '\n'.join(filter(lambda l : "//" not in l,
                            map(stringifyKeys,s.split('\n'))))

def json_to_Makefile(filename):
    """Makes a makefile from a javascript json description in filename"""
    with open(filename,"r") as f:
        initial_json = f.read()

    settings = json.loads(jsjson_to_json(initial_json))

    makefile = make_Makefile(settings)

    settings_str = re.sub(r"u'",r"'", # remove ugly u in u'strings'
                          makefile_comment(pp.pformat(settings)))

    sb.util.log.info("Writing Makefile...")
    with open("Makefile","w") as f:
        f.write(linearise_Makefile([settings_str,""] + makefile))
    sb.util.log.info("... done!")

if __name__ == '__main__':
    sb.util.run.main(json_to_Makefile)

# An example makefile which can be run on linearise_Makefile
example = [
    ("corpus","dannes_superkorpus"),
    ("original_dir","original"),
    ("files","$(basename $(notdir $(wildcard $(original_dir)/*.xml)))"),
    "",
    [
        ("vrt_annotations", ["word", "pos", "msd", "baseform", "lemgram", "saldo", "prefix", "suffix", "ref", "dephead.ref", "deprel", "egennamn.value", "sentence.id", "sentence.mood", "paragraph.namn", "kapitel.namn", "text.korpusnamn", "n"]),
        ("vrt_columns",     ["word", "pos", "msd", "lemma",    "lex",     "saldo", "prefix", "suffix", "ref", "dephead",     "deprel", "egennamn"]),
        ("vrt_structs",     ["-",    "-",   "-",   "-",        "-",       "-",     "-",      "-",      "-",   "-",           "-",      "-",              "sentence:id", "sentence:mood", "paragraph:namn", "kapitel:namn", "text:korpusnamn"])
        ],
    "",
    [
        ("xml_elements",    ["text", "p",         "p:namn",         "s",        "s:mood",        "text:korpusnamn", "kapitel:namn", "egennamn:value"]),
        ("xml_annotations", ["text", "paragraph", "paragraph.namn", "sentence", "sentence.mood", "text.korpusnamn", "kapitel.namn", "egennamn.value"])
        ],
    "",
    "include ../Makefile.common",
    "",
    ("token_chunk","sentence"),
    ("token_segmenter","punkt_word"),
    "",
    ("sentence_chunk","paragraph"),
    ("sentence_segmenter","punkt_sentence"),
    ("sentence_model","$(punkt_model)"),
    "",
    ("paragraph_chunk","text"),
    ("paragraph_segmenter","blanklines"),
    "",
    ("sentence_order","position"),
    ("paragraph_order","position"),
    "",
    ("parents","token.text|token|text token.sentence|token|sentence token.paragraph|token|paragraph token.kapitel|token|kapitel.namn token.egennamn|token|egennamn.value"),
    ("chains","token.text.korpusnamn token.sentence.mood token.paragraph.namn token.kapitel.namn token.egennamn.value"),
    "",
    "include ../Makefile.rules",
    ]

def merge_defaults(settings):
    """Populates a settings dictionary with default settings for missing fields"""
    s = settings.copy()
    for k in defaults:
        s[k] = s.get(k,defaults[k])
    return s

def makefile(d):
    return str(linearise_Makefile(make_Makefile(merge_defaults(d))))

def makefile_from_json_string(s):
    return makefile(json.loads(s))

defaults = {
    'attributes': ['word', 'pos', 'msd', 'lemma', 'lex', 'saldo', 'prefix', 'suffix', 'ref', 'dephead', 'deprel'],
    'corpus': '',
    'extra_tags': [],
    'paragraph_segmenter': 'blanklines',
    'root': {
        'tag': 'text',
        'attributes': []
        },
    'sentence_segmenter': 'punkt_sentence',
    'word_segmenter': 'punkt_word'
    }

# Example settings for make_Makefile
settings = {'attributes': ['word', 'pos', 'msd', 'lemma', 'lex', 'saldo', 'prefix', 'suffix', 'ref', 'dephead', 'deprel'],
            'corpus': 'corpus title',
            'dateformat': '%d%h%ms',
            'datefrom': 'chapter.date',
            'dateregex': None,
            'datesplitter': None,
            'dateto': 'chapter.date',
            'extra_tags': [{'attributes': ['name'], 'tag': 'chapter'},
                           {'attributes': ['name'], 'tag': 'section'}],
            'paragraph_segmenter': 'blanklines',
            'random': 'sentence',
            'root': {'attributes': ['title', 'author'], 'tag': 'text'},
            'sentence_segmenter': {'attributes': ['mood', 'id'], 'tag': 's'},
            'word_segmenter': {'attributes': {'egennamn': None, 'pos': 'msd'},
                               'tag': 'w'},
            'xml_skip': [{'attributes': [], 'tag': 'some_tag'},
                         {'attributes': ['content'], 'tag': 'footnote'}]}
