from glob import glob
from itertools import takewhile
from os import path
from uuid import uuid4

class Template:
    name: str
    description: str

    def __init__(this, name, description):
        this.name = name
        this.description = description

def get_templates() -> list[Template]:
    files = glob("./templates/*.yml")
    templates = []

    for file in files:
        name = path.basename(file)
        lines = open(file).read().splitlines()
        desc = "\n".join([x.lstrip("# ") for x in takewhile(lambda x: x != "", lines)])

        templates.append(Template(name, desc))

    return templates

def copy_template(name: str, output: str):
    templates = get_templates()
    if not name in [x.name for x in templates]:
        raise Exception(f"A template with name `{name}` could not be found.")

    # Re-read the template, strip the leading description, insert the UUID field, and write it out.
    template_lines = open(f"./templates/{name}").read().splitlines()
    first = template_lines.index("") + 1

    uuid = uuid4()
    template = "\n".join([f"uuid: {uuid}"] + template_lines[first::])

    open(output, "w+").write(template)
