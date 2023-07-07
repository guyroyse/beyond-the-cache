import { Router } from 'express'

import { redis } from '../redis/index.js'

export const motdRouter = Router()

const motdKey = 'bigfoot:motd'

/* get the message of the day */
motdRouter.get('/', async (req, res) => {
  const motd = await redis.get(motdKey)
  res.send({ motd })
})

/* set the message of the day */
motdRouter.put('/', (req, res) => {
  const { motd, expireIn } = req.body
  if (expireIn ?? 0 > 0) {
    redis.setEx('bigfoot:motd', expireIn, motd)
  } else {
    redis.set('bigfoot:motd', motd)
  }
  res.send({
    status: "OK",
    message: `MOTD set to: ${motd}`,
    expireIn
  })
})

/* clear the message of the day */
motdRouter.delete('/', (req, res) => {
  redis.unlink('bigfoot:motd')
  res.send({
    status: "OK",
    message: `MOTD removed.`
  })
})
