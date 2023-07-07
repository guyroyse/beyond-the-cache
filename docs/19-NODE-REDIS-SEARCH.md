# Implementing RediSearch #

Now that we know our way around RediSearch fairly well, we can update our Bigfoot Tracking API to use it. You've probably already got some good ideas on how this might work.

We'll be using the RediSearch commands of [FT.CREATE](https://redis.io/commands/ft.create/) and [FT.SEARCH](https://redis.io/commands/ft.search/) in this section.

Go ahead and open **`redis/client.js`** and `routers/sightings.js`** as these are where we'll be making our changes.

## Endpoints

Here's the additional endpoints we're adding or modifying for this section:

| Verb | Path                                        | Description
|:-----|:--------------------------------------------|:------------------------------------------------------------
| GET  | /sightings                                  | Get all of the Bigfoot sighting
| GET  | /sightings/page/:page                       | Get a page of all the Bigfoot sighting
| GET  | /sightings/by-state/:state                  | Get all the Bigfoot sightings for a state
| GET  | /sightings/by-class/:clazz                  | Get all the Bigfoot sightings for a class
| GET  | /sightings/by-state/:state/and-class/:clazz | Get all the Bigfoot sightings for a state and a class

## Creating Our Index ##

We need to create an index for RediSearch to be able to... well... search. We'll do this in **`redis/client.js`**.

First things first, we need a name for our index. And, we'll need to use that name in **`routers/sighting.js`** when we call `.ft.search()`. So, let's assign it and export it. I did this after the call to `redis.connect()` but it really doesn't matter where you put it:

```javascript
export const sightingsIndex = `bigfoot:sighting:index`
```

Next, we need to create our index with a call to `.ft.create()`. This is a rather weighty call but you should recognize all the arguments from your earlier calls to FT.SEARCH. Just past it at the bottom of **`redis/client.js`**:

```javascript
await redis.ft.create(sightingsIndex, {
  '$.title': { type: SchemaFieldTypes.TEXT, AS: 'title' },
  '$.observed': { type: SchemaFieldTypes.TEXT, AS: 'observed' },
  '$.state': { type: SchemaFieldTypes.TAG, AS: 'state' },
  '$.classification': { type: SchemaFieldTypes.TAG, AS: 'classification' },
  '$.temperature_mid': { type: SchemaFieldTypes.NUMERIC, AS: 'temperature_mid' },
  '$.location': { type: SchemaFieldTypes.GEO, AS: 'location' },
}, {
  ON: 'JSON', PREFIX: 'bigfoot:sighting:'
})
```

This will create the index every time to application is loaded. However, if we try to create the index more than once, we'll get an error. Odds are, you have an index already defined from the previous section. So, you'll see this error right away. So, go ahead and drop that index from RedisInsight:

```bash
127.0.0.1:6379> FT.DROPINDEX bigfoot:sighting:index
OK
```

Now reload the API. It should create an index. Confirm that via RedisInsight:

```bash
127.0.0.1:6379> FT._LIST
1) "bigfoot:sighting:index"
```

However, if you stop and start yet again, you'll get the error again. So, we need to catch the error. Surround the above code in a `try...catch` block like below:

```javascript
try {
  await redis.ft.create(sightingsIndex, {
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

Now it should start reliably. Go ahead and delete the index again, restart, and make sure there aren't any mistakes in your code. You should see this:

```bash
[nodemon] 2.0.19
[nodemon] to restart at any time, enter `rs`
[nodemon] watching path(s): *.*
[nodemon] watching extensions: js,mjs,json
[nodemon] starting `node --inspect ./server.js`
Debugger listening on ws://127.0.0.1:9229/11292fd8-93a4-4e40-b3b0-017895c36ba0
For help, see: https://nodejs.org/en/docs/inspector
Index created.
👣 Bigfoot Tracker API ready at http://localhost:8080. 👣
```

Note the message stating the index was created. Stop and start it again.

```bash
[nodemon] 2.0.19
[nodemon] to restart at any time, enter `rs`
[nodemon] watching path(s): *.*
[nodemon] watching extensions: js,mjs,json
[nodemon] starting `node --inspect ./server.js`
Debugger listening on ws://127.0.0.1:9229/bd530e79-5669-4028-b31e-871119c66f95
For help, see: https://nodejs.org/en/docs/inspector
Index exists already, skipped creation.
👣 Bigfoot Tracker API ready at http://localhost:8080. 👣
```

See that it skipped creation. If you want to change the index as some point, say to add another field, be sure to delete it and then allow the code to recreate it.

## Getting Rid of the Call to `.keys()` ##

Ok. Finally, we can replace that call to `.keys()` with some sweet, sweet RediSearch. At the top of **`routers/sightings.js`**, import the `sightingsIndex` that we just exported:

```javascript
import { redis, sightingsIndex } from '../redis/index.js'
```

Now, remove all the code that's calling `.keys()` and call `.ft.search() instead`:

```javascript
sightingsRouter.get('/', async (req, res) => {
  const results = await redis.ft.search(sightingsIndex, '*', { LIMIT: { from: 0, size: 5000 } })
  const sightings = results.documents.map(document => document.value)
  res.send(sightings)
})
```

Note that we have hard-coded a size of 5,000. We happen to know that we have 4,586 Bigfoot sightings so this *will* return everything. Not the best practice, but a good place to start, A *better* implementation would be to provide a pagination mechanism as part of the API.

Also note that we have to do a bit of transformation of the results that `.ft.search()` yields. We just want an array of JSON objects. But Node Redis returns the following information:

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

A lot of this is quite useful, but not for what we're doing right here. It has the count of the search result in the `total` property followed by an array of results in the `documents` property. Each item in the `documents` array has an `id` which contains the key in Redis for that document and a `value` which is the actual contents of the JSON document.

We only care about the `value` properties, so we `.map()` over the `documents` and return the `value`.

Let's try it out and see if it works:

```bash
curl -X GET http://localhost:8080/sightings
```

You should get a whole mess of Bigfoot sightings back:

```json
[
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
  ...
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
  }
]
```

## Adding Pagination ##

Returning everything isn't really the best. So, let's add a paginating route:

```javascript
  const page = Number(req.params.pageNumber)
  const size = 20
  const from = (page - 1) * size

  const results = await redis.ft.search(sightingsIndex, '*', { LIMIT: { from, size } })
  const sightings = results.documents.map(document => document.value)

  res.send(sightings)
```

We compute the starting point based on the page number and the page size. And that's pretty much it. It's one-based so if you hand it zero or a negative number, it'll error. But if you hand in too large of a number, you'll just get an empty array back.

Let's try it out:

```bash
curl -X GET localhost:8080/sightings/page/1
```

You should get back the first twenty sightings:

```json
[
  {
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
  },
  ...
    {
    "id": "01G9QB4Q03MZV2AD02MXF3GKZH",
    "reportId": "25238",
    "title": "Woman recalls encountering a creature while driving through Talladega National Forest",
    "date": "1999-11-23",
    "timestamp": 943315200,
    "observed": "",
    "classification": "Class A",
    "county": "Talladega",
    "state": "Alabama",
    "latitude": 33.36305,
    "longitude": -86.17122,
    "location": "-86.17122,33.36305",
    "location_details": "all i know is that i was driving down hwy 21 when i came upon a sign that said 20 mph a sharp turn was ahead and i had my daughter in the front seat {she is grown} and my grandaughter in the back seat,so i went very careful around the turn.",
    "temperature_high": 72.43,
    "temperature_mid": 63.03,
    "temperature_low": 53.63,
    "dew_point": 56.1,
    "humidity": 0.86,
    "cloud_cover": 0.44,
    "moon_phase": 0.52,
    "precip_intensity": 0,
    "precip_probability": 0,
    "pressure": 1020.66,
    "summary": "Mostly cloudy until afternoon.",
    "uv_index": 2,
    "visibility": 6.98,
    "wind_bearing": 82,
    "wind_speed": 3.37
  }
]
```

Try getting more pages. Read a few of the sightings. They're often quite entertaining. When you're bored of that, try getting a page of sightings well outside the range of our total sightings:

```bash
curl -X GET localhost:8080/sightings/page/250
```

You will be rewarded with a nice, empty array:

```json
[]
```

## Adding State and Class Searches ##

Let's search on some actual fields. We'll just do some TAG fields—specifically `state` and `classification`.

Now, since we are using TAG fields, there is a need to escape any spaces if they occur in the value. We *know* that both `state` and `classification` can have spaces in them—"West Virginia" and "Class A" being obvious examples. So, let's add a function to the top of **`routers/sightings.js`** that will escape them for us:

```javascript
const escapeTag = tag => tag.replaceAll(' ', '\\ ')
```

Simple little fellow that just replaces all spaces with `\ `. Note that the `\` needs escaped itself, so we have a double-backslash here.

Now, let's add the route for searching by `state`. We'll limit search to just the first 20 matches:

```javascript
  const { state } = req.params
  const query = `@state:{${escapeTag(state)}}`

  const results = await redis.ft.search(sightingsIndex, query, { LIMIT: { from: 0, size: 20 } })
  const sightings = results.documents.map(document => document.value)

  res.send(sightings)
```

And let's try it out:

```bash
curl -X GET localhost:8080/sightings/by-state/Ohio
```

You should get 20 responses back.

Try searching for a state that probably doesn't have any sightings, like Hawaii:

```bash
curl -X GET localhost:8080/sightings/by-state/Hawaii
```

Turns out that Bigfoot doesn't vacation there.

Let's try something with a space in it. To do that, replace the space in the URL with `%20`:

```bash
curl -X GET localhost:8080/sightings/by-state/West%20Virginia
```

Works like a champ. Let's add the one for `classification` next:

```javascript
  const { clazz } = req.params
  const query = `@classification:{${escapeTag(clazz)}}`

  const results = await redis.ft.search(sightingsIndex, query, { LIMIT: { from: 0, size: 20 } })
  const sightings = results.documents.map(document => document.value)

  res.send(sightings)
```

And try it out:

```bash
curl -X GET localhost:8080/sightings/by-class/Class%20A
```

Note that there are three classes of Bigfoot sightings:

- **Class A**: I saw Bigfoot.
- **Class B**: I found evidence of Bigfoot.
- **Class C**: Somebody told me they saw Bigfoot.

Class C is my favorite.

And let's combine these together and add the route to find Bigfoot sightings of a particular class in a particular state:

```javascript
  const { state, clazz } = req.params
  const query = `@state:{${escapeTag(state)}} @classification:{${escapeTag(clazz)}}`

  const results = await redis.ft.search(sightingsIndex, query, { LIMIT: { from: 0, size: 20 } })
  const sightings = results.documents.map(document => document.value)

  res.send(sightings)
```

Note that I spelled `class` as `clazz` as `class` is a reserved word.

Go ahead and try it out:

```bash
curl -X GET localhost:8080/sightings/by-state/Ohio/and-class/Class%20A
```

## Getting Creative ##

You can pretty clearly see how we could add all sorts of interesting queries using RediSearch. Play around with some of your own. Modify the index to add some new fields to search on. Add some routes to find Bigfoot sightings that contain a particular keyword. Or sightings that occurr using a particular temperature range. Or sightings near a particular location. Go crazy!

----------------------------------------

Now that you've used RediSearch in lots of ways, it's time to check out some other things you can do with Redis, starting with [Redis Streams](20-REDIS-STREAMS.md).

