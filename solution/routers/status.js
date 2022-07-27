import { Router } from 'express'

import { redis } from '../redis/index.js'

export const statusRouter = Router()

const name = process.env.npm_package_name
const version = process.env.npm_package_version

statusRouter.get('/', async (req, res) => {
  const pingResponse = await redis.ping()
  res.send({ name, version, pingResponse })
})
