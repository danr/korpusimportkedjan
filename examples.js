var lasbart_xml = lasbart_xml || "";

var all_attributes = ["word", "pos", "msd", "lemma", "lex", "saldo", "prefix", "suffix", "ref", "dephead", "deprel"];

var examples =
    [
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
        { corpus: "Dannes Superkorpus",
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
			attributes: ["namn"]
		  },
		  extra_tags:
		  [
			  { tag: "kapitel",
				attributes: ["namn"]
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
