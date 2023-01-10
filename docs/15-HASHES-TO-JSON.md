# Converting from Hashes to RedisJSON #

For the most part, this is pretty straight forward. We'll be replacing calls to `.hSet()` and `.hGetAll()` with calls to `.json.set()` and `.json.get()`. Before we do this, however, clean out your database as any exisitng Hashes won't work with the code we're going to change:

```bash
127.0.0.1:6379> FLUSHALL
OK
```

Go ahead and open **`routers/sightings.js`** as this is where we'll be making our changes. Find any code in there that calls `.hSet()`. Like this line here:

```javascript
  redis.hSet(key, { id, ...req.body })
```

Replace it with code that calls `.json.set()`:

```javascript
  redis.json.set(key, '$', { id, ...req.body })
```

As you can see, `.json.set()` take three arguments: the key, the path within the JSON document that we want to set, and a JavaScript object that is to be the contents at that path. In our case, we want to set the root of our document to the passed in JavaScript object so we specify `$` as our path.

Next, find any code that calls `.hGetAll()`:

```javascript
  const sighting = await redis.hGetAll(key)
```

Replace it with code that calls `.json.get()`:

```javascript
  const sighting = await redis.json.get(key)
```

We're not specifying the path of `$` here as it's the default. But if we wanted to, we would include it as part of the call options. Like this:

```javascript
  const sighting = await redis.json.get(key, { path: '$' })
```

We could even provide multiple paths if we were so inclined:

```javascript
  const sighting = await redis.json.get(key, { path: [ '$.state', '$.county' ] })
```

That's most of the code, but let's go ahead and change `.unlink()` to `.json.del()`. It's not strictly necessary, as deleting the root of a JSON document in Redis does the same thing as just UNLINKing a key. But let's be complete and find the calls to `.unlink()`:

```javascript
  redis.unlink(key)
```

And replace them with this:

```javascript
  redis.json.del(key)
```

This should work, but, there's some flaws in our code.

## Removing the Transaction ##

Take a look at this code that handles the PUT:

```javascript
sightingsRouter.put('/:id', async (req, res) => {
  const { id } = req.params
  const key = sightingKey(id)

  try {
    await redis.watch(key)
    await redis
      .multi()
        .unlink(key)
        .json.set(key, '$', { id, ...req.body })
      .exec()

    res.send({
      status: "OK",
      message: `Sighting ${id} created or replaced.`
    })
  } catch (err) {
    if (err instanceof WatchError) {
      res.send({
        status: "ERROR",
        message: `Sighting ${id} was not created or replaced.`
      })
    }
  }
})
```

If `.json.set()` replaces the entire document, is the call to `.unlink()` needed? If it's not, is the transaction needed?

The answer to this leading question is no. So, let's clean this up a bit and remove the transaction. When you're done, you code should look like this:

```javascript
sightingsRouter.put('/:id', async (req, res) => {
  const { id } = req.params
  const key = sightingKey(id)

  redis.json.set(key, '$', { id, ...req.body })

  res.send({
    status: "OK",
    message: `Sighting ${id} created or replaced.`
  })
})
```

Much tidier.

## Fixing Update ##

Unfortunately, we have also broken some code. Broken in the it-still-works-but-not-in-the-way-we-wanted way. Take a look at what we have wrought:

```javascript
sightingsRouter.patch('/:id', async (req, res) => {
  const { id } = req.params
  const key = sightingKey(id)

  redis.json.set(key, '$', req.body)

  res.send({
    status: "OK",
    message: `Sighting ${id} updated.`
  })
})
```

If we use this to update an existing property or to add a new property to the document, it will replace the entire document with just our new and updated properties while removing all the other properties. Probably not what we want.

This is actually a somewhat hard problem if we have a complex document with lots of heirarchy and nesting. But, we have a flat JSON document so we can solve it pretty easily. We just need to loop over the properties sent in and call `.json.set()` on each one.

Easy enough. Take a look at this code:

```javascript
  const { id } = req.params
  const key = sightingKey(id)

  Object.entries(req.body).forEach(([prop, value]) => {
    redis.json.set(key, `$.${prop}`, value)
  })

  res.send({
    status: "OK",
    message: `Sighting ${id} updated.`
  })
```

Here, we are iterating over each incoming property change, and using `.json.set()` to set that exact property by build a JSONPath *to* that property. Not so bad.

But, we've just introduced a new problem. Our change is no longer atomic. Which means transactions. So, we need to take all that code we just removed and move it here. I won't make you type it again. Here's the completed route handler:

```javascript
sightingsRouter.patch('/:id', async (req, res) => {
  const { id } = req.params
  const key = sightingKey(id)

  try {
    await redis.watch(key)

    const multi = redis.multi()

    Object.entries(req.body).forEach(([prop, value]) => {
      multi.json.set(key, `$.${prop}`, value)
    })

    await multi.exec()

    res.send({
      status: "OK",
      message: `Sighting ${id} update.`
    })
  } catch (err) {
    if (err instanceof WatchError) {
      res.send({
        status: "ERROR",
        message: `Sighting ${id} was not updated.`
      })
    }
  }
})
```

Note that unlike in the previous transaction, we're actually assigning the call to `.multi()` to a constant and then using it in a loop. Later, when the loop is finished, we can call `.exec()` to run the queued commands.


## Testing the Changes ##

So that was a lot of changes without a lot of testing. Let's fix that. We had several `curl` commands back when we where writing all this code to work with Hashes. Run them again and see if they work. As you run them, look in RedisInsight and see what they change:

### Add a Bigfoot Sighting ###

```bash
curl \
  -X POST \
  -H "Content-Type: application/json" \
  -d @../data/json/bigfoot-sighting-8086.json \
  localhost:8080/sightings
```

### Get a Bigfoot Sighting ###

```bash
curl -X GET localhost:8080/sightings/<your ulid>
```

### Update Properties on a Bigfoot Sighting ###

```bash
curl \
  -X PATCH \
  -H "Content-Type: application/json" \
  -d '{ "state": "West Virginia", "comments": "For sure they said hollow as holler." }' \
  localhost:8080/sightings/<your ulid>
```

### Replace a Bigfoot Sighting ###

```bash
curl \
  -X PUT \
  -H "Content-Type: application/json" \
  -d @../data/json/bigfoot-sighting-1024.json \
  localhost:8080/sightings/<your ulid>
```

### Remove a Bigfoot Sighting ###

```bash
curl -X DELETE localhost:8080/sightings/<your ulid>
```

----------------------------------------

Assuming that is now all working, we can take a look at [RediSearch](16-REDISEARCH-BASICS.md) and finally get rid of that call the `.keys()` that is bugging us. And implement the rest of our routes in **`routers/sightings.js`**.
