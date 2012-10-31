var lasbart_xml = lasbart_xml || "";

var examples =
    [
        { title: "Läsbart",
          word_nav: "word_custom",
          word_tag: "w",
          sentence_nav: "sentence_punkt",
          paragraph_nav: "paragraph_none",
          corpus_xml: lasbart_xml
        },
        { title: "Dannes superkorpus",
          word_nav: "word_punkt",
          sentence_nav: "sentence_custom",
          sentence_tag: "s",
          paragraph_nav: "paragraph_custom",
          paragraph_tag: "p",
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
