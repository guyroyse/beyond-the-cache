# Transactions #

Redis implements transactions using optimistic locking. You can [read all about them](https://redis.io/docs/manual/transactions/) on redis.io. The tl;dr is that you can [WATCH](https://redis.io/commands/watch/) keys in Redis on a particular connection and then start a transaction with [MULTI](https://redis.io/commands/multi/). Then, make your changes and call [EXEC](https://redis.io/commands/exec/). If any of the WATCHed keys changed, the commands between MULTI and EXEC aren't executed.

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
```

In this example, we want to remove `site:config` and replace its values without someone else changing it out from underneath us. We want the operation to be atomic.

Note that the returned values are the results of each of the queued commands being executed. So, in this example, UNLINK didn't do anything as `site:config` didn't exists—hence the 0 being returns. And HSET set two fields, so a 2 was returned.

Now, this is optimistic locking. We're not locking other clients out of the key we want to change. We're ensuring that it hasn't changed before we make our changes. If it *has* changed, we'll get an error.

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

In our particular case, the use of WATCH works but is overkill. Since we're only manipulating a single key, we don't really need to WATCH it at all. After all, if someone changes the key before we call EXEC, we'll overwrite those changes. But if they wrote them the millisecond before we called WATCH the same things would happen. So, the WATCH is superfluous and we can get away with just using MULTI and EXEC.

```bash
127.0.0.1:6379> MULTI
OK
127.0.0.1:6379(TX)> UNLINK site:config
QUEUED
127.0.0.1:6379(TX)> HSET site:config version 2.0.0 name bigfoot-tracker-api-v2
QUEUED
127.0.0.1:6379(TX)> EXEC
1) (integer) 0
2) (integer) 2
```

We can use these commands in Node Redis as well, provided we use the same connection. In our Bigfoot Tracker API, it looks like we are using a single connection for everything, but there's a chance we're not. This is because Node Redis can pool multiple connections to Redis and so a _specific_ connection for a command is not guaranteed.

However, if we're only using MULTI and EXEC and don't need to WATCH anything (i.e. our case), this is moot. Node Redis optimizes tansactions by queueing the commands between the MULTI and EXEC locally before sending them on the same connection. However, if we WATCH something, we do not have this guarantee as the WATCH command could happen on _any_ connection.

 The good news is we can force Node Redis to do this using [isolated execution](https://github.com/redis/node-redis/blob/master/docs/isolated-execution.md). I'm not gonna cover that here, but it's good to know it exists for those situations when you need to atomically update mutliple keys with a transaction.


## Adding Transactions to Bigfoot Sightings ##

Remember this code in **`routers/sightings-router.js`**?

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

It has a flaw. See it? Someone could sneak in a write to our key after we call `.unlink()` but before we call `.hSet()`. Then, we would have our data overlayed on top of their data instead of just our data. This sounds like a problem for... transactions!

Go ahead and update the code to this:

```javascript
sightingsRouter.put('/:id', (req, res) => {
  const { id } = req.params
  const key = sightingKey(id)

  redis.multi()
    .unlink(key)
    .hSet(key, { id, ...req.body })
      .exec()

  res.send({
    status: "OK",
    message: `Sighting ${id} created or replaced.`
  })
})
```

We call `.multi()` to start our transaction. Then we queue our commands and call `.exec()` to run them. Easy peasy.

----------------------------------------

Okay, transactions done. Next, we're gonna change our application to use [RedisJSON](14-REDISJSON.md) to store our Bigfoot sightings instead of Hashes.
