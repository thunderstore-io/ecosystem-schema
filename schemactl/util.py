import copy
import os

from schema import SchemaEntry

def get_env_var(key) -> str:
    val = os.environ[key]
    if val is None:
        raise Exception(f"Environment variable {key} must be set.")
    return val

# Merge the first entry into the second, replacing duplicate fields and extending new ones.
def entry_merge(first: SchemaEntry, second: SchemaEntry):
    new = copy.deepcopy(second)
    new.__dict__.update(first)
    return new
