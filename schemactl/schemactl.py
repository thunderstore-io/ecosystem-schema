import yaml
import glob
import shutil
import humps

from schema import SchemaEntry, load_entry

from os import path
from argparse import ArgumentParser

entry_dir = "../games/data"

def handle_validate(args):
    if args.file is not None:
        file = yaml.load(open(args.file), Loader=yaml.Loader)
        schema = SchemaEntry.model_validate(humps.decamelize(file))
        print(f"Successfully validated {args.file}")
        print(schema.__dict__)
        return

    # No file was provided, validate the entire schema.
    data_dir = "../games/data"
    schema_files = glob.glob(data_dir + "/*.yml")
    schema_entries = list(map(lambda file: yaml.load(open(file), Loader=yaml.Loader), schema_files))

    for entry in schema_entries:
        SchemaEntry.model_validate(humps.decamelize(entry))

    print(f"Successfully validated {len(schema_entries)} ecosystem schema entries")

def handle_add(args):
    # Validate the file and ensure that it is unique within the schema entry directory.
    entry = load_entry(args.file)
    filename = f"{entry['label']}.yml"
    destpath = path.join(entry_dir, filename)

    if path.exists(destpath):
        raise Exception(f"A schema entry already exists with filename '{filename}' at '{destpath}'")

    shutil.copyfile(args.file, destpath)

def handle_build(args):
    # Compile each ecosystem schema entry into a single .json
    print()

parser = ArgumentParser()
subparsers = parser.add_subparsers()

validate_parser = subparsers.add_parser("validate")
validate_parser.add_argument("--file", type=str)
validate_parser.set_defaults(func=handle_validate)

add_parser = subparsers.add_parser("add")
add_parser.add_argument("file", type=str)
add_parser.set_defaults(func=handle_add)

build_parser = subparsers.add_parser("build")
add_parser.add_argument("--output", type=str)
add_parser.set_defaults(func=handle_build)

args = parser.parse_args()
args.func(args)

