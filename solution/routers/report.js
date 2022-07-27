import { Router } from 'express'

import { redis } from '../redis/index.js'

export const reportRouter = Router()

/* report a new sighting and add it to the list */
reportRouter.post('/', async (req, res) => {
  console.log(req.body)
  const report = req.body
  const key = 'bigfoot:sightings:reported'

  await redis.rPush(key, report)

  res.send({
    status: "OK",
    message: `Report accepted.`
  })
})

/* get all of the reports */
reportRouter.get('/', async (req, res) => {
  const key = 'bigfoot:sightings:reported'
  const reports = await redis.lRange(key, 0, -1)
  res.send(reports)
})

/* pop a report */
reportRouter.patch('/', async (req, res) => {
  const key = 'bigfoot:sightings:reported'
  const report = await redis.lPop(key)
  res.send(`"${report}"`)
})
