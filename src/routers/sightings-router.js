import { Router } from 'express'
import { ulid } from 'ulid'

import { redis } from '../redis/index.js'

export const sightingsRouter = Router()

const sightingKey = id => `bigfoot:sighting:${id}`

/* add a new sighting and assign it an ID */
sightingsRouter.post('/', (req, res) => {
  res.send(`"NOT IMPLEMENTED"`)
})

/* get a specific sighting by ID */
sightingsRouter.get('/:id', async (req, res) => {
  res.send(`"NOT IMPLEMENTED"`)
})

/* create or replace a specific sighting with the provided ID */
sightingsRouter.put('/:id', (req, res) => {
  res.send(`"NOT IMPLEMENTED"`)
})

/* delete a specific sighting by ID */
sightingsRouter.delete('/:id', (req, res) => {
  res.send(`"NOT IMPLEMENTED"`)
})

/* get all of the sightings */
sightingsRouter.get('/', async (req, res) => {
  res.send(`"NOT IMPLEMENTED"`)
})

/* get a page of sightings */
sightingsRouter.get('/page/:pageNumber', async (req, res) => {
  res.send(`"NOT IMPLEMENTED"`)
})

/* get all of the sightings for a state */
sightingsRouter.get('/by-state/:state', async (req, res) => {
  res.send(`"NOT IMPLEMENTED"`)
})

/* get all of the sightings for a class */
sightingsRouter.get('/by-class/:clazz', async (req, res) => {
  res.send(`"NOT IMPLEMENTED"`)
})

/* get all of the sightings for a state and a class */
sightingsRouter.get('/by-state/:state/and-class/:clazz', async (req, res) => {
  res.send(`"NOT IMPLEMENTED"`)
})

/* get all of the sightings containing a word */
sightingsRouter.get('/containing/:word', async (req, res) => {
  res.send(`"NOT IMPLEMENTED"`)
})

/* get all of the sightings above a temperature */
sightingsRouter.get('/above-temperature/:temperature', async (req, res) => {
  res.send(`"NOT IMPLEMENTED"`)
})

/* get all of the sightings within so many miles of latlng */
sightingsRouter.get('/within/:radius/miles-of/:longitude,:latitude', async (req, res) => {
  res.send(`"NOT IMPLEMENTED"`)
})
