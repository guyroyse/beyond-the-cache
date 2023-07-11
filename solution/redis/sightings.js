import { Schema, Repository } from 'redis-om'

import { redis } from './client.js'

const sightingsSchema = new Schema('bigfoot:sighting', {
  'title': { type: 'text' },
  'observed': { type: 'text' },
  'state': { type: 'string' },
  'classification': { type: 'string' },
  'timestamp': { type: 'date' },
  'temperature_low': { type: 'number', path: '$.temperature.low' },
  'temperature_mid': { type: 'number', path: '$.temperature.mid' },
  'temperature_high': { type: 'number', path: '$.temperature.high' },
  'location': { type: 'point' },
})

export const sightingsRepository = new Repository(sightingsSchema, redis)

await sightingsRepository.createIndex()
