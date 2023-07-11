# Redis OM #

Redis OM (pronounced REDiss OHM) is object mapping for Redis. Hence the OM part. It makes using RediSearch and RedisJSON easy and fluent by providing a layer of abstraction around CRUD operations, searching, and the creation of indices. I'm  going to explain a bit about how it works and then you're going to replace a lot of your Node Redis code with Redis OM code.

Let's get started.


## Installing Redis OM ##

[Redis OM](https://github.com/redis/redis-om-node) is, shockingly, installed from `npm` just like any other Node package. I've already included it in the **`package.json`** so you don't need to do nuttin'. However, if you *did* need to install it, this is how you would do it:

```bash
npm install redis-om
```


## Schemas and Repositories ##

There are two main class you work with when using Redis OM: `Schema` and `Repository`.


### Schema ###

A `Schema` is used to define how data in your JSON documents is indexed and converted from friendly JavaScript types like booleans, dates, or strings to something that RedisJSON and RediSearch can deal with. Not everything needs to be in the `Schema`. Just what you want indexed and converted. If you don't specify a particular part of your JSON document in the Schema, Redis OM will do it's best to convert types.

So, for example, if you tell a `Schema` that a particular value is a date, when you pass that data in, it will be converted to a number in your JSON in Redis. And when you read it back out, that number will be converted back into a date. However, if you do *not* tell a `Schema` that a value is a date, it will convert it on the way in but will *not* convert it back on the way out, since it doesn't know.

Let's go ahead and define our `Schema` for our Bigfoot sightings. We'll do that in **`redis/sightings.js`**.

First we need to import the `Schema` class:

```javascript
import { Schema } from 'redis-om'
```

Then we need to replace the call to `ft.create` with an instantiation of `Schema`.

```javascript
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
```

A `Schema` has two required arguments in its constructor. First, you need a name for the `Schema`. This is used to prefix  the keyname in Redis for all the JSON documents that you'll be creating. It's also used to prefix the index name. This means we won't need the `sightingsIndex` value anymore. So go ahead and remove that.

The second argument is the bulk of the call. It is a JavaScript object defining the indexed fields, their types, and where to find them in the JSON. The name of each property is the name of the field and is used when you search. The `path` is where it is found in the JSON. If the path is missing, it is assumed to be in the root of the document with a name matching the field name. In the example above, this means that the `title` field has a infered path of `$.title`.

The `type` is required and tells you what sort of data is in the field. This let's Redis OM index it correctly and to convert it to and from Redis. Valid types include `boolean`, `date`, `number`, `point`, `string`, `string[]`, and `text`.

Behind the scenes these values map to RediSearch index types and JSON like this:

| type     | Index Type | How It's Stored                                   | Example
|:---------|:-----------|:--------------------------------------------------|:-----------------------------------
| boolean  | TAG        | As a boolean                                      | `{ "foo": true } `
| date     | NUMERIC    | As a number containing the UNIX Epoch time        | `{ "foo": 12345.67 }`
| number   | NUMERIC    | As a number                                       | `{ "foo": 1234 }`
| point    | GEO        | As a string containing the longitude and latitude | `{ "foo": "12.34.56.78" }`
| string   | TAG        | As a string                                       | `{ "foo": "bar" }`
| string[] | TAG        | As an array of strings                            | `{ "foo": [ "bar", "baz", "qux]}`
| text     | TEXT       | As a string                                       | `{ "foo": "bar" }`

Of particular note is the difference between `text` and `string`. These map to TEXT and TAG respectively. As you will remember, TEXT fields are used for human-readable text. TAG fields are for things like IDs. Folks get this wrong *all* the time so be sure to use the right one.

In our example, we'll be using all of these except `boolean` and `string[]` as our sample data doesn't have fields of those types. Don't worry, if you need them you'll figure them out. You're smart like that.


### Repository ###

A `Repository` is the main point of interaction with Redis OM. It has functions to create the index for it's associated `Schema` as well as methods to read, write, and remove JSON objects in Redis. And, it exposes a fluent search interface. Creating a `Repository` is simple—just instantiate it and give it a `Schema` and a Node Redis connection to work with.

A `Repository` is cheap and easy to create so you can make as many or a few as you like and throw them away. But, I like to create just one and use it everywhere. We're gonna create ours in the same place as our `Schema`—in **`redis/sightings.js`**.

But before we do that, we need to import the `Repository`:

```javascript
import { Schema } from 'redis-om'
```

Now, go ahead and add the following code after the `Schema`:

```javascript
export const sightingsRepository = new Repository(sightingsSchema, redis)
```

We simply call new and pass in the two required arguments. Simple is as simple does.

The `Repository` exposes lots of functions but for now, we need to do one more thing—create out index. Add a call to `.createIndex()` in **`redis/sightings.js`** at the end of the file:

```javascript
await sightingsRepository.createIndex()
```

You might remeber the old code for creating an index was a bit annoying. If the index already existed, it would throw an error. We had to catch that error, check it, and ignore it if it was the write error. And, if you changed the index, you had to remove the old one and recreate it.

Well, Redis OM has got your back. It will do all of that for you. And, it will automatically detect if the index has changed. If it has, it will remove and recreate it. So all you need to do is call `.createIndex()`.


## Reading, Writing, and Removing ##

Now that we have a `Repository`, we need to read from and write to it. There are three functions that are the workhorses for this sort of CRUD work. They are:

- *`.save()`*: Both saves and updates a single object to Redis.
- *`.fetch()`*: Reads one of more objects from Redis.
- *`.remove()`*: Removes one or more objects from Redis.

Let's look at `.save()` first.


### Saving Objects ###

Unsurprisingly, the `.save()` function saves an object to Redis. It works like this:

```javascript
const sighting = await sightingsRepository.save({ reportId: "46805", county: "Jefferson", state: "Colorado", })
```

This writes the JSON to Redis, generating a ULID to save it under. It also returns the newly created object that is now enriched with that generated ULID—calling it the `EntityId``. This `EntityId` is stored in a property as a [symbol](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol) so accessing it is a bit special.

To do so, you'll need to import this symbol from Redis OM and use it to access the ID:

```javascript
import { EntityId } from 'redis-om'

const sighting = await sightingsRepository.save({ reportId: "46805", county: "Jefferson", state: "Colorado", })
const id = sighting[EntityId]
```

Conveniently, if an object already *has* an `EntityId`, calls to `.save()` will not generate one. Intead, they'll update the existing object in Redis:

```javascript
import { EntityId } from 'redis-om'

const sighting = await sightingsRepository.save({ reportId: "46805", county: "Jefferson", state: "Colorado", })
sighting.title: "Hikers are startled by unusual sounds in Staunton State Park"

await sightingsRepository.save(sighting)
```

If you don't like a generated `EntityId`, you can always provide your own by passing it into the call to save:

```javascript
const sighting = await sightingsRepository.save("46805", { reportId: "46805", county: "Jefferson", state: "Colorado", })
const id = sighting[EntityId] // '46805'
```

This works with updating as well.

Armed with this knowledge, let's update our POST and PUT routes to use to use `.save()`. First things first, let's import `EntityId`:

```javascript
import { EntityId } from 'redis-om'
```

Then, update our POST to create a new Bigfoot sighting:

```javascript
  const sighting = await sightingsRepository.save(req.body)
  const id = sighting[EntityId]
```

And change our PUT to update an existing one:

```javascript
  await sightingsRepository.save(id, req.body)
```


### Fetching Objects ###

```javascript
  /* get a specific sighting by ID */
  sightingsRouter.get('/:id', async (req, res) => {
    const { id } = req.params
    const sighting = await sightingsRepository.fetch(id)
    res.send(sighting)
  })
```


### Removing Objects ###

```javascript
/* delete a specific sighting by ID */
sightingsRouter.delete('/:id', async (req, res) => {
  const { id } = req.params
  await sightingsRepository.remove(id)

  res.send({
    status: "OK",
    message: `Sighting ${id} removed.`
  })
})
```


## Searching ##


### All the Things ###

```javascript
/* get all of the sightings */
sightingsRouter.get('/', async (req, res) => {
  const sightings = await sightingsRepository.search().return.all()
  res.send(sightings)
})
```


### Pagination ###

```javascript
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
