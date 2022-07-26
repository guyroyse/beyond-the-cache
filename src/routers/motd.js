import { Router } from 'express'

import { redis } from '../redis/index.js'

export const motdRouter = Router()

motdRouter.get('/', async (req, res) => {
  const motd = await redis.get('bigfoot:motd')
  res.send({ motd })
})

motdRouter.put('/', async (req, res) => {
  const { motd, expireIn } = req.body
  if (expireIn ?? 0 > 0) {
    await redis.setEx('bigfoot:motd', expireIn, motd)
  } else {
    await redis.set('bigfoot:motd', motd)
  }
  res.send({
    status: "OK",
    message: `MOTD set to ${motd} for ${expireIn} seconds.`
  })
})

motdRouter.delete('/', async (req, res) => {
  await redis.unlink('bigfoot:motd')
  res.send({
    status: "OK",
    message: `MOTD removed.`
  })
})
