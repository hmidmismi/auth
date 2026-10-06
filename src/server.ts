import { betterAuth } from 'better-auth';
import { Pool } from 'pg';

/** What `createAuth` needs to know about the app it serves. */
export type AuthConfig = {
  /** PostgreSQL connection string. On Workers, the Hyperdrive binding's connection string. */
  databaseUrl: string;
  /** Signs and encrypts cookies and tokens. At least 32 random characters; keep it a Worker secret. */
  secret: string;
  /** The app's public origin, e.g. `https://hawkeye.dram3.workers.dev`. It is also the only trusted origin. */
  baseUrl: string;
  /** Prefix for the auth cookies, so apps on one domain do not share them. */
  cookiePrefix: string;
  /** Allow `signUpEmail`. Only the account-creation script turns this on; an app serving HTTP never does. */
  allowSignUp?: boolean;
};

/** Seven days, in seconds. */
const SESSION_LIFETIME = 60 * 60 * 24 * 7;

/** Timestamp columns every Better Auth table has, mapped to snake_case. */
const TIMESTAMPS = { createdAt: 'created_at', updatedAt: 'updated_at' } as const;

/**
 * Builds a Better Auth instance with its own PostgreSQL pool. Call it once per request on Workers, because
 * a connection cannot be shared between requests there, and call `close` when the request is done.
 *
 * Accounts are email and password with no public sign-up: someone with database access creates each account
 * with `pnpm auth:create-editor`. Table and column names follow the repo's snake_case convention and match
 * `packages/db/src/schema/auth`.
 *
 * @param config - the database, secret, origin and cookie prefix.
 * @returns the auth instance and a function that closes its pool.
 */
export function createAuth(config: AuthConfig) {
  const pool = new Pool({ connectionString: config.databaseUrl, max: 1 });
  const auth = betterAuth({
    database: pool,
    secret: config.secret,
    baseURL: config.baseUrl,
    trustedOrigins: [config.baseUrl],
    emailAndPassword: {
      enabled: true,
      disableSignUp: !config.allowSignUp,
      autoSignIn: false,
      minPasswordLength: 12,
    },
    advanced: {
      cookiePrefix: config.cookiePrefix,
      ipAddress: { ipAddressHeaders: ['cf-connecting-ip'] },
    },
    user: {
      modelName: 'auth_users',
      fields: { emailVerified: 'email_verified', ...TIMESTAMPS },
    },
    session: {
      modelName: 'auth_sessions',
      expiresIn: SESSION_LIFETIME,
      fields: {
        userId: 'user_id',
        expiresAt: 'expires_at',
        ipAddress: 'ip_address',
        userAgent: 'user_agent',
        ...TIMESTAMPS,
      },
    },
    account: {
      modelName: 'auth_accounts',
      fields: {
        userId: 'user_id',
        accountId: 'account_id',
        providerId: 'provider_id',
        accessToken: 'access_token',
        refreshToken: 'refresh_token',
        idToken: 'id_token',
        accessTokenExpiresAt: 'access_token_expires_at',
        refreshTokenExpiresAt: 'refresh_token_expires_at',
        ...TIMESTAMPS,
      },
    },
    verification: {
      modelName: 'auth_verifications',
      fields: { expiresAt: 'expires_at', ...TIMESTAMPS },
    },
  });
  return { auth, close: () => pool.end() };
}

/** A Better Auth instance made by `createAuth`. */
export type Auth = ReturnType<typeof createAuth>['auth'];
