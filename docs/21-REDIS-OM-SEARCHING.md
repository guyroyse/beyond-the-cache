# Searching with Redis OM #

Searching is where Redis OM really begins to shine. It offers an intuitive interface that's much easier to understand than the queries that RediSearch requires. It lets you replace stuff like this:

```javascript
  const results = await redis.ft.search(sightingsIndex, '@title:creek -@state:{Hawaii} @temperature_mid[75 +inf]')
  const sightings = results.documents.map(document => document.value)
```

With stuff like this:

```javascript
const sightings = await sightingsRepository.search()
  .where('title').matches('creek')
  .and('state').does.not.equal('Hawaii')
  .and('temperature_mid').is.gte(75)
    .return.all()
```

Ya, it's longer. But look how *readable* it is!


### All the Things ###

```javascript
sightingsRouter.get('/', async (req, res) => {
  const results = await redis.ft.search(sightingsIndex, '*', { LIMIT: { from: 0, size: 5000 } })
  const sightings = results.documents.map(document => document.value)
  res.send(sightings)
})

/* get all of the sightings */
sightingsRouter.get('/', async (req, res) => {
  const sightings = await sightingsRepository.search().return.all()
  res.send(sightings)
})
```


### Pagination ###

```javascript

  const page = Number(req.params.pageNumber)
  const size = 20
  const from = (page - 1) * size

  const results = await redis.ft.search(sightingsIndex, '*', { LIMIT: { from, size } })
  const sightings = results.documents.map(document => document.value)

  res.send(sightings)

/* get a page of sightings */
sightingsRouter.get('/page/:pageNumber', async (req, res) => {
  const page = Number(req.params.pageNumber)
  const size = 20
  const from = (page - 1) * size

  const sightings = await sightingsRepository.search().return.page(from, size)

  res.send(sightings)
})
```


### Searching ##


```javascript
const escapeTag = tag => tag.replaceAll(' ', '\\ ')
```

```javascript
  const { state } = req.params
  const query = `@state:{${escapeTag(state)}}`

  const results = await redis.ft.search(sightingsIndex, query, { LIMIT: { from: 0, size: 20 } })
  const sightings = results.documents.map(document => document.value)

  res.send(sightings)
```
```javascript
  const { clazz } = req.params
  const query = `@classification:{${escapeTag(clazz)}}`

  const results = await redis.ft.search(sightingsIndex, query, { LIMIT: { from: 0, size: 20 } })
  const sightings = results.documents.map(document => document.value)

  res.send(sightings)
```

```javascript
  const { state, clazz } = req.params
  const query = `@state:{${escapeTag(state)}} @classification:{${escapeTag(clazz)}}`

  const results = await redis.ft.search(sightingsIndex, query, { LIMIT: { from: 0, size: 20 } })
  const sightings = results.documents.map(document => document.value)

  res.send(sightings)
```

```javascript
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
```


### Searching on Text ###

```javascript
```


### Searching on Numbers ###

```javascript
/* get all of the sightings above a temperature */
sightingsRouter.get('/above-temperature/:temperature', async (req, res) => {
  const temperature = Number(req.params.temperature)

  const sightings = await sightingsRepository.search()
    .where('temperature_mid').is.greaterThanOrEqualTo(temperature)
      .return.all()

  res.send(sightings)
})
```


### Searching on Points ###

```javascript
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
```


## Refactoring ##

Remove this code:

```javascript
const sightingKey = id => `bigfoot:sighting:${id}`
```
