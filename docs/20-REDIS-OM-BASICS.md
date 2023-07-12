# Redis OM #

Redis OM (pronounced REDiss OHM) is object mapping for Redis. Hence the OM part. It makes using RediSearch and RedisJSON easy and fluent by providing a layer of abstraction around CRUD operations, searching, and the creation of indices. I'm going to explain a bit about how it works and then you're going to replace a lot of your [Node Redis](https://github.com/redis/redis-om-node) code with [Redis OM](https://github.com/redis/node-redis) code.

Let's get started.


## Installing Redis OM ##

Redis OM is, shockingly, installed from `npm` just like any other Node package. I've already included it in the **`package.json`** so you don't need to do nuttin'. However, if you *did* need to install it, this is how:

```bash
npm install redis-om
```

Shocking, I know.


## Schemas and Repositories ##

There are two main class that you work with when using Redis OM: `Schema` and `Repository`. Details below.


### Schema ###

A `Schema` is used to define how data in your JSON documents is indexed and converted from friendly JavaScript types like `Boolean`, `Date`, or `String` to something that RedisJSON and RediSearch can deal with. Not everything needs to be in the `Schema`. Just what you want indexed and converted. If you don't specify a particular part of your JSON document in the Schema, Redis OM will do it's best to figure out how to convert the types.

So, for example, if you tell a `Schema` that a particular value is a `date`, when you pass a `Date`, it will be converted to a `number` in your JSON in Redis. And when you read it back out, that `number` will be converted back into a `Date`. However, if you do *not* tell a `Schema` that a value is a `Date`, it will convert it on the way in but will *not* convert it back on the way out, since it doesn't know.

So, that's what a `Schema` does. Let's go ahead and define *our* `Schema` for our Bigfoot sightings. We'll do that in **`redis/sightings.js`**.

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

A `Schema` has two required arguments in its constructor. First, you need a name for the `Schema`. This is used to prefix  the keyname for all the JSON documents that you'll be creating. It's also used to prefix the index name. This means we won't need the `sightingsIndex` value anymore. So go ahead and remove that.

The second argument is the bulk of the call. It is a JavaScript object defining the indexed fields, their types, and where to find them in the JSON. The name of each property is the name of the field and is used when you search. The `path` is where it is found in the JSON. If the path is missing, it is assumed to be in the root of the document with a name matching the field name. In the example above, this means that the `title` field has a infered path of `$.title`.

The `type` is required and tells you what sort of data is in the field. This let's Redis OM index it correctly and to convert it to and from Redis correctly. Valid types include `boolean`, `date`, `number`, `point`, `string`, `string[]`, and `text`.

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

Of particular note is the difference between `text` and `string`. These map to TEXT and TAG respectively. As you hopefully remember, TEXT fields are used for human-readable text. TAG fields are for things like IDs. Folks get this wrong *all* the time so be sure to use the right one for the right job.

In our example, we'll be using all of these except `boolean` and `string[]` as our sample data doesn't have fields of those types. Don't worry, if you need them you'll figure them out. You're smart like that.


### Repository ###

A `Repository` is the main point of interaction with Redis OM. It has functions to create the index for it's associated `Schema` as well as methods to read, write, and remove JSON objects in Redis. And, it exposes a fluent search interface.

Creating a `Repository` is simple—just instantiate it and give it a `Schema` and a Node Redis connection to work with. They're also cheap, so you can make as many or a few as you'd like and throw them away when you're done. However, I like to create just one and use it everywhere. We're gonna create ours in the same place as our `Schema`—in **`redis/sightings.js`**.

But before we do that, we need to import the `Repository`:

```javascript
import { Repository, Schema } from 'redis-om'
```

Now, go ahead and add the following code after the `Schema`:

```javascript
export const sightingsRepository = new Repository(sightingsSchema, redis)
```

We simply new one up, passing in the two required arguments. Simple is as simple does.

Now that we have a `Repository`,  we need to create our index. Add a call to `.createIndex()` in **`redis/sightings.js`** at the end of the file:

```javascript
await sightingsRepository.createIndex()
```

You might remeber the old code for creating an index was a bit annoying. If the index already existed, it would throw an error. We had to catch that error, check it, and ignore it if it was the right error. And, if you changed the index, you had to remove the old one and recreate it.

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

This writes the JSON to Redis, generating a ULID to save it under. It also returns the newly created object that is now enriched with that generated ULID—calling it the `EntityId`. This `EntityId` is stored in a property as a [symbol](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol) so accessing it is a bit special.

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


#### Updating Your Code ####

Armed with this knowledge, let's update our POST and PUT routes to use to use `.save()`.

First, of course, you need to import `EntityId`:

```javascript
import { EntityId } from 'redis-om'
```

Then you can update your POST to create a new Bigfoot sighting by calling `.save()` and return the ID using `EntityId`:

```javascript
  const sighting = await sightingsRepository.save(req.body)
  const id = sighting[EntityId]
```

And, change the PUT to update an existing Bigfoot sighting by also calling `.save()`, but this time with the ID:

```javascript
  await sightingsRepository.save(id, req.body)
```


### Fetching Objects ###

The read objects from Redis OM, you use the `.fetch()` function. It's pretty simple, really. You just call `.fetch()` and pass in the ID or IDs you want to retreive.

However, you actually have a bit of choice here. You can pass in a single ID, multiple IDs, or an *array* of ID. If you pass in a single ID, you get a single object back. If you pass in multiple, you get an array. Like this:

```javascript
const aSingleSighting = await sightingsRepository.fetch("46805")
const manySightings = await sightingsRepository.fetch("46805", "52031", "55573")
const alsoManySightings = await sightingsRepository.fetch([ "46805", "52031", "55573" ])
```

In our API, we only need to return a single Bigfoot sighting so updating is pretty easy. Just replace the call to `json.set()` with a call to `.fetch()`:

```javascript
  const sighting = await sightingsRepository.fetch(id)
```


### Removing Objects ###

Removing objects with Redis OM is done with the `.remove()` function. It's the more destructive sibling of `.fetch()` and works exactly the same with the IDs and that variadicity and all that. But `.remove()`, unsurprisingly, deletes stuff.

Updating our code is equally easy, however. It's always easier to destroy than create:

```javascript
  await sightingsRepository.remove(id)
```


### We're Not Dead Yet ###

So we're not done and our code probably doesn't work yet—don't worry, we'll fix that in the next section—but you might have noticed that you have some dead code. The `sightingKey` function isn't needed anymore and you probably have bits of it grayed out in your IDE. If not, it's still most certainly dead code as Redis OM is now building all the key name internally.

So, if it ain't needed, it shall be be remove. Go ahead and remove any trace of `sightingKey` from **`redis/sightings.js`**.

----------------------------------------

Now that you've used Redis OM for writing, reading, and removing, it's time to check out how to check out the [fluent *search*](21-REDIS-OM-SEARCHING.md) that Redis OM offers.
