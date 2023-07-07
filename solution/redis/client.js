import { createClient } from 'redis'

const host = process.env.REDIS_HOST
const port = Number(process.env.REDIS_PORT)
const password = process.env.REDIS_PASSWORD

export const redis = createClient({ socket: { host, port }, password })

redis.on('error', (err) => console.log('Redis Client Error', err))

await redis.connect()
