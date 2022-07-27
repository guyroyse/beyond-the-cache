import { Router } from 'express'
import { ulid } from 'ulid'

import { redis } from '../redis/index.js'

export const sightingsRouter = Router()

/* get all of the sightings */
sightingsRouter.get('/', async (req, res) => {
  res.send(`"NOT IMPLEMENTED"`)
})

/* get all of the sightings for a state */
sightingsRouter.get('/by-state/:state', async (req, res) => {
  res.send(`"NOT IMPLEMENTED"`)
})

/* get all of the sightings for a class */
sightingsRouter.get('/by-class/:class', async (req, res) => {
  res.send(`"NOT IMPLEMENTED"`)
})

/* get all of the sightings for a state and a class */
sightingsRouter.get('/by-state/:state/and-class/:class', async (req, res) => {
  res.send(`"NOT IMPLEMENTED"`)
})

/* add a new sighting and assign it an ID */
sightingsRouter.post('/', async (req, res) => {
  res.send(`"NOT IMPLEMENTED"`)
})

/* get a specific sighting by ID */
sightingsRouter.get('/:id', async (req, res) => {
  res.send(`"NOT IMPLEMENTED"`)
})

/* create or replace a specific sighting with the provided ID */
sightingsRouter.put('/:id', async (req, res) => {
  res.send(`"NOT IMPLEMENTED"`)
})

/* update a specific sighting by ID with the provided fields */
sightingsRouter.patch('/:id', async (req, res) => {
  res.send(`"NOT IMPLEMENTED"`)
})

/* delete a specific sighting by ID */
sightingsRouter.delete('/:id', async (req, res) => {
  res.send(`"NOT IMPLEMENTED"`)
})
