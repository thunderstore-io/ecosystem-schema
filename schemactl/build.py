import copy
import itertools
import textwrap
from os import path

from util import entry_merge
from schema import EntryThunderstore, Schema, SchemaEntry, get_schema_entries

# Build a new version of the schema by merging /generated with overrides, then dumping
# to a .json at the specified location.
def build_schema(outfile: str) -> Schema:
    gen_entries = get_schema_entries("../games/data/generated")
    man_entries = get_schema_entries("../games/data")

    entries = gen_entries[:]

    for man_entry in man_entries:
        gen_entry = next((x for x in gen_entries if x.uuid == man_entry.uuid), None)

        # No match in generated. Add this value onto the entries list and continue.
        if gen_entry is None:
            entries.append(man_entry)
            continue

        # Entries with matching UUID must also have matching labels.
        if gen_entry.label != man_entry.label:
            raise Exception(textwrap.dedent(f"""
                Unable to merge game definition with matching UUID but differing labels.
                - Label 1: {man_entry.label}
                - Label 2: {gen_entry.label}
            """))

        # Overwrite / extend fields on the generated entry with the manual entry.
        gen_entry = entry_merge(man_entry, gen_entry)

    games = dict[str, SchemaEntry]()
    communities = dict[str, EntryThunderstore]()

    for entry in entries:
        # Assert that the following fields are unique within entries.
        uuid_match = list(x for x in entries if x.uuid == entry.uuid)
        if len(uuid_match) != 1:
            print(len(uuid_match))
            pretty = ", ".join(list(x.label for x in uuid_match))
            raise Exception(textwrap.dedent(f"""
                Ecosystem schema entry {entry.label} does not have a unique UUID.
                - UUID: {entry.uuid}
                - Label matches: {pretty}
            """))

        if len(list(x for x in entries if x.label == entry.label)) != 1:
            raise Exception(textwrap.dedent(f"""
                Ecosystem schema entry {entry.label} does not have a unique label.
                - Label: {entry.label}
            """))

        games[entry.label] = entry
        if entry.thunderstore is not None:
            communities[entry.label] = entry.thunderstore

    return Schema(
        schema_version="0.1.12",
        games=games,
        communities=communities,
        package_installers=list(),
    )
