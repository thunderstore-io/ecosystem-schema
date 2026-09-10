import "dotenv/config";

const requireConfig = (name: string, value: string | undefined): string => {
  if (!value) {
    throw new Error(`${name} environment variable must be set!`);
  }
  return value;
};

const getConfigOrDefault = (name: string, defaultValue: string): string => {
  return process.env[name] ?? defaultValue;
};

/* For JSON schema */
export const getDeployUrlForSchema = () =>
  getConfigOrDefault(
    "DEPLOY_URL_FOR_SCHEMA",
    "https://thunderstore.io/api/experimental/schema/ecosystem-json-schema/"
  );

/* For data */
export const getDeployUrlForData = () =>
  getConfigOrDefault(
    "DEPLOY_URL_FOR_DATA",
    "https://thunderstore.io/api/experimental/schema/ecosystem-json-data/"
  );

/* Legacy */
export const getDeployApiUrl = () =>
  getConfigOrDefault(
    "DEPLOY_API_URL",
    "https://thunderstore.io/api/experimental/schema/dev/"
  );

/* This is what diff compares against */
export const getLatestSchemaUrl = () =>
  getConfigOrDefault(
    "LATEST_SCHEMA_URL",
    "https://thunderstore.io/api/experimental/schema/dev/latest/"
  );

const DEPLOY_API_KEY: string | undefined = process.env.DEPLOY_API_KEY;

export const getDeployApiKey = () =>
  requireConfig("DEPLOY_API_KEY", DEPLOY_API_KEY);
