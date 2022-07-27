import { Router } from 'express'
import { ulid } from 'ulid'

import { redis } from '../redis/index.js'

export const sightingsRouter = Router()

/* get all of the sightings */
sightingsRouter.get('/', async (req, res) => {
  const ids = await redis.sMembers('bigfoot:sightings')
  const keys = ids.map(id => `bigfoot:sighting:${id}`)

  const sightings = await Promise.all(
    keys.map(async key => await redis.hGetAll(key))
  )

  res.send(sightings)
})

/* get all of the sightings for a state */
sightingsRouter.get('/by-state/:state', async (req, res) => {
  const { state } = req.params
  const ids = await redis.sMembers(`bigfoot:sightings:byState:${state}`)
  const keys = ids.map(id => `bigfoot:sighting:${id}`)

  const sightings = await Promise.all(
    keys.map(async key => await redis.hGetAll(key))
  )

  res.send(sightings)
})

/* get all of the sightings for a class */
sightingsRouter.get('/by-class/:class', async (req, res) => {
  res.send("NOT IMPLEMENTED")
})

/* get all of the sightings for a state and a class */
sightingsRouter.get('/by-state/:state/and-class/:class', async (req, res) => {
  res.send("NOT IMPLEMENTED")
})


/* add a new sighting and assign it an ID */
sightingsRouter.post('/', async (req, res) => {
  const id = ulid()
  const { state } = req.body
  const key = `bigfoot:sighting:${id}`

  await redis.hSet(key, { id, ...req.body })
  await redis.sAdd('bigfoot:sightings', id)
  if (req.body.state) await redis.sAdd(`bigfoot:sightings:byState:${state}`, id)

  res.send({ id })
})

/* get a specific sighting by ID */
sightingsRouter.get('/:id', async (req, res) => {
  const { id } = req.params
  const key = `bigfoot:sighting:${id}`

  const sighting = await redis.hGetAll(key)
  res.send(sighting)
})

/* create or replace a specific sighting with the provided ID */
sightingsRouter.put('/:id', async (req, res) => {
  const { id, state } = req.params
  const key = `bigfoot:sighting:${id}`

  const currentState = await redis.hGet(key, 'state')
  await redis.unlink(key)
  await redis.hSet(key, { id, ...req.body })
  await redis.sAdd('bigfoot:sightings', id)
  if (currentState) await redis.sRem(`bigfoot:sightings:byState:${currentState}`, id)
  if (state) await redis.sAdd(`bigfoot:sightings:byState:${state}`, id)

  res.send({
    status: "OK",
    message: `Sighting ${id} put.`
  })
})

/* update a specific sighting by ID with the provided fields */
sightingsRouter.patch('/:id', async (req, res) => {
  const { id, state } = req.params
  const key = `bigfoot:sighting:${id}`

  const currentState = await redis.hGet(key, 'state')
  await redis.hSet(key, req.body)
  await redis.sAdd('bigfoot:sightings', id)
  if (currentState) await redis.sRem(`bigfoot:sightings:byState:${currentState}`, id)
  if (state) await redis.sAdd(`bigfoot:sightings:byState:${state}`, id)

  res.send({
    status: "OK",
    message: `Sighting ${id} patched.`
  })
})

/* delete a specific sighting by ID */
sightingsRouter.delete('/:id', async (req, res) => {
  const { id } = req.params
  const key = `bigfoot:sighting:${id}`

  const currentState = await redis.hGet(key, 'state')
  await redis.unlink(key)
  await redis.sRem('bigfoot:sightings', id)
  if (currentState) await redis.sRem(`bigfoot:sightings:byState:${currentState}`, id)

  res.send({
    status: "OK",
    message: `Sighting ${id} removed.`
  })
})

