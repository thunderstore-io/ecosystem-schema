import { z } from "zod";

const slug = z.string().regex(new RegExp(/^[a-z0-9](-?[a-z0-9])*$/));

const communitySchema = z.strictObject({
  displayName: z.string(),
  categories: z.record(
    slug,
    z.strictObject({
      label: z.string(),
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
});

export type CommunitySchemaType = z.infer<typeof communitySchema>;

export const ecosystemJsonSchema = z.strictObject({
  schemaVersion: z.string(),
  games: z.record(
    z.string(),
    z.strictObject({
      uuid: z.string().uuid(),
      label: slug,
      meta: z.strictObject({
        displayName: z.string(),
        iconUrl: z.string().nullable(),
      }),
      distributions: z.array(
        z.strictObject({
          platform: z.string(),
          identifier: z.string().optional(),
        })
      ),
      thunderstore: communitySchema.optional(),
      tcli: z.object({}).optional(), // TODO: Use strict object with schema
      r2modman: z.object({}).optional(), // TODO: Use strict object with schema
    })
  ),
  communities: z.record(slug, communitySchema),
  packageInstallers: z.record(
    slug,
    z.strictObject({
      name: z.string(),
      description: z.string(),
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

  return parsed;
}
