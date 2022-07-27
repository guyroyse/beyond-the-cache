import { Router } from 'express'

import { redis } from '../redis/index.js'

export const reportRouter = Router()

/* report a new sighting and add it to the list */
reportRouter.post('/', async (req, res) => {
  res.send("NOT IMPLEMENTED")
})

/* get all of the reports */
reportRouter.get('/', async (req, res) => {
  res.send("NOT IMPLEMENTED")
})

/* pop a report from the list */
reportRouter.patch('/', async (req, res) => {
  res.send("NOT IMPLEMENTED")
})
