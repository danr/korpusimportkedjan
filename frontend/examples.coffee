attasidor_xml = window.attasidor_xml or "";
drama_xml = window.drama_xml or "";
lasbart_xml = window.lasbart_xml or "";
talbanken_xml = window.talbanken_xml or "";

window.all_attributes = ["word", "pos", "msd", "lemma", "lex", "saldo", "prefix", "suffix", "ref", "dephead", "deprel"];

window.examples =
    [
        title: "Drama"
        corpus: "drama"
        word_segmenter: "punkt_word"
        sentence_segmenter: "punkt_sentence"
        paragraph_segmenter:
            tag: "p"
            attributes: []
        root:
            tag: "text"
            attributes: []
        extra_tags: []
        attributes: all_attributes
        corpus_xml: drama_xml
    ,
        title: "Åtta sidor"
        corpus: "attasidor"
        word_segmenter: "punkt_word"
        sentence_segmenter: "punkt_sentence"
        paragraph_segmenter: "blanklines"
        root:
            tag: "text"
            attributes: ["date","title"]
        extra_tags: []
        attributes: all_attributes
        corpus_xml: attasidor_xml
    ,
        title: "Talbanken"
        corpus: "talbanken"
        word_segmenter:
            tag: "w"
            attributes: [
                { key: "ref", attribute: "ref" }
                { key: "deprel", attribute: "deprel" }
                { key: "dephead", attribute: "dephead" }
            ]
        sentence_segmenter: "blanklines"
        paragraph_segmenter: "none"
        root:
            tag: "text"
            attributes: []
        extra_tags: []
        attributes: all_attributes
        corpus_xml: talbanken_xml
    ,
        title: "Läsbart"
        corpus: "lasbart"
        word_segmenter:
            tag: "w"
            attributes: [
                { key: "pos", attribute: "msd" }
            ]
        sentence_segmenter: "punkt_sentence"
        paragraph_segmenter: "none"
        root:
            tag: "text"
            attributes: ["source","age","author","type","title"]
        extra_tags: []
        attributes: all_attributes
        corpus_xml: lasbart_xml
    ,
        title: "Exempelkorpus"
        corpus: "exempelkorpus"
        word_segmenter: "punkt_word"
        root:
            tag: "text"
            attributes: ["title"]
        sentence_segmenter:
            tag: "s"
            attributes: ["mood"]
        paragraph_segmenter:
            tag: "p"
            attributes: ["name"]
        extra_tags:
            [
                tag: "chapter"
                attributes: ["name"]
            ]
        attributes: all_attributes
        corpus_xml: """
'<text title="Dannes Superkorpus">
  <chapter name="Dan berättar om korpusen">
    <p name="Första paragrafen">
      <s mood="glada">
        Malin och Dan skriver en korpus.
      </s>
      <s mood="förväntansfulla">
        Den blir bra.
      </s>
    </p>
    <p name="Andra paragrafen">
      <s mood="melankoliska">
        Vi minns det som igår när vi skrev vår första korpus.
      </s>
    </p>
  </chapter>
  <chapter name="Avslutningen">
    <p name="Slutparagraf">
      <s mood="ledsna">
        Korpusen blev inte färdig.
      </s>
    </p>
  </chapter>
</text>
"""]
