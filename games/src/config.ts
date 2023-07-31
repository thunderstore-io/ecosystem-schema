import "dotenv/config";

const requireConfig = (name: string, value: string | undefined): string => {
  if (!value) {
    throw new Error(`${name} environment variable must be set!`);
  }
  return value;
};

const DEPLOY_API_URL: string | undefined = process.env.DEPLOY_API_URL;

export const getDeployApiUrl = () =>
  requireConfig("DEPLOY_API_URL", DEPLOY_API_URL);

const DEPLOY_API_KEY: string | undefined = process.env.DEPLOY_API_KEY;

export const getDeployApiKey = () =>
  requireConfig("DEPLOY_API_KEY", DEPLOY_API_KEY);
