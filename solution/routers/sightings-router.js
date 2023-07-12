import { Router } from 'express'
import { EntityId } from 'redis-om'

import { sightingsRepository } from '../redis/index.js'

export const sightingsRouter = Router()

/* add a new sighting and assign it an ID */
sightingsRouter.post('/', async (req, res) => {
  const sighting = await sightingsRepository.save(req.body)
  const id = sighting[EntityId]
  res.send({ id })
})

/* get a specific sighting by ID */
sightingsRouter.get('/:id', async (req, res) => {
  const { id } = req.params
  const sighting = await sightingsRepository.fetch(id)
  res.send(sighting)
})

/* create or replace a specific sighting with the provided ID */
sightingsRouter.put('/:id', async (req, res) => {
  const { id } = req.params
  await sightingsRepository.save(id, req.body)

  res.send({
    status: "OK",
    message: `Sighting ${id} created or replaced.`
  })
})

/* delete a specific sighting by ID */
sightingsRouter.delete('/:id', async (req, res) => {
  const { id } = req.params
  await sightingsRepository.remove(id)

  res.send({
    status: "OK",
    message: `Sighting ${id} removed.`
  })
})

/* get all of the sightings */
sightingsRouter.get('/', async (req, res) => {
  const sightings = await sightingsRepository.search().return.all({ pageSize: 500 })
  res.send(sightings)
})

/* get a page of sightings */
sightingsRouter.get('/page/:pageNumber', async (req, res) => {
  const page = Number(req.params.pageNumber)
  const size = 20
  const from = (page - 1) * size

  const sightings = await sightingsRepository.search().return.page(from, size)

  res.send(sightings)
})

/* get all of the sightings for a state */
sightingsRouter.get('/by-state/:state', async (req, res) => {
  const { state } = req.params

  const sightings = await sightingsRepository.search()
    .where('state').equals(state)
      .return.all()

      res.send(sightings)
})

/* get all of the sightings for a class */
sightingsRouter.get('/by-class/:clazz', async (req, res) => {
  const { clazz } = req.params

  const sightings = await sightingsRepository.search()
    .where('classification').equals(clazz)
      .return.all()

  res.send(sightings)
})

/* get all of the sightings for a state and a class */
sightingsRouter.get('/by-state/:state/and-class/:clazz', async (req, res) => {
  const { state, clazz } = req.params

  const sightings = await sightingsRepository.search()
    .where('state').equals(state)
    .and('classification').equals(clazz)
      .return.all()

  res.send(sightings)
})

/* get all of the sightings containing a word */
sightingsRouter.get('/containing/:word', async (req, res) => {
  const word = req.params.word

  const sightings = await sightingsRepository.search()
    .where('title').matches(word)
    .or('observed').matches(word)
      .return.all()

  res.send(sightings)
})

/* get all of the sightings above a temperature */
sightingsRouter.get('/above-temperature/:temperature', async (req, res) => {
  const temperature = Number(req.params.temperature)

  const sightings = await sightingsRepository.search()
    .where('temperature_mid').is.gte(temperature)
      .return.all()

  res.send(sightings)
})

/* get all of the sightings within so many miles of latlng */
sightingsRouter.get('/within/:radius/miles-of/:longitude,:latitude', async (req, res) => {
  const radiusInMiles = Number(req.params.radius)
  const longitude = Number(req.params.longitude)
  const latitude = Number(req.params.latitude)

  const sightings = await sightingsRepository.search()
    .where('location').inRadius(circle => circle.origin(longitude, latitude).radius(radiusInMiles).miles)
      .return.all()

  res.send(sightings)
})
