## Endpoints ##

Here's the various endpoints for this section. We'll add more endpoints to it in the next section when we talk about RediSearch and RediJSON:

| Verb   | Path           | Description
|:-------|:---------------|:------------------------------------------------------------
| POST   | /sightings     | Add a new Bigfoot sighting and assign it an ID
| GET    | /sightings/:id | Get an existing Bigfoot sighting for the given ID
| PATCH  | /sightings/:id | Update an existing Bigfoot sighting for the given ID
| PUT    | /sightings/:id | Create or replace a Bigfoot sighting with the given ID
| DELETE | /sightings/:id | Remove a Bigfoot sighting for the given ID
| GET    | /sightings     | Get all of the Bigfoot sighting



Open **`redis/client.js`**

First things first, export the index name as we'll need it in **`routers/sightings.js`** when we call `.ft.search()`:

```javascript
export const sightingIndex = `bigfoot:sighting:index`
```

Next, create our index with a call to `.ft.create()`. This is a rather weighty call but you should recognize all the arguments from your earlier calls to FT.SEARCH:

```javascript
try {
  await redis.ft.create(sightingIndex, {
    '$.title': { type: SchemaFieldTypes.TEXT, AS: 'title' },
    '$.observed': { type: SchemaFieldTypes.TEXT, AS: 'observed' },
    '$.state': { type: SchemaFieldTypes.TAG, AS: 'state' },
    '$.classification': { type: SchemaFieldTypes.TAG, AS: 'classification' },
    '$.temperature_mid': { type: SchemaFieldTypes.NUMERIC, AS: 'temperature_mid' },
    '$.location': { type: SchemaFieldTypes.GEO, AS: 'location' },
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
```

Open **`routers/sightings.js`**. At the top, import the `sightingIndex` that we just exported:

```javascript
import { redis, sightingIndex } from '../redis/index.js'
```

Let's finally get rid of that call to `.keys()`:

```javascript
  const results = await redis.ft.search(sightingIndex, '*', { LIMIT: { from: 0, size: 5000 } })
  const sightings = results.documents.map(document => document.value)
  res.send(sightings)
```

Note that we have hard-coded a size of 5,000. This will return everything as we know that we have 4,586 Bigfoot sightings. A *better* implementation would be to provide a pagination mechanism as part of the API.

```json
{
  "total": 4586,
  "documents": [
    {
      "id": "bigfoot:sighting:01G9QB5B90CJ6YSZKAGMZCEN52",
      "value": {
        "id": "01G9QB5B90CJ6YSZKAGMZCEN52",
        "reportId": "44350",
        "title": "",
        "date": "",
        "observed": "",
        "classification": "Class B",
        "county": "Jefferson",
        "state": "Pennsylvania",
        "location_details": "On the night before that I believe the tracks were made, it was heavy snow pack, and there was very lite flurries and a little blowing, over night, with temp somewhere I think -5. The morning when I seen the tracks it was about 7, I believe/remember from TV News.",
        "summary": ""
      }
    },
    {
      "id": "bigfoot:sighting:01G9QB54F80PT9WDCVS6JVWQ4M",
      "value": {
        "id": "01G9QB54F80PT9WDCVS6JVWQ4M",
        "reportId": "3629",
        "title": "",
        "date": "",
        "observed": "",
        "classification": "Class A",
        "county": "Cassia",
        "state": "Idaho",
        "location_details": "i can take you to the spot that i saw it. it was off the road a ways and the road are just dirt and logging roads. it was walking up a revien when i smelled it",
        "summary": ""
      }
    },
    {
      "id": "bigfoot:sighting:01G9QB4J9XS0E3GH3HV7Z7RRN5",
      "value": {
        "id": "01G9QB4J9XS0E3GH3HV7Z7RRN5",
        "reportId": "22852",
        "title": "",
        "date": "",
        "observed": "",
        "classification": "Class B",
        "county": "White",
        "state": "Georgia",
        "location_details": "[Exact location omitted] on the Appalachian trail",
        "summary": ""
      }
    },
    {
      "id": "bigfoot:sighting:01G9QB4T8CV95RN91CQCKJ3HC6",
      "value": {
        "id": "01G9QB4T8CV95RN91CQCKJ3HC6",
        "reportId": "27167",
        "title": "",
        "date": "",
        "observed": "",
        "classification": "Class A",
        "county": "Marshall",
        "state": "Mississippi",
        "location_details": "",
        "summary": ""
      }
    },
    {
      "id": "bigfoot:sighting:01G9QB561MR73JX412YGJAKCWZ",
      "value": {
        "id": "01G9QB561MR73JX412YGJAKCWZ",
        "reportId": "38165",
        "title": "",
        "date": "",
        "observed": "STILL GOING ON - HEARING AND SMELLING AND SEEING THE SHADOW RUN TO THE WOODS.  I BELIEVE ITS A FEMALE WITH CHILD.  STEALS FRUIT AND GARBAGE.",
        "classification": "Class B",
        "county": "Lee",
        "state": "Florida",
        "location_details": "PROPERTY NEAR MAN-MADE LAKE. RIVER PRESERVE, HEAVY WOODED AREA, AND DEER FARM.",
        "summary": ""
      }
    }
  ]
}
```

Let's add a route to do that:

```javascript
  const page = Number(req.params.pageNumber)
  const size = 20
  const from = (page - 1) * size

  const results = await redis.ft.search(sightingIndex, '*', { LIMIT: { from, size } })
  const sightings = results.documents.map(document => document.value)

  res.send(sightings)
```


Adding state and class searches:

Add this function at the top. Since state and class are both TAGs and they both potentialially have spaces in them (Class A, West Verginia) we'll need to escape them:

```javascript
const escapeTag = tag => tag.replaceAll(' ', '\\ ')
```

Get the first 20 sightings for a state:

```javascript
  const { state } = req.params
  const query = `@state:{${escapeTag(state)}}`

  const results = await redis.ft.search(sightingIndex, query, { LIMIT: { from: 0, size: 20 } })
  const sightings = results.documents.map(document => document.value)

  res.send(sightings)
```

Get the first 20 sightings for a class:

```javascript
  const { clazz } = req.params
  const query = `@classification:{${escapeTag(clazz)}}`

  const results = await redis.ft.search(sightingIndex, query, { LIMIT: { from: 0, size: 20 } })
  const sightings = results.documents.map(document => document.value)

  res.send(sightings)
```

Get the first 20 sightins for a state and class:

```javascript
  const { state, clazz } = req.params
  const query = `@state:{${escapeTag(state)}} @classification:{${escapeTag(clazz)}}`

  const results = await redis.ft.search(sightingIndex, query, { LIMIT: { from: 0, size: 20 } })
  const sightings = results.documents.map(document => document.value)

  res.send(sightings)
```

## Getting Creative ##

You can pretty clearly see how we could add all sorts of interesting queries using RediSearch. Play around with some of your own. Add some routes to find Bigfoot sightings that contain a particular keyword. Or sightings that occurr suring a particular temperature range. Or sightings near a particular location.
