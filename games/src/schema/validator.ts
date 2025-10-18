import { z } from "zod";

import { isAutolistPackageValid } from "./autolistPackages.js";
import {
  DisplayTypeValues,
  DistributionPlatformValues,
  GameTypeValues,
  ModmanPackageLoaderValues,
  ModmanTrackingMethodValues,
} from "../models";

const slug = z.string().regex(new RegExp(/^[a-z0-9](-?[a-z0-9])*$/));

const communitySchema = z.strictObject({
  displayName: z.string(),
  categories: z.record(
    slug,
    z.strictObject({
      label: z.string(),
      hidden: z.boolean().optional(),
    })
  ),
  sections: z.record(
    slug,
    z.strictObject({
      name: z.string(),
      excludeCategories: z.array(z.string()).optional(),
      requireCategories: z.array(z.string()).optional(),
    })
  ),
  wikiUrl: z.string().optional(),
  discordUrl: z.string().optional(),
  autolistPackageIds: z.array(z.string()).optional(),
  shortDescription: z.string().optional(),
});

export type CommunitySchemaType = z.infer<typeof communitySchema>;

const _baseInstallRuleSchema = z.strictObject({
  route: z.string(),
  trackingMethod: z.enum(ModmanTrackingMethodValues),
  defaultFileExtensions: z.array(z.string()),
  isDefaultLocation: z.boolean(),
});
type _installRuleSchema = z.infer<typeof _baseInstallRuleSchema> & {
  subRoutes: _installRuleSchema[];
};
const installRuleSchema: z.ZodType<_installRuleSchema> =
  _baseInstallRuleSchema.extend({
    subRoutes: z.lazy(() => installRuleSchema.array()),
  });

const distributionSchema = z.strictObject({
  platform: z.enum(DistributionPlatformValues),
  identifier: z.string().optional().nullable(),
});
const metaSchema = z.strictObject({
  displayName: z.string(),
  iconUrl: z.string().nullable(),
});

const r2modmanSchema = z.strictObject({
  meta: metaSchema,
  internalFolderName: z.string(),
  dataFolderName: z.string(),
  distributions: z.array(distributionSchema),
  settingsIdentifier: z.string(),
  packageIndex: z.string(),
  steamFolderName: z.string(),
  exeNames: z.array(z.string()),
  gameInstanceType: z.enum(GameTypeValues),
  gameSelectionDisplayMode: z.enum(DisplayTypeValues),
  additionalSearchStrings: z.array(z.string()),
  packageLoader: z.enum(ModmanPackageLoaderValues),
  installRules: z.array(installRuleSchema),
  relativeFileExclusions: z.array(z.string()).nullable(),
});

const gameSchema = z.strictObject({
  uuid: z.string().uuid(),
  label: slug,
  meta: metaSchema,
  distributions: z.array(distributionSchema),
  thunderstore: communitySchema.optional(),
  tcli: z.object({}).passthrough().optional(), // TODO: Use strict object with schema
  r2modman: z.array(r2modmanSchema).nullable(),
});

export const ecosystemJsonSchema = z.strictObject({
  schemaVersion: z.string(),
  games: z.record(z.string(), gameSchema),
  communities: z.record(slug, communitySchema),
  packageInstallers: z.record(
    slug,
    z.strictObject({
      name: z.string(),
      description: z.string(),
    })
  ),
  modloaderPackages: z.array(
    z.strictObject({
      packageId: z.string(),
      rootFolder: z.string(),
      loader: z.enum(ModmanPackageLoaderValues),
    })
  ),
});

export type SchemaType = z.infer<typeof ecosystemJsonSchema>;

function assertUnique(items: string[], fieldname: string) {
  const duplicates: string[] = [];
  [...items].sort().reduce((prev, cur) => {
    if (prev == cur && duplicates.indexOf(cur) == -1) {
      duplicates.push(cur);
    }
    return cur;
  });
  if (duplicates.length > 0) {
    throw new Error(
      `Found ${
        duplicates.length
      } duplicates for '${fieldname}':\n\n${duplicates.join("\n")}`
    );
  }
}

export function validateSchemaJson(schemaJson: any): SchemaType {
  const parsed = ecosystemJsonSchema.parse(schemaJson);

  assertUnique(
    Object.values(parsed.games).map((game) => game.uuid),
    "games.[id].uuid"
  );
  assertUnique(
    Object.values(parsed.games).map((game) => game.label),
    "games.[id].label"
  );

  Object.entries(parsed.games).forEach(([key, game]) => {
    if (key !== game.label) {
      throw new Error(
        `Game key mismatch: expected the game definition with key '${key}' ` +
          `to use the label '${key}' but found '${game.label}'`
      );
    }
  });

  Object.entries(parsed.communities).forEach(([key, community]) => {
    (community.autolistPackageIds ?? []).forEach((packageId) => {
      if (!isAutolistPackageValid(packageId)) {
        throw new Error(
          `Invalid autolist package ID "${packageId}" defined for community "${key}"`
        );
      }
    });
  });

  return parsed;
}
