
def make_default_populator(schema):
    """
    make_default_populator :: Schema -> Instance -> IO ()

    Takes a schema and returns a function with populates void values
    in a given instance with the defaults values from the schema.
    """
    props = schema['properties']
    defaults = {}
    for p in props:
        if 'default' in props[p]:
            defaults[p] = props[p]['default']
    def populator(instance):
        for p in defaults:
            instance[p] = instance.get(p, defaults[p])
        return instance
    return populator
