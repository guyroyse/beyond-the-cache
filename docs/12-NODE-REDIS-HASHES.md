# Hashes #

Let's get to the meat of the Bigfoot Tracker API and store and retrieve Bigfoot sightings. We'll use Hashes to do this—storing a single sighting in a single Hash using a keyspace of `bigfoot:sighting:`.

We'll be using the Redis commands of [HSET](https://redis.io/commands/hset/), [HGETALL](https://redis.io/commands/hgetall/), [UNLINK](https://redis.io/commands/unlink/), and the ever-abused [KEYS](https://redis.io/commands/keys/) in this section.

Go ahead and open **`routers/sightings.js`** as this is where we'll be making our changes.

## Endpoints ##

Here's the various endpoints for this section. We'll add more endpoints to it in the next section when we talk about RediSearch and RedisJSON:

| Verb   | Path           | Description
|:-------|:---------------|:------------------------------------------------------------
| POST   | /sightings     | Add a new Bigfoot sighting and assign it an ID
| GET    | /sightings/:id | Get an existing Bigfoot sighting for the given ID
| PATCH  | /sightings/:id | Update an existing Bigfoot sighting for the given ID
| PUT    | /sightings/:id | Create or replace a Bigfoot sighting with the given ID
| DELETE | /sightings/:id | Remove a Bigfoot sighting for the given ID
| GET    | /sightings     | Get all of the Bigfoot sighting

## Optimizing `curl` ##

We've been typing in all the data for `curl` for the last view examples, and, frankly, it's kinda tedious. So, in the **`data`** folder, there are a few thousand JSON files containing Bigfoot sightings. We'll tell `curl` to load some of these instead of typing in the data manually for all the examples in this section.

## Adding a New Sighting ##

Add the code to add a new Sighting to the appropriate route:

```javascript
  const id = ulid()
  const key = sightingKey(id)

  redis.hSet(key, { id, ...req.body })

  res.send({ id })
```

Note a couple of small things about this code:

  1. We are generating a unique ID for this sighting using `ulid()`. ULIDs are like UUIDs but a bit nicer. They're available for pretty much any platform you'd care to use. [Check 'em out](https://github.com/ulid/spec) if you interested.

  2. I added a helper function for you to build the key called `sightingKey()`. That code'd be smeared all over the place if I hadn't done that. You're welcome. 😏

Also note this **really important thing**. We are taking the request body and using it as input to `.hSet()`. `.hSet()` happily takes a JavaScript object for the multiple fields you might want to set in a Hash. But Hashes only store Redis Strings. If you pass in a body that has nested objects, arrays, or even just a boolean, this won't work.

We're going to ignore this for now but in production, please sanitize your inputs. And if you want to try and break it and see what happens, feel free. Might be fun!

Now that we have a route to create Bigfoot sightings, let's use it:

```bash
curl \
  -X POST \
  -H "Content-Type: application/json" \
  -d @../data/json/bigfoot-sighting-8086.json \
  localhost:8080/sightings
```

You should get back a JSON response with the ULID for the newly created record:

```json
{
  "id": "01G95AVST5A9Q6ABCK9T9T1ZK7"
}
```

Take a look in Redis at your newly created Hash and make sure it worked. It should be in a key named like this: `bigfoot:sighting:01G95AVST5A9Q6ABCK9T9T1ZK7`.

Note that your ULID will be different.

## Fetch a Sighting ##

Now that we have a sighting in Redis, let's write the code to pull it out:

```javascript
  const { id } = req.params
  const key = sightingKey(id)

  const sighting = await redis.hGetAll(key)

  res.send(sighting)
```

Easy peasy. It just gets all the fields in the Hash. Let's try it out using the ULID for the sighting we just added above:

```bash
curl -X GET localhost:8080/sightings/<your ulid>
```

You should get back all the data that was loaded:

```json
{
  "cloud_cover": "1",
  "location": "-81.40079,39.63382",
  "reportId": "8086",
  "humidity": "0.93",
  "precip_type": "snow",
  "moon_phase": "0.86",
  "dew_point": "31.17",
  "precip_probability": "1",
  "county": "Noble",
  "id": "01G95AVST5A9Q6ABCK9T9T1ZK7",
  "latitude": "39.63382",
  "wind_bearing": "344",
  "precip_intensity": "0.0067",
  "title": "A series of large, human-like footprints are found on a farm near Wayne National Forest",
  "temperature_high": "34",
  "summary": "Light snow (< 1 in.) starting in the afternoon.",
  "uv_index": "1",
  "visibility": "2.62",
  "date": "1958-01-15",
  "timestamp": "-377481600",
  "location_details": "Closest town was Harriettsville. Closest main road is State Route 145. Right on the border of Noble and Washington Counties.",
  "pressure": "1011.09",
  "temperature_mid": "29.995",
  "wind_speed": "10.12",
  "observed": "While during some yard chores, we noticed a series of tracks going into the hollow on our property. Upon examination, we realized these were very large barefoot human like tracks. They were close to 13 inches long and over 6 inches wide at the toes. They were leading into some thickets so we decided not to follow. What impressed us more than anything was the stride between the tracks. The stride was at least 4 1/2 to 5 feet long. Being very familiar with bears, we knew these were not bear tracks because of the enormous size, lack of claws, and human like shape. The game warden came out the next day to view the tracks. He had no idea what could have made the tracks. Especially anything native to Ohio. To this day, we have no clue what could have made those tracks!",
  "longitude": "-81.40079",
  "temperature_low": "25.99",
  "state": "Ohio",
  "classification": "Class B"
}
```

If it doesn't, make sure you are using the correct ULID.

## Update a Sighting by ID ##

Let's add the code to update a sighting:

```javascript
  const { id } = req.params
  const key = sightingKey(id)

  redis.hSet(key, req.body)

  res.send({
    status: "OK",
    message: `Sighting ${id} updated.`
  })
```

Note that this will replace the provided field without removing existing fields. Let's change `state` field to 'West Virginia' and add a field called `comments` and provide some comments:

```bash
curl \
  -X PATCH \
  -H "Content-Type: application/json" \
  -d '{ "state": "West Virginia", "comments": "For sure they said hollow as holler." }' \
  localhost:8080/sightings/<your ulid>
```

You should get back a message stating the sighting was updated. But let's be sure. Trust, but verify:

```bash
curl -X GET localhost:8080/sightings/<your ulid>
```

I see comments and West Virginia. Looks like it worked:

```json
{
  "cloud_cover": "1",
  "comments": "For sure they said hollow as holler.",
  "location": "-81.40079,39.63382",
  "reportId": "8086",
  "humidity": "0.93",
  "precip_type": "snow",
  "moon_phase": "0.86",
  "dew_point": "31.17",
  "precip_probability": "1",
  "county": "Noble",
  "id": "01G95AVST5A9Q6ABCK9T9T1ZK7",
  "latitude": "39.63382",
  "wind_bearing": "344",
  "precip_intensity": "0.0067",
  "title": "A series of large, human-like footprints are found on a farm near Wayne National Forest",
  "temperature_high": "34",
  "summary": "Light snow (< 1 in.) starting in the afternoon.",
  "uv_index": "1",
  "visibility": "2.62",
  "date": "1958-01-15",
  "timestamp": "-377481600",
  "location_details": "Closest town was Harriettsville. Closest main road is State Route 145. Right on the border of Noble and Washington Counties.",
  "pressure": "1011.09",
  "temperature_mid": "29.995",
  "wind_speed": "10.12",
  "observed": "While during some yard chores, we noticed a series of tracks going into the hollow on our property. Upon examination, we realized these were very large barefoot human like tracks. They were close to 13 inches long and over 6 inches wide at the toes. They were leading into some thickets so we decided not to follow. What impressed us more than anything was the stride between the tracks. The stride was at least 4 1/2 to 5 feet long. Being very familiar with bears, we knew these were not bear tracks because of the enormous size, lack of claws, and human like shape. The game warden came out the next day to view the tracks. He had no idea what could have made the tracks. Especially anything native to Ohio. To this day, we have no clue what could have made those tracks!",
  "longitude": "-81.40079",
  "temperature_low": "25.99",
  "state": "West Virginia",
  "classification": "Class B"
}
```

## Replace a Sighting ##

Let's keep going and *replace* an existing sighting instead of just updating it. Add the following code:

```javascript
  const { id } = req.params
  const key = sightingKey(id)

  redis.unlink(key)
  redis.hSet(key, { id, ...req.body })

  res.send({
    status: "OK",
    message: `Sighting ${id} created or replaced.`
  })
```

Note that we are calling `.unlink()` before we call `.hSet()`. If we were to only call `.hSet()`, any field that was on the sighting we are replacing that *aren't* on the sighting we're replacing it with, like say a comments field, would still be in the new object. So, we need to delete what is there first.

Let's try it out and replace the sighting at the old ULID with a different Bigfoot sighting:

```bash
curl \
  -X PUT \
  -H "Content-Type: application/json" \
  -d @../data/json/bigfoot-sighting-1024.json \
  localhost:8080/sightings/<your ulid>
```

You'll get a message saying this worked. Let's confirm it with another read of the data:

```bash
curl -X GET localhost:8080/sightings/<your ulid>
```

And we see that it did work. The state's now Kentucky and the comments are gone:

```json
{
  "cloud_cover": "0.01",
  "location": "-84.92358,37.3181",
  "reportId": "1024",
  "humidity": "0.51",
  "moon_phase": "0.8",
  "dew_point": "51.43",
  "precip_probability": "0",
  "county": "Casey",
  "id": "01G95AVST5A9Q6ABCK9T9T1ZK7",
  "latitude": "37.3181",
  "wind_bearing": "48",
  "precip_intensity": "0",
  "title": "An account of bigfoot tool use",
  "temperature_high": "87.66",
  "summary": "Clear throughout the day.",
  "uv_index": "5",
  "visibility": "9.32",
  "date": "1953-10-01",
  "timestamp": "-512870400",
  "location_details": "",
  "pressure": "1022.67",
  "temperature_mid": "73.115",
  "wind_speed": "7.25",
  "observed": "When I was young,six years old, Ronnie Joe a friend of mine and myself was playing behind Ronnie's house.  We heard a thumbing sound and moved closer to see what was making the sound.  Just behind a neighbor's house we saw a big foot digging in the ground with a stick of fire wood, at times taking one stick of fire wood and pounding a second stick into the ground. Then he would turn the dirt over, using the stick like a spade. He may have been looking for food, but we never knew for sure. Then the bigfoot stood up and walked our way.  We were only 25ft. to 30ft. from the animal. It was showing its teeth but didn't make a sound.  This was a open field, bright sunshine lit day, nothing between us and the animal, so we got a good look but not a very long look at bigfoot. The animal had a dark brown coat with a lighter, almost grey vest.  He had large teeth and long \"dirty\" finger and toe nails. The nails looked very thick.",
  "longitude": "-84.92358",
  "temperature_low": "58.57",
  "state": "Kentucky",
  "classification": "Class A"
}
```

## Remove a Sighting ##

Well, we've done everything else. I guess it's time to delete. Add the code to delete a sighting:

```javascript
  const { id } = req.params
  const key = sightingKey(id)

  redis.unlink(key)

  res.send({
    status: "OK",
    message: `Sighting ${id} removed.`
  })
```

Invoke it:

```bash
curl -X DELETE localhost:8080/sightings/<your ulid>
```

And validate that it is gone:

```bash
curl -X GET localhost:8080/sightings/<your ulid>
```

And it is:

```json
{}
```

## Get All the Sightings ##

So, it would be nice if we could get *all* of the sightings. We can do this using the KEYS command in Redis. Node Redis exposes this as `.keys()`. The `.keys()` function takes a string as an argument and returns the names of all of the keys in Redis that match that pattern.

It's worth noting that **using KEYS is an antipattern**. Yes. I'm showing you the wrong way to do things. It's the wrong way because Redis is single-threaded and KEYS blocks that single thread while is scans *all* of the keys in Redis. Not a big deal if you have a few thousand Bigfoot sightings and some supporting keys. A *huge* deal if you have millions keys.

In following sections I'll show you a much better way to do this using RediSearch. But this bad way of doing things is easy, and so it's common. And so I thought I'd show it to you.

So, add some bad code:

```javascript
  const keys = await redis.keys('bigfoot:sighting:*')
  const sightings = await Promise.all(
    keys.map(key => redis.hGetAll(key))
  )
  res.send(sightings)
```

This code probably bears some explaining. Here goes:

- Get all the keys in Redis that match the keyspace pattern we used for our Bigfoot sightings using `.keys()`.
- Use `.map()` on those keys to call `.hGetAll()` for each key.
- Since `.hGetAll()` is `async`, this returns an array of `Promise`s.
- Use `Promise.all()` to `await` all those promise and get an array of JavaScript objects.
- Return that array.

Make sense? Well, you can use it anyway, even if it doesn't!

Before we can try this out in a meaningful way, we should probably have more than one sighting in our database. So let's add a few more:

```bash
curl \
  -X POST \
  -H "Content-Type: application/json" \
  -d @../data/json/bigfoot-sighting-8086.json \
  localhost:8080/sightings

curl \
  -X POST \
  -H "Content-Type: application/json" \
  -d @../data/json/bigfoot-sighting-43211.json \
  localhost:8080/sightings

curl \
  -X POST \
  -H "Content-Type: application/json" \
  -d @../data/json/bigfoot-sighting-26695.json \
  localhost:8080/sightings
```

You don't have to use the ones I am. Feel free to pick your own.

Let's get 'em all:

```bash
curl -X GET localhost:8080/sightings
```

And you should get a whole mess of sightings back in a nice tidy array.

----------------------------------------

Now we have what is, more or less, a complete API. But you might notice a a few unimplemented things. And you might be worried about that call to `.keys()`. But there's another flaw that you might not have noticed around [transactions](13-TRANSACTIONS.md) that we're gonna tackle first.
