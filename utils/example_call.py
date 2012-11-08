# -*- coding: utf-8 -*-
from subprocess import Popen, PIPE

import json
import urllib

attributes = ['word', 'pos', 'msd', 'lemma', 'lex', 'saldo', 'prefix', 'suffix', 'ref', 'dephead', 'deprel']

address = "http://localhost:8051"
address += "?text=" + urllib.quote("En exempeltext till pipelinen.")
address += "&settings=" + urllib.quote(json.dumps({ "attributes" : attributes }))

print "curl " + address

p = Popen(["curl",address],stdin=PIPE, stdout=PIPE, stderr=PIPE)

stdout, stderr = p.communicate()
print stdout
