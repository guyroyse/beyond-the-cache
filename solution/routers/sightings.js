import { Router } from 'express'
import { ulid } from 'ulid'

import { redis, sightingIndex } from '../redis/index.js'

export const sightingsRouter = Router()

const sightingKey = id => `bigfoot:sighting:${id}`
const escapeTag = tag => tag.replaceAll(' ', '\\ ')

/* add a new sighting and assign it an ID */
sightingsRouter.post('/', (req, res) => {
  const id = ulid()
  const key = sightingKey(id)

  redis.json.set(key, '$', { id, ...req.body })

  res.send({ id })
})

/* get a specific sighting by ID */
sightingsRouter.get('/:id', async (req, res) => {
  const { id } = req.params
  const key = sightingKey(id)

  const sighting = await redis.json.get(key)

  res.send(sighting)
})

/* update a specific sighting by ID with the provided fields */
sightingsRouter.patch('/:id', async (req, res) => {
  const { id } = req.params
  const key = sightingKey(id)

  try {
    await redis.executeIsolated(async isolatedClient => {
      await isolatedClient.watch(key)

      const multi = isolatedClient.multi()

      Object.entries(req.body).forEach(([prop, value]) => {
        multi.json.set(key, `$.${prop}`, value)
      })

      await multi.exec()
    })

    res.send({
      status: "OK",
      message: `Sighting ${id} update.`
    })
  } catch (err) {
    if (err instanceof WatchError) {
      res.send({
        status: "ERROR",
        message: `Sighting ${id} was not updated.`
      })
    }
  }
})

/* create or replace a specific sighting with the provided ID */
sightingsRouter.put('/:id', async (req, res) => {
  const { id } = req.params
  const key = sightingKey(id)

  redis.json.set(key, '$', { id, ...req.body })

  res.send({
    status: "OK",
    message: `Sighting ${id} created or replaced.`
  })
})

/* delete a specific sighting by ID */
sightingsRouter.delete('/:id', (req, res) => {
  const { id } = req.params
  const key = sightingKey(id)

  redis.json.del(key)

  res.send({
    status: "OK",
    message: `Sighting ${id} removed.`
  })
})

/* get all of the sightings */
sightingsRouter.get('/', async (req, res) => {
  const results = await redis.ft.search(sightingIndex, '*', { LIMIT: { from: 0, size: 5000 } })
  const sightings = results.documents.map(document => document.value)
  res.send(sightings)
})

/* get a page of sightings */
sightingsRouter.get('/page/:pageNumber', async (req, res) => {
  const page = Number(req.params.pageNumber)
  const size = 20
  const from = (page - 1) * size

  const results = await redis.ft.search(sightingIndex, '*', { LIMIT: { from, size } })
  const sightings = results.documents.map(document => document.value)

  res.send(sightings)
})

/* get all of the sightings for a state */
sightingsRouter.get('/by-state/:state', async (req, res) => {
  const { state } = req.params
  const query = `@state:{${escapeTag(state)}}`

  const results = await redis.ft.search(sightingIndex, query, { LIMIT: { from: 0, size: 20 } })
  const sightings = results.documents.map(document => document.value)

  res.send(sightings)
})

/* get all of the sightings for a class */
sightingsRouter.get('/by-class/:clazz', async (req, res) => {
  const { clazz } = req.params
  const query = `@classification:{${escapeTag(clazz)}}`

  const results = await redis.ft.search(sightingIndex, query, { LIMIT: { from: 0, size: 20 } })
  const sightings = results.documents.map(document => document.value)

  res.send(sightings)
})

/* get all of the sightings for a state and a class */
sightingsRouter.get('/by-state/:state/and-class/:clazz', async (req, res) => {
  const { state, clazz } = req.params
  const query = `@state:{${escapeTag(state)}} @classification:{${escapeTag(clazz)}}`

  const results = await redis.ft.search(sightingIndex, query, { LIMIT: { from: 0, size: 20 } })
  const sightings = results.documents.map(document => document.value)

  res.send(sightings)
})
