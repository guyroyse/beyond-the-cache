# Transactions #

Redis implements transactions using optimistic locking. You can [read all about them](https://redis.io/docs/manual/transactions/) on redis.io. The tl;dr is that you can [WATCH](https://redis.io/commands/watch/) keys in Redis on a particular connection and then start a transaction with [MULTI](https://redis.io/commands/multi/). Make you changes and then call [EXEC](https://redis.io/commands/exec/) If any of the WATCHed keys changed, the commands between MULTI and EXEC aren't executed.

Let's see what this looks like from RedisInsight with a successful transaction. Go ahead and try to following commands:

```bash
127.0.0.1:6379> WATCH site:config
OK
127.0.0.1:6379> MULTI
OK
127.0.0.1:6379(TX)> UNLINK site:config
QUEUED
127.0.0.1:6379(TX)> HSET site:config version 1.0.0 name bigfoot-tracker-api
QUEUED
127.0.0.1:6379(TX)> EXEC
1) (integer) 0
2) (integer) 2
127.0.0.1:6379>
```

In this example, we want to remove `site:config` and replace it's values without soemone else changing it out from underneath us. We want to operation to be atomic.

Note that the returned values are the results of each of the queued commands being executes. So, in this example, UNLINK didn't do anything as `site:config` didn't exists—hence the 0 being returns. And HSET set two fields, so a 2 was returned.

Now, this is optimistic locking. We're not locking other clients out of the key we want to change. We're ensuring that is hasn't changed before we make our changes. If it *has* changed, we'll get an error.

Try it out by changing `site:config` after the WATCH but before you call MULTI:

```bash
127.0.0.1:6379> WATCH site:config
OK
127.0.0.1:6379> HSET site:config email guy@guyroyse.com
(integer) 1
127.0.0.1:6379> MULTI
OK
127.0.0.1:6379(TX)> UNLINK site:config
QUEUED
127.0.0.1:6379(TX)> HSET site:config version 2.0.0 name bigfoot-tracker-api-v2
QUEUED
127.0.0.1:6379(TX)> EXEC
(nil)
```

This time it returned `(nil)`, which means that the transaction failed and your queued commands have been discarded. Go ahead and look at the Hash and you'll see that the email is updated but the version and name are still the same:

```bash
127.0.0.1:6379> HGETALL site:config
1) "version"
2) "1.0.0"
3) "name"
4) "bigfoot-tracker-api"
5) "email"
6) "guy@guyroyse.com"
```

We can use this commands in Node Redis as well. But there's an important caveat. In our Bigfoot Tracker API, we are using a single connection for everything. Not a huge deal. JavaScript is single-threads and Node.js is single-threaded. It's actually a pretty nice pairing.

But, for transactions to work, they need to happen on the same connection. And nobody else can be messing around on that connection. So, we'll need a dedicated connection. Node Redis provides a simple way to do this which we're going to explore next.

## Adding Transactions to Bigfoot Sightings ##

Remember this code in **`routers/sightings.js`**?

```javascript
sightingsRouter.put('/:id', (req, res) => {
  const { id } = req.params
  const key = sightingKey(id)

  redis.unlink(key)
  redis.hSet(key, { id, ...req.body })

  res.send({
    status: "OK",
    message: `Sighting ${id} created or replaced.`
  })
})
```

It has a flaw. See it? Someone could sneak in a write to our key after we call `.unlink()` but before we call `.hSet()`. Then, we would have our data overlayed on top of their data instead of just our data. This, is a problem for transactions.

Go ahead an update the code to this:

```javascript
sightingsRouter.put('/:id', async (req, res) => {
  const { id } = req.params
  const key = sightingKey(id)

  try {
    await redis.executeIsolated(async isolatedClient => {
      await isolatedClient.watch(key)
      await isolatedClient
        .multi()
          .unlink(key)
          .hSet(key, { id, ...req.body })
        .exec()
    })

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

Note that the route handler is now `async`. That'd be easy to miss.

We call `.executeIsolated()` and hand it a callback function which is then given a new connection to Redis. With that connection, we call `.watch()` for the keys we want to watch and then we start our transaction, queue our commands, and call `.exec()`. We need to `await` the call to `.exec()` as we need to know if it throws an exception or not.

Node Redis takes the `(nil)` return from a failed transaction and turns it into an exception that you can handle. In our case, we're just going to return the error to the API client, but in a more realistic scenario, you might want to attempt a retry.

----------------------------------------

Okay, transactions done. Next, we're gonna change our application to use [RedisJSON](14-REDISJSON.md) to store our Bigfoot sightings instead of Hashes.
