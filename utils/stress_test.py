# -*- coding: utf-8 -*-
import json
import os
import random
import time
import sys
from urllib import quote

import httplib

server = "demo.spraakdata.gu.se:80"
directory = "/dan/backend/"

def invoke(text,settings):
    address = directory + "?text=" + quote(text) + "&settings=" + quote(json.dumps(settings))
    h = httplib.HTTPConnection(server)
    headers = {"Content-type": "application/xml", "Accept": "text/plain"}
    h.request('POST', address, text, headers)
    print h.getresponse().read()


# 'word' is not listed here, it is added later
attributes = ['pos', 'msd', 'lemma', 'lex', 'saldo', 'prefix', 'suffix', 'ref', 'dephead', 'deprel']

def random_subset(xs):
    return [ x for x in xs if random.random() < 0.5 ]

def random_element(xs):
    return xs[random.randint(0,len(xs)-1)]

# Some sentences from Swedish Wikipedia
exempelmeningar = [
    'Exempeltexten kommer lastad.',
    'Geijer var professor i historia vid Uppsala universitet från 1817 och blev 1824 ledamot av Svenska Akademien.',
    'Han var vidare rektor för Uppsala universitet under åren 1822, 1830, 1836 och 1843–1844.',
    'Som representant för universitetet var han ledamot av prästeståndet i ståndsriksdagen under åren 1828–1830 och 1840–1841.',
    'Han var vidare medlem av Götiska förbundet och redaktör för dess tidskrift Iduna.',
    'Om sina intresseområden skriver Geijer själv.',
    'Med fem saker har jag befattat mig - ivrigt, om ej med framgång - filosofi, historia, vältalighet, poesi och musik.',
    'Det är de fem fingrarna på min hand, vilka jag i ärlig slöjd uppövat och av vilka jag ej vill uppgiva någondera.',
    'Geijer medverkade till att föra konservatismen till den svenska politiska idédebatten.',
    'Han bidrog vidare till att slaveriet avskaffades i den dåvarande svenska kolonin Saint-Barthélemy, påverkade med sin teologi Nathan Söderblom och Einar Billing samt var en föregångare med sin "jag-du-filosofi".',
    'Nordisk familjebok skriver att det var Geijer som möjliggjorde att liberalismen inträdde i Sverige utan de revolutionära brytningar som skedde i Frankrike, och att han skapade en någorlunda svensk form av liberalism.',
    'Henrik Schück hävdade att Geijer gjorde historieämnet i Sverige till en vetenskap.',
    ]

if __name__ == '__main__':
    random.seed()
    for i in xrange(1,1000):
        text = ' '.join(map(lambda x:random_element(exempelmeningar),xrange(i)))
        attrs = ['word'] + random_subset(attributes)
        print "%s: text length: %s, attributes: %s" % (i, len(text), ', '.join(attrs))
        start_time = time.time()
        invoke(text, { 'attributes': attrs })
        print time.time() - start_time
