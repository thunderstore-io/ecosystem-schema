from enum import Enum
import glob
import operator
from os import path
import os
from pathlib import Path
import re
import textwrap
from typing import Optional
import yaml

from functools import cache

from pydantic import UUID4, BaseModel, ConfigDict, ValidationError, field_validator, model_validator

@cache
def r2mm_dir() -> str:
    dir_path = os.environ.get("R2MM_DIR", default="../games/r2modmanPlus/")
    if os.path.isdir(dir_path):
        return dir_path

    raise Exception(textwrap.dedent(f"""
        The r2modman directory at `{dir_path}` does not exist. You can fix this by either:
        - Ensuring that this path exists and points to a valid local r2modman repository.
        - Set a different r2modman directory path via the `R2MM_DIR` environment variable.
    """))

# Get a cached deserialized list of all ecosystem entries found within ../games/data.
@cache
def get_schema_entries(dir: str, skip_validation=False) -> list["SchemaEntry"] | list["PartialSchemaEntry"]:
    schema_files = glob.iglob(dir + "/*.yml")
    entries = []

    for schema_file in schema_files:
        entry = yaml.load(Path(schema_file).read_text(), Loader=yaml.Loader)

        if skip_validation:
            entries.append(PartialSchemaEntry.model_validate(entry))
            continue

        try:
            entries.append(SchemaEntry.model_validate(entry, strict=False))
        except ValidationError as e:
            print(f"A validation error occured for {entry['label']}: {e}")
            raise e

    return entries

# Load a single ecosystem entry from the provided .yml file path.
def load_entry(file: str) -> "SchemaEntry":
    des = yaml.load(open(file), Loader=yaml.Loader)
    return SchemaEntry.model_validate(des)

class EntryMeta(BaseModel):
    displayName: str
    iconUrl: str

    @field_validator("iconUrl")
    @classmethod
    def validate_icon(cls, v: str) -> str:
        # Null values are ok in this instance, we just skip it silently.
        if v == "None" or v is None:
            return v

        icon_dir = path.join(r2mm_dir(), "src/assets/images/game_selection")
        icon_path = path.join(icon_dir, v)

        if not path.isdir(icon_dir):
            raise ValueError(f"The r2modman icon directory at {icon_dir} does not exist")
        if not path.isfile(icon_path):
            print(f"Warning: The icon at path `{icon_path}` does not exist")

        return v

class DistributionPlatform(str, Enum):
    STEAM = "steam"
    STEAM_DIRECT = "steam-direct"
    EGS = "epic-games-store"
    OCULUS = "oculus"
    ORIGIN = "origin"
    XBOX_GAME_PASS = "xbox-game-pass"
    OTHER = "other"

    # Does this distribution variant require an identifier?
    def requires_game_identifier(self) -> bool:
        return self in [
            DistributionPlatform.STEAM,
            DistributionPlatform.STEAM_DIRECT,
            DistributionPlatform.EGS,
            DistributionPlatform.ORIGIN,
            DistributionPlatform.XBOX_GAME_PASS,
        ]

class EntryDist(BaseModel):
    platform: DistributionPlatform
    identifier: Optional[str] = None

    @model_validator(mode="after")
    @classmethod
    def validate_identifier(cls, data: any) -> str:
        if data.identifier is None and data.platform.requires_game_identifier():
            raise ValueError(f"Distribution field with platform {data.platform} is missing a valid identifier")
        return data

class EntryThunderstore(BaseModel):
    displayName: str
    discordUrl: Optional[str] = None
    wikiUrl: Optional[str] = None
    categories: dict
    sections: dict

class GameInstanceType(str, Enum):
    GAME = "game"
    SERVER = "server"

class GameSelectionDisplayMode(str, Enum):
    VISIBLE = "visible"
    HIDDEN = "hidden"

class TrackingMethod(str, Enum):
    SUBDIR = "subdir"
    SUBDIR_NO_FLATTEN = "subdir-no-flatten"
    STATE = "state"
    PACKAGE_ZIP = "package-zip"
    NONE = "none"

class ModLoaderPackageRef(str, Enum):
    bepinex = "bepinex"
    melonloader = "melonloader"
    recursive_melonloader = "recursive-melonloader"
    northstar = "northstar"
    godotml = "godotml"
    ancientdungeonvr = "ancientdungeonvr"
    shimloader = "shimloader"
    lovely = "lovely"
    returnofmodding = "returnofmodding"
    gdweave = "gdweave"

class ModLoaderPackage(BaseModel):
    packageId: str
    rootFolder: str
    loader: str

class InstallRule(BaseModel):
    route: str
    defaultFileExtensions: list[str]
    trackingMethod: TrackingMethod
    subRoutes: list["InstallRule"]
    isDefaultLocation: bool

    # Route values must:
    # - Must not contain relative path characters
    # - Must not contain invalid path characters (UNIX + Windows)
    @field_validator("route")
    def validate_route(cls, v):
        pattern = r"^(?!.*\.\./)(?!.*[<>:\"|?*]).*[^/\\]$"
        if not re.match(pattern, v):
            raise ValueError("Route values cannot contain invalid path characters or relative path traversals")
        return v

    @field_validator("defaultFileExtensions")
    def validate_default_file_extensions(cls, v):
        pattern = r"^(\.[a-zA-Z0-9]+)+$"
        invalid = list([x for x in v if not re.match(pattern, x)])
        if len(invalid):
            raise ValueError(f"Invalid file extensions: {invalid}")
        return v

class EntryR2(BaseModel):
    internalFolderName: str
    dataFolderName: Optional[str] = None
    settingsIdentifier: str
    packageIndex: str
    exclusionsUrl: Optional[str] = None
    steamFolderName: str
    exeNames: list[str]
    gameInstanceType: GameInstanceType
    gameSelectionDisplayMode: GameSelectionDisplayMode
    packageLoader: ModLoaderPackageRef
    additionalSearchStrings: list[str]
    installRules: list[InstallRule]

    # These values must be folder names and therefore cannot contain:
    # - Invalid path characters
    # - Directory separators
    # - Directory traversal tokens (../)
    @field_validator("internalFolderName", "dataFolderName", "settingsIdentifier")
    def validate_folder_names(cls, v):
        # Handle dataFolderName optional value.
        if v == "" or v == None:
            return v

        pattern = r"^(?!.*\.\./|.*[\\/]|.*:)[^/\\:*?\"<>|]+$"
        if not re.match(pattern, v):
            raise ValueError(f"Folder names cannot contain path characters, path separators, or relative path traversals")
        return v


class SchemaEntry(BaseModel):
    uuid: UUID4
    label: str
    meta: EntryMeta
    distributions: list[EntryDist]
    thunderstore: Optional[EntryThunderstore] = None
    r2modman: Optional[EntryR2] = None

    @field_validator("label")
    def validate_label(cls, v):
        pattern = r"^[a-z0-9-]+$"
        if not re.match(pattern, v):
            raise ValueError(f"Entry labels must only contain lowercase alphanumeric (a-z) characters, numbers, and hyphens")
        return v

class ModloaderPackage(BaseModel):
    identifier: str
    rootFolder: str
    variant: str

# This model is *only* used when we merge user-created entries with the machine generated ones in
# /data/games/generated. We skip validation here because, prior to merging, we can only assert that the
# uuid and label fields will exist.
class PartialSchemaEntry(BaseModel):
    model_config = ConfigDict(
        extra="allow",
    )
    uuid: str
    label: str

class Schema(BaseModel):
    schema_version: str
    games: dict[str, SchemaEntry]
    communities: dict[str, EntryThunderstore]
    package_installers: list
    modloader_packages: list[ModloaderPackage]

    @model_validator(mode="after")
    def validate_r2mm_icons(self):
        icon_dir = Path(r2mm_dir()).joinpath("src/assets/images/game_selection")
        for game in self.games.values():
            icon_path = icon_dir.joinpath(game.meta.iconUrl)
            if icon_path.exists():
                continue
            print(f"WARN: Icon for {game.label} '{game.meta.iconUrl}' does not exist at '{icon_path}'")
        return self

    @model_validator(mode="after")
    def validate_r2mm_unique_fields(self):
        self._is_unique_field("uuid")
        self._is_unique_field("label")

        return self

    def _is_unique_field(self, field_id):
        seen = set()
        for game in self.games.values():
            val = operator.attrgetter(field_id)(game)
            if val in seen:
                raise ValueError(f"Field '{field_id}' with value '{val}' is not unique")
            seen.add(val)

