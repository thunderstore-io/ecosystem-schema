import shutil
import template

from argparse import ArgumentParser
from os import path

from build import build_schema
from schema import load_entry

entry_dir = "../games/data"

def do_validate(args):
    return build_schema()

def do_add(args):
    # Validate the file and ensure that it is unique within the schema entry directory.
    entry = load_entry(args.file)
    filename = f"{entry.label}.yml"
    destpath = path.join(entry_dir, filename)

    if path.exists(destpath):
        raise Exception(f"A schema entry already exists with filename '{filename}' at '{destpath}'")

    # Copy the new entry into the destination path and validate the schema.
    shutil.copyfile(args.file, destpath)
    do_validate()

def do_build(args):
    schema = build_schema()
    outjson = schema.model_dump_json(indent=2)

    outfile = open(args.output, "w+")
    outfile.write(outjson)

def do_template(args):
    templates = template.get_templates()
    if not args.name or not args.name in [x.name for x in templates]:
        for temp in templates:
            print("Template:")
            print(f"- Name: {temp.name}")
            print(f"- Desc: {temp.description}")
        return
    template.copy_template(args.name, args.output)

parser = ArgumentParser()
subparsers = parser.add_subparsers()

validate_parser = subparsers.add_parser("validate")
validate_parser.add_argument("--file", type=str)
validate_parser.set_defaults(func=do_validate)

add_parser = subparsers.add_parser("add")
add_parser.add_argument("file", type=str)
add_parser.set_defaults(func=do_add)

build_parser = subparsers.add_parser("build")
build_parser.add_argument("output", type=str)
build_parser.set_defaults(func=do_build)

template_parser = subparsers.add_parser("template")
template_parser.add_argument("name", type=str, nargs="?", default=None)
template_parser.add_argument("output", type=str, nargs="?", default=None)
template_parser.set_defaults(func=do_template)

args = parser.parse_args()
args.func(args)

