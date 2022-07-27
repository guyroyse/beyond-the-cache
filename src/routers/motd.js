import { Router } from 'express'

import { redis } from '../redis/index.js'

export const motdRouter = Router()

motdRouter.get('/', async (req, res) => {
  res.send("NOT IMPLEMENTED")
})

motdRouter.put('/', async (req, res) => {
  res.send("NOT IMPLEMENTED")
})

motdRouter.delete('/', async (req, res) => {
  res.send("NOT IMPLEMENTED")
})
