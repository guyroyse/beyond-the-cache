import { Router } from 'express'

import { redis } from '../redis/index.js'

export const motdRouter = Router()

/* get the message of the day */
motdRouter.get('/', async (req, res) => {
  res.send(`"NOT IMPLEMENTED"`)
})

/* set the message of the day */
motdRouter.put('/', (req, res) => {
  res.send(`"NOT IMPLEMENTED"`)
})

/* clear the message of the day */
motdRouter.delete('/', (req, res) => {
  res.send(`"NOT IMPLEMENTED"`)
})
