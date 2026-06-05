import 'dotenv/config'
import { defineConfig } from 'prisma/config'

const isValidPostgresUrl = (value) => {
  if (!value) return false

  try {
    const url = new URL(value)
    return ['postgres:', 'postgresql:'].includes(url.protocol) &&
      Boolean(url.hostname) &&
      Boolean(url.pathname && url.pathname !== '/')
  } catch {
    return false
  }
}

const databaseUrl = process.env.DATABASE_URL
const directUrl = process.env.DIRECT_URL
const shadowDatabaseUrl = process.env.SHADOW_DATABASE_URL
const migrationUrl = isValidPostgresUrl(directUrl) ? directUrl : databaseUrl

if (directUrl && !isValidPostgresUrl(directUrl)) {
  console.warn('DIRECT_URL is not a valid Postgres URL. Falling back to DATABASE_URL for Prisma migrations.')
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: migrationUrl,
    shadowDatabaseUrl: isValidPostgresUrl(shadowDatabaseUrl) ? shadowDatabaseUrl : undefined,
  },
  migrations: {
    path: 'prisma/migrations',
    seed: 'npm run db:seed',
  },
})
