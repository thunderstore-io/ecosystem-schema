import os
import textwrap
import humps
import yaml
import schema

from os import path

from schema import SchemaEntry

def r2mm_dir() -> str:
    dir_path = os.environ["R2MM_DIR"] or "../games/r2modmanPlus/"
    if not os.path.isdir(dir_path):
        raise Exception(textwrap.dedent(f"""
            The r2modman directory at {dir_path} does not exist. You can fix this by either:
            - Ensuring that this path exists and points to a valid local r2modman repository.
            - Set a different r2modman directory path via the `R2MM_DIR` environment variable.
        """))

# Validate that each entry's icon exists within the r2modman subrepo.
def validate_icon_paths(entries: list[SchemaEntry]):
    icon_dir = os.path.join(r2mm_dir(), "src/assets/images/game_selection")
    if not path.isdir(icon_dir):
        raise Exception(f"The r2modman icon directory at {icon_dir} does not exist")

    for entry in entries:
        icon_path = path.join(icon_dir, entry.meta.icon_url)
        if path.isfile(icon_path):
            continue
        print(f"WARN: Icon for {entry.label} '{entry.meta.icon_url}' does not exist at '{icon_path}'")

# Determine if the field, as selected by the selector lambda, is unique.
def is_unique_field(entries: list[SchemaEntry], selector):
    values = set()

    for entry in entries:
        value = selector(entry)
        if value in values:
            raise Exception(f"Value '{value}' on entry with label {entry.label} already exists within the schema")

        values.add(value)

# Validate a single .yml file OR all entries within the schema.
def validate(file: str | None = None) -> None:
    if file is None:
        return _validate_all()

    file = yaml.load(open(file), Loader=yaml.Loader)
    schema = SchemaEntry.model_validate(humps.decamelize(file))

    print(f"Successfully validated {file}")
    print(schema.__dict__)

# Validate all schema files.
def _validate_all():
    entries = schema.get_schema_entries("../games/data/generated")
    validate_icon_paths(entries)

    # Assert that all fields contain unique labels, uuids
    unique_fields = ["uuid", "label"]
    for field in unique_fields:
        selector = lambda x: getattr(x, field)
        is_unique_field(entries, selector)

    print(f"Successfully validated {len(entries)} ecosystem schema entries")
