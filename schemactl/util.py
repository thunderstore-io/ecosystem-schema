import copy
import os
import textwrap

from pydantic import ValidationError

from schema import PartialSchemaEntry, SchemaEntry

def get_env_var(key) -> str:
    val = os.environ[key]
    if val is None:
        raise Exception(f"Environment variable {key} must be set.")
    return val

# Merge values from `source` into a copy of `dest`, returning the resulting SchemaEntry.
def entry_merge(source: PartialSchemaEntry | SchemaEntry, dest: SchemaEntry):
    new = copy.deepcopy(dest)

    if type(source) is PartialSchemaEntry:
        new.__dict__.update(source.__pydantic_extra__)
    else:
        new.__dict__.update(source)

    return new

def partial_entry_merge(source: PartialSchemaEntry, dest: PartialSchemaEntry) -> PartialSchemaEntry:
    new = copy.deepcopy(dest)
    new.__dict__.update(source)
    return new

def make_validation_err(error: ValidationError) -> str:
    details = error.errors()
    messages = []

    for i, error in enumerate(details):
        loc = ".".join(map(lambda x: str(x), error["loc"]))
        messages.append(textwrap.dedent(f"""
        Error {i}:
        - `{loc}` = {error["input"]}
        - Cause: {error["msg"]}
        - Type: {error["type"]}
        """))

    return "\n".join(messages)
