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

Redis OM's search capabilities is fairly extensive and I shan't cover it *all* here. If you want to see all the ways you can use it, check out the [Searching](https://github.com/redis/redis-om-node/tree/main#searching) section of the main README for Redis OM.

But for now, let's dive into some of the bits we need for replacing our calls to `ft.search`.


## Starting A Search ##

To start a search, you call `.search()` on a `Repository` and receive a `Search` object. Like this:

```javascript
sightingsRepository.search()
```

You can then daisy chain calls on this to add filters and to return things. For example, to return all the Bigfoot sightings that happened in Ohio and Kentucky, you could do this:

```javascript
const sightings = await sightingsRepository.search()
  .where('state').equals('Ohio')
  .or('state').equals('Kentucky')
    .return.all()
```

If you just want to return everything, you can skip the filter:

```javascript
const sightings = await sightingsRepository.search().return.all()
```

You can also assign the `Search` to a variable and call it without the daisy chaining. This is useful if the specific fields you want to filter on have some logic to them:

```javascript
const search = sightingsRepository.search()
search.where('state').equals('Ohio')
if (includeTemp) search.and('temperature_mid').is.gte(75)

const sightings = await search.return.all()
```

Note that the `.all()` function is `async` as this is where actually calls to Redis start happening. The rest of the code is really a query builder.

Anyhow, that's some basics of searching with Redis OM. Let's apply it to our API and dive into some more details as needed.


## Searching All the Things ##

Right now we have a route in **`routers/sightings-router.js`** that returns all of the Bigfoot sightings. It should look something like this:

```javascript
sightingsRouter.get('/', async (req, res) => {
  const results = await redis.ft.search(sightingsIndex, '*', { LIMIT: { from: 0, size: 5000 } })
  const sightings = results.documents.map(document => document.value)
  res.send(sightings)
})
```

Let's simplify it with Redis OM. Based on what you read above, you should be able to figure this out. Go ahead and try. If you get stuck, know that you need to replace to first two lines with a single line of Redis OM.

Also, you'll need to import the `sightingsRepository`.

```javascript
import { sightingsRepository } from '../redis/index.js'
```

I'm guessing that you came up with the following:

```javascript
  const sightings = await sightingsRepository.search().return.all()
```

That's not wrong but we can make it better. See, there's potentially a slight performance issue with calls to `return.all()`. `return.all()` can result in multiple calls to Redis, in our case, a lot. The reason—it grabs data in pages of 10 objects each. So, to return all 4,586 Bigfoot sightings, it has to make 459 round trips (I think my math is correct there) to Redis. Or at least issue 459 commands to Redis.

This is fine for more typical queries that return a few results, but when you're querying *everything*, not so much. How can we fix this? Well, you can pass in a `pageSize` when you call `return.all()`.

Now it might be tempting, knowing that we have 4,586 Bigfoot sightings, to use a page size of 5,000 and return them all at once. But this can result in *another* kind of performance issue—blocking Redis with a long-running call. Remember `.keys()`? Redis is single-threaded. And if anything, like say, I don't know, a long-running query, has Redis busy, it can't serve other clients.

So, we'll split the difference and use a page size of 500. Here's how you do it:

```javascript
  const sightings = await sightingsRepository.search().return.all({ pageSize: 500 })
```


## Pagination ##

Of course, sometimes we just want a single page of data. Redis OM has you there as well. Instead of calling `.return.all()`, you can call `.return.page()`. This works just like setting a LIMIT does with RediSearch and Node Redis. Go ahead an update your page route to use Redis OM:

```javascript
  const sightings = await sightingsRepository.search().return.page(from, size)
```

This call will result in a single round trip to Redis. If you have a frontend that needs to page through lots of data, this is a useful way to do that.


## Actual Searching #

Next we have some actual searching. Your routes that fetch by state, classification, and both need updated. You've probably figured out how to do this already. So go ahead and do it.

I'll show you the code for this in just a moment, but note that you'll get to delete some more code too. This time it's the call to and definition of `escapeTag`. Redis OM will escape everything for so we don't need it.

Here's the code for searching by state:

```javascript
  const sightings = await sightingsRepository.search()
    .where('state').equals(state)
      .return.all()
```

Here it is for classification:

```javascript
  const sightings = await sightingsRepository.search()
    .where('classification').equals(clazz)
      .return.all()
```

And here it is for both:

```javascript
  const sightings = await sightingsRepository.search()
    .where('state').equals(state)
    .and('classification').equals(clazz)
      .return.all()
```


## Actual Testing ##

So, we've finally got all of our code converted. Go back to some [previous](15-HASHES-TO-JSON.md) [docs](19-NODE-REDIS-SEARCH.md) and try some of the tests. You'll note a couple of things:

- Fields that are `points` are now expressed as a discrete longitude and latitude. That's nice!
- Timestamp comes back as a ISO-8601 date string.
- If you try to add one of the JSON docs from the **`data/json`** folder, you'll crash the server. Use the **`data\om`** folder instead.

On the last one, you should do it, see what the error is, and see if you can figure out why this error occurs. And for that matter, why did the data I loaded before work?

Now, on to some of the unimplemented stuff.


### Searching on Text ###

Let's add a route that finds Bigfoot sightings that contain a particular word in the title or the observed field.

The most important thing to know about these fields is that they are `text` fields. The are *not* `string` fields. They are optimized for full-text search with stemming and stop words and all that. So, we can't just call `.equals` on them—instead we need to call `.match` or `.matches`.

Add the following code to the route to implement full-text search on our Bigfoot API:

```javascript
sightingsRouter.get('/containing/:word', async (req, res) => {
  const word = req.params.word

  const sightings = await sightingsRepository.search()
    .where('title').matches(word)
    .or('observed').matches(word)
      .return.all()

  res.send(sightings)
})
```

Go ahead and give it a try:

```bash
curl -X GET localhost:8080/sightings/containing/creek
```

You should get back all the Bigfoot sightings containing the word creek. There's a lot of them. Let's narrow it down a little bit:

```bash
curl -X GET localhost:8080/sightings/containing/walmart
```

Note that you can also wildcard the words you want to search for. Let's find words that start with `wal*`:

```bash
curl -X GET "localhost:8080/sightings/containing/wal*"
```

That returns a lot more.

Note the quotes. The shell needs them to deal with the `*`.


## Searching on Numbers ##

Numbers are pretty easy to search on. We'll do a greater than or equal to search for temperatures ast or above a particular temperature:

```javascript
sightingsRouter.get('/above-temperature/:temperature', async (req, res) => {
  const temperature = Number(req.params.temperature)
  const sightings = await sightingsRepository.search()
    .where('temperature_mid').is.gte(temperature)
      .return.all()

  res.send(sightings)
})
```

Note that we are using the field name that we defined in the `Schema` here to search and not it's location within the JSON document. We're searching on `$.temperature.mid` but we search on the name the `Schema` knows it by.

Let's try it out:

```bash
curl -X GET localhost:8080/sightings/above-temperature/95
```

```json
[]
```

Hmmm... guess Bigfoot likes it cooler.

```bash
curl -X GET localhost:8080/sightings/above-temperature/85
```

Much better.


## Searching on Points ##

Ok. We're almost done. Last route to implement. Searching on points. The syntax is a little weird here as we want to find every point within a circle on the Earth. So, we have to define the origin of that circle (i.e. the center) and it's radius.

I'm just gonna show you the code as it's realtively self-explanitory:

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

Bits of note in this code. The origin must be *longitude* and then latitude. You can also specify them separately so that the order doesn't matter:

```javascript
circle.latitude(latitude).longitude(longitude)
```

We're looking at a radius in *miles* but you can also use other units:

```javascript
circle.latitude(latitude).longitude(longitude).radius(50).miles
circle.latitude(latitude).longitude(longitude).radius(50).feet
circle.latitude(latitude).longitude(longitude).radius(50).kilometers
circle.latitude(latitude).longitude(longitude).radius(50).meters
```

Anyhow, go ahead and add the above code, change it if you like, and test it out:

```bash
curl -X GET localhost:8080/sightings/within/50/miles-of/-84.5125,39.1
```

And you'll be rewarded with all of the Bigfoot sightings within 50 miles of Cincinnati!

----------------------------------------

And that's it. We're all done. Go home. I'm gonna take a nap.
