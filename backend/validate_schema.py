"""
Validates the json schema in settings_schema.json
and tries in on the example dannes_superkorpus.json.

A successful run should is a silent run.
"""

from jsonschema import Draft3Validator, ErrorTree
import json

"""
Loading the schema and making a validator
"""
with open("settings_schema.json","r") as f:
    schema_str = f.read()

schema = json.loads(schema_str)

validator = Draft3Validator(schema)

"""
Testing the schema against an instance
"""
with open("dannes_superkorpus.json","r") as f:
    instance_str = f.read()

instance = json.loads(instance_str)

validator.validate(instance)

"""
Test using the default populator
"""
from schema_utils import make_default_populator

populate_defaults = make_default_populator(schema)

validator.validate(populate_defaults({}))
