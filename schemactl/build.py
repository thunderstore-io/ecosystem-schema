import textwrap
import yaml

from pydantic import ValidationError

from util import make_validation_err, partial_entry_merge
from schema import EntryThunderstore, ModloaderPackage, PartialSchemaEntry, Schema, SchemaEntry, get_schema_entries

# Build a new version of the schema by merging /generated with overrides, then dumping
# to a .json at the specified location.
def build_schema() -> Schema:
    # Both of these are partial as we cannot promise that any fields other than `label` and `uuid` exist
    # on generated and manual entries.
    gen_entries: list[PartialSchemaEntry] = get_schema_entries("../games/data/generated", skip_validation=True)
    man_entries: list[PartialSchemaEntry] = get_schema_entries("../games/data", skip_validation=True)

    entries = gen_entries[:]

    for man_entry in man_entries:
        gen_entry = next((x for x in gen_entries if x.uuid == man_entry.uuid), None)

        # No machine generated match was found. Validate and add the partial entry to the list.
        if gen_entry is None:
            try:
                SchemaEntry.model_validate(man_entry.model_dump())
            except ValidationError as e:
                raise Exception(f"'{man_entry.label}' has failed validation.\n{make_validation_err(e)}")

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
        gen_entry = partial_entry_merge(man_entry, gen_entry)

    games = dict[str, SchemaEntry]()
    communities = dict[str, EntryThunderstore]()

    for entry in entries:
        # Assert that the following fields are unique within entries.
        uuid_match = list(x for x in entries if x.uuid == entry.uuid)
        if len(uuid_match) != 1:
            pretty = ", ".join(list(x.label for x in uuid_match))
            raise Exception(textwrap.dedent(f"""
                Ecosystem schema entry {entry.label} does not have a unique UUID.
                - UUID: {entry.uuid}
                - Label matches: {pretty}
            """))

        if len(list(x for x in entries if x.label == entry.label)) != 1:
            raise Exception(textwrap.dedent(f"""
                Ecosystem schema entry {entry.label} does not have a unique label.
            """))

        try:
            games[entry.label] = SchemaEntry.model_validate(entry.model_dump())
        except ValidationError as e:
            raise Exception(f"'{entry.label}' has failed validation.\n{make_validation_err(e)}")

        if hasattr(entry, "thunderstore") and entry.thunderstore is not None:
            communities[entry.label] = entry.thunderstore

    # Create the list of modloader packages
    mlp_file = open("../modloader-packages.yml")
    modloader_packages = map(lambda x: ModloaderPackage.model_validate(x), yaml.load(mlp_file, Loader=yaml.Loader))

    return Schema(
        schema_version="0.1.12",
        games=games,
        communities=communities,
        package_installers=list(),
        modloader_packages=list(modloader_packages),
    )
