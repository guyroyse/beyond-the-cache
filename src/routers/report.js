import { Router } from 'express'

import { redis } from '../redis/index.js'

export const reportRouter = Router()

const reportKey = 'bigfoot:sightings:reported'

/* report a new report and add it to the list */
reportRouter.post('/', (req, res) => {
  res.send(`"NOT IMPLEMENTED"`)
})

/* get all of the reports */
reportRouter.get('/', async (req, res) => {
  res.send(`"NOT IMPLEMENTED"`)
})

/* pop a report from the list */
reportRouter.patch('/', async (req, res) => {
  res.send(`"NOT IMPLEMENTED"`)
})
