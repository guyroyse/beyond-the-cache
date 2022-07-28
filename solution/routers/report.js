import { Router } from 'express'

import { redis } from '../redis/index.js'

export const reportRouter = Router()

const reportKey = 'bigfoot:sightings:reported'

/* report a new report and add it to the list */
reportRouter.post('/', (req, res) => {
  const { report } = req.body
  redis.rPush(reportKey, report)
  res.send({
    status: "OK",
    message: `Report accepted.`
  })
})

/* get all of the reports */
reportRouter.get('/', async (req, res) => {
  const reports = await redis.lRange(reportKey, 0, -1)
  res.send(reports)
})

/* pop a report */
reportRouter.patch('/', async (req, res) => {
  const report = await redis.lPop(reportKey)
  res.send({ report })
})
