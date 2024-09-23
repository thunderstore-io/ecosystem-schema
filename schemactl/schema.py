from enum import Enum
import glob
from typing import Optional
import yaml

from functools import cache
from os import path

from pydantic import AnyUrl, BaseModel, Field, FileUrl, UUID4, validator

@cache
def get_schema_entries():
    data_dir = "../games/data"
    schema_files = glob.glob(data_dir + "/*.yml")
    return list(map(lambda file: yaml.load(open(file), Loader=yaml.Loader), schema_files))

def load_entry(file: str) -> "SchemaEntry":
    des = yaml.load(open(file), Loader=yaml.Loader)
    return SchemaEntry.model_validate(des)

class EntryMeta(BaseModel):
    display_name: str
    icon_url: str

    @validator('icon_url')
    def validate_icon_url(cls, v):
        icon_path = path.join("../games/r2modmanPlus/src/assets/images/game_selection", v)
        if path.isfile(icon_path):
            return str(v)

        raise Exception(f"Icon {v} does not exist at the expected location {icon_path}")

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

    @validator('label')
    def validate_label(cls, v):
        schema_entries = get_schema_entries()
        is_unique = len([entry for entry in schema_entries if entry["label"] == v]) == 1

        if not is_unique:
            raise Exception(f"Label {v} already exists within the ecosystem schema")
        return str(v)

