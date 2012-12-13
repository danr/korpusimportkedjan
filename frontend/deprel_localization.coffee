
window.deprel_localization =
    "en":
        "ROOT" : "ROOT"
        "++" : "Coordinating conjunction"
        "+A" : "Conjunctional adverbial"
        "+F" : "Coordination at main clause level"
        "AA" : "Other adverbial"
        "AG" : "Agent"
        "AN" : "Apposition"
        "AT" : "Nominal (adjectival) pre-modifier"
        "CA" : "Contrastive adverbial"
        "DB" : "Doubled function"
        "DT" : "Determiner"
        "EF" : "Relative clause in cleft"
        "EO" : "Logical object"
        "ES" : "Logical subject"
        "ET" : "Other nominal post-modifier"
        "FO" : "Dummy object"
        "FP" : "Free subjective predicative complement"
        "FS" : "Dummy subject"
        "FV" : "Finite predicate verb"
        "I?" : "Question mark"
        "IC" : "Quotation mark"
        "IG" : "Other punctuation mark"
        "IK" : "Comma"
        "IM" : "Infinitive marker"
        "IO" : "Indirect object"
        "IP" : "Period"
        "IQ" : "Colon"
        "IR" : "Parenthesis"
        "IS" : "Semicolon"
        "IT" : "Dash"
        "IU" : "Exclamation mark"
        "IV" : "Nonfinite verb"
        "JC" : "Second quotation mark"
        "JG" : "Second (other) punctuation mark"
        "JR" : "Second parenthesis"
        "JT" : "Second dash"
        "KA" : "Comparative adverbial"
        "MA" : "Attitude adverbial"
        "MS" : "Macrosyntagm"
        "NA" : "Negation adverbial"
        "OA" : "Object adverbial"
        "OO" : "Direct object"
        "OP" : "Object predicative"
        "PL" : "Verb particle"
        "PR" : "Preposition"
        "PT" : "Predicative attribute"
        "RA" : "Place adverbial"
        "SP" : "Subjective predicative complement"
        "SS" : "Other subject"
        "TA" : "Time adverbial"
        "TT" : "Address phrase"
        "UK" : "Subordinating conjunction"
        "VA" : "Notifying adverbial"
        "VO" : "Infinitive object complement"
        "VS" : "Infinitive subject complement"
        "XA" : "Expressions like 'så att säga' (so to speak)"
        "XF" : "Fundament phrase"
        "XT" : "Expressions like 'så kallad' (so called)"
        "XX" : "Unclassifiable grammatical function"
        "YY" : "Interjection phrase"
        "CJ" : "Conjunct (in coordinate structure)"
        "HD" : "Head"
        "IF" : "Infinitive verb phrase minus infinitive marker"
        "PA" : "Complement of preposition"
        "UA" : "Subordinate clause minus subordinating conjunction"
        "VG" : "Verb group"
    "se":
        "ROOT" : "ROOT"
        "++" : "Samordnande konjunktion"
        "+A" : "Konjuktionellt adverb"
        "+F" : "Koordination på huvudsatsnivå"
        "AA" : "Annat adverbial"
        "AG" : "Agent"
        "AN" : "Apposition"
        "AT" : "Framförställt attribut"
        "CA" : "Kontrastivt adverbial"
        "DB" : "Dubbel funktion"
        "DT" : "Bestämningsord bestämd artikel"
        "EF" : "Relativ bisats"
        "EO" : "Egentligt objekt"
        "ES" : "Egentligt subjekt"
        "ET" : "Efterställd bestämning"
        "FO" : "Formellt objekt"
        "FP" : "Fritt subjektivt predikativ (predikatsfyllnad)"
        "FS" : "Formellt subjekt"
        "FV" : "Finit verb predikatsverb"
        "I?" : "Frågetecken"
        "IC" : "Citattecken"
        "IG" : "Övrig interpunktion"
        "IK" : "Kommatecken"
        "IM" : "Infinitivmärke"
        "IO" : "Indirekt objekt (dativobjekt)"
        "IP" : "Punkt"
        "IQ" : "Kolon"
        "IR" : "Parentes"
        "IS" : "Semikolon"
        "IT" : "Divis bindestreck"
        "IU" : "Utropstecken"
        "IV" : "Infinit verb"
        "JC" : "Citattecken 2"
        "JG" : "Övrig interpunktion 2"
        "JR" : "Parentes 2"
        "JT" : "Divis 2 bindestreck 2"
        "KA" : "Komparativt adverbial"
        "MA" : "Satsadverbial"
        "MS" : "Makrosyntagm"
        "NA" : "Negerande adverbial"
        "OA" : "Objektsadverbial (prepositionsobjekt)"
        "OO" : "Direkt objekt (ackusativobjekt)"
        "OP" : "Objektspredikativ (objektiv predikatsfyllnad)"
        "PL" : "Verbpartikel"
        "PR" : "Preposition"
        "PT" : "Predikativt attribut"
        "RA" : "Platsadverbial"
        "SP" : "Subjektspredikativ (subjektiv predikatsfyllnad)"
        "SS" : "Subjekt (övrigt subjekt)"
        "TA" : "Tidsadverbial"
        "TT" : "Tilltalsfras"
        "UK" : "Subjunktion"
        "VA" : "Korrelativt adverbial"
        "VO" : "Objekt med infinitiv"
        "VS" : "Subjekt med infinitiv"
        "XA" : "Uttryck som ”så att säga”"
        "XF" : "Fundamentsfras"
        "XT" : "Uttryck som ”så kallad”"
        "XX" : "Oklassificerbar satsfunktion"
        "YY" : "Interjektionsfras"
        "CJ" : "Samordnat led"
        "HD" : "Huvud"
        "IF" : "Infinitivfras utom infinitivmärke"
        "PA" : "Prepositions komplement"
        "UA" : "Underordnad sats (bisats) utom subjunktion"
        "VG" : "Verbgrupp"

    loc = {}
    for lang, translations of window.deprel_localization
        loc[lang] = "#{rel}: #{translations[rel]}"
    return loc

