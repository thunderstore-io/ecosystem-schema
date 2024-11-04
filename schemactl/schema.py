from enum import Enum
import glob
from typing import Optional
import yaml
import humps

from functools import cache
from os import path

from pydantic import AnyUrl, BaseModel, Field, FileUrl, UUID4, validator

# Get a cached deserialized list of all ecosystem entries found within ../games/data.
@cache
def get_schema_entries(dir: str) -> list["SchemaEntry"]:
    schema_files = glob.glob(dir + "/*.yml")
    yml_entries = map(lambda file: yaml.load(open(file), Loader=yaml.Loader), schema_files)

    entries = []
    for yml_entry in yml_entries:
        # We decamelize here to convert from camelCase into the Python-relevant snake case.
        decamel = humps.decamelize(yml_entry)
        entries.append(SchemaEntry.model_validate(decamel))

    return entries

# Load a single ecosystem entry from the provided .yml file path.
def load_entry(file: str) -> "SchemaEntry":
    des = yaml.load(open(file), Loader=yaml.Loader)
    return SchemaEntry.model_validate(des)

class EntryMeta(BaseModel):
    display_name: str
    icon_url: str

class EntryDist(BaseModel):
    platform: str
    identifier: Optional[str] = None

class EntryThunderstore(BaseModel):
    display_name: str
    discord_url: Optional[AnyUrl] = None
    wiki_url: Optional[AnyUrl] = None
    categories: dict
    sections: dict

class GameInstanceType(Enum):
    GAME = "game"
    SERVER = "server"

class GameSelectionDisplayMode(Enum):
    VISIBLE = "visible"
    HIDDEN = "hidden"

class TrackingMethod(Enum):
    SUBDIR = "subdir"
    SUBDIR_NO_FLATTEN = "subdir-no-flatten"
    STATE = "state"
    PACKAGE_ZIP = "package-zip"
    NONE = "none"

class InstallRule(BaseModel):
    route: str
    default_file_extensions: list[str]
    trackingMethod: TrackingMethod
    sub_routes: list["InstallRule"]
    is_default_location: bool

class EntryR2(BaseModel):
    internal_folder_name: str
    data_folder_name: str
    settings_identifier: str
    package_index: AnyUrl
    exclusions_url: FileUrl
    steam_folder_name: str
    exe_names: list[str]
    game_instance_type: GameInstanceType
    game_selection_display_mode: GameSelectionDisplayMode
    install_rules: list[InstallRule]

class SchemaEntry(BaseModel):
    uuid: UUID4
    label: str
    meta: EntryMeta
    distributions: list[EntryDist]
    thunderstore: Optional[EntryThunderstore] = None
    r2modman: EntryR2 = Field(EntryR2, alias="r_2modman")

class Schema(BaseModel):
    schema_version: str
    games: dict[str, SchemaEntry]
    communities: dict[str, EntryThunderstore]
    package_installers: list

    # @validator('label')
    # def validate_label(cls, v):
    #     schema_entries = get_schema_entries()
    #     is_unique = len([entry for entry in schema_entries if entry["label"] == v]) == 1

    #     if not is_unique:
    #         raise Exception(f"Label {v} already exists within the ecosystem schema")
    #     return str(v)

