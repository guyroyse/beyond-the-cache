import { redis } from './client.js'

export const sightingsIndex = `bigfoot:sighting:index`

try {
  await redis.ft.create(sightingsIndex, {
    '$.title': { type: 'TEXT', AS: 'title' },
    '$.observed': { type: 'TEXT', AS: 'observed' },
    '$.state': { type: 'TAG', AS: 'state' },
    '$.classification': { type: 'TAG', AS: 'classification' },
    '$.temperature_low': { type: 'NUMERIC', AS: 'temperature_low' },
    '$.temperature_mid': { type: 'NUMERIC', AS: 'temperature_mid' },
    '$.temperature_high': { type: 'NUMERIC', AS: 'temperature_high' },
    '$.location': { type: 'GEO', AS: 'location' },
  }, {
    ON: 'JSON', PREFIX: 'bigfoot:sighting:'
  })
  console.log('Index created.')
} catch (e) {
  if (e.message === 'Index already exists') {
    console.log('Index exists already, skipped creation.')
  } else {
    throw e
  }
}
