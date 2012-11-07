var lasbart_xml = lasbart_xml || "";
var talbanken_xml = talbanken_xml || "";

var all_attributes = ["word", "pos", "msd", "lemma", "lex", "saldo", "prefix", "suffix", "ref", "dephead", "deprel"];

var examples =
    [
        { corpus: "Drama",
		  word_segmenter: "punkt_word",
		  sentence_segmenter: "punkt_sentence",
		  paragraph_segmenter: {
			  tag: "p",
			  attributes: []
		  },
		  root:
		  { tag: "text",
			attributes: [],
		  },
		  extra_tags: [],
		  attributes: all_attributes,
          corpus_xml: drama_xml
        },
        { corpus: "Åtta sidor",
		  word_segmenter: "punkt_word",
		  sentence_segmenter: "punkt_sentence",
		  paragraph_segmenter: "blanklines",
		  root:
		  { tag: "text",
			attributes: ["date","title"],
		  },
		  extra_tags: [],
		  attributes: all_attributes,
          corpus_xml: attasidor_xml
        },
        { corpus: "Talbanken",
		  word_segmenter:
		  { tag: "w",
			attributes: {
				ref: "ref",
				deprel: "deprel",
				dephead: "dephead"
			}
		  },
		  sentence_segmenter: "blanklines",
		  paragraph_segmenter: "none",
		  root:
		  { tag: "text",
			attributes: [],
		  },
		  extra_tags: [],
		  attributes: all_attributes,
          corpus_xml: talbanken_xml
        },
        { corpus: "Läsbart",
		  word_segmenter:
		  { tag: "w",
			attributes: { pos: "msd" }
		  },
		  sentence_segmenter: "punkt_sentence",
		  paragraph_segmenter: "none",
		  root:
		  { tag: "text",
			attributes: ["source","age","author","type","title"]
		  },
		  extra_tags: [],
		  attributes: all_attributes,
          corpus_xml: lasbart_xml
        },
        { corpus: "Exempelkorpus",
		  word_segmenter: "punkt_word",
		  root:
		  { tag: "text",
			attributes: ["title"]
		  },
		  sentence_segmenter:
		  { tag: "s",
			attributes: ["mood"]
		  },
		  paragraph_segmenter:
		  { tag: "p",
			attributes: ["name"]
		  },
		  extra_tags:
		  [
			  { tag: "chapter",
				attributes: ["name"]
			  }
		  ],
		  attributes: all_attributes,
          corpus_xml:
'<text title="Dannes Superkorpus">\n\
  <chapter name="Dan berättar om korpusen">\n\
    <p name="Första paragrafen">\n\
      <s mood="glada">\n\
        Malin och Dan skriver en korpus.\n\
      </s>\n\
      <s mood="förväntansfulla">\n\
        Den blir bra.\n\
      </s>\n\
    </p>\n\
    <p name="Andra paragrafen">\n\
      <s mood="melankoliska">\n\
        Vi minns det som igår när vi skrev vår första korpus.\n\
      </s>\n\
    </p>\n\
  </chapter>\n\
  <chapter name="Avslutningen">\n\
    <p name="Slutparagraf">\n\
      <s mood="ledsna">\n\
        Korpusen blev inte färdig.\n\
      </s>\n\
    </p>\n\
  </chapter>\n\
</text>'}
    ];
