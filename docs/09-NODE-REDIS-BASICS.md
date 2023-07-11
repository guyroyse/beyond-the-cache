# Node Redis Basics #

Inside of the **`src`** folder, we have the following files and folders of note:

-  **`server.js`**: This is the main file that starts the Express server and binds the routers. You shouldn't need to modify it—and there is nothing Redis specfic in it—but take a look and see how it works.
-  **`redis/client.js`**: Establishes a Redis connection with Node Redis and exports it. You won't need to modify this either, but you should know how it works. It'll be covered below.
-  **`redis/sightings.js`**: This mostly empty file will contain code to set up RediSearch and Redis OM to search Bigfoot sightings. You won't need to modify this anytime soon, but know that it's there.
-  **`routers/`**: This folder contains the various routers, with stubbed-out implementations, that **`server.js`** exposes.


## Connecting to Redis ##

We're going to connect to Redis using [Node Redis](https://github.com/redis/node-redis). Node Redis is the library you get when you run:

```bash
npm install redis
```

It's already in the **`package.json`**, so no need to do that. Once you have it, there are several ways to connect. The simplest is:

```javascript
import { createClient } from 'redis'

export const redis = createClient()
await redis.connect()
```

This will connect to Redis running locally, on the default port of `6379`. This might be good enough for what your doing, but it's not good enough for this workshop.

Another way is to connect with a Redis URL. The Redis URL format is defined by the IANA. You can [read the details](https://www.iana.org/assignments/uri-schemes/prov/redis) there, if you like. The tl;dr is that it works just like http URLs and is in the format:

`redis[s]://[[username][:password]@][host][:port]`

The following connects to Redis running on `awesome.redis.server` that is listening on port `6380`. The connecting user is `alice` and her password is `foobared`.

```javascript
import { createClient } from 'redis'

createClient({ url: 'redis://alice:foobared@awesome.redis.server:6380' })
await redis.connect()
```

Take a look at the **`client.js`** file and see how we are connecting to Redis. We are specifying discrete configuration options rather than using a URL. The details of these options can be found in the [Client Configuration Guide](https://github.com/redis/node-redis/blob/master/docs/client-configuration.md) on GitHub.

Also note that we are listening for any errors that Node Redis might report and just spamming them out to the console. [This is fine](https://en.wikipedia.org/wiki/Gunshow_(webcomic)).


## Pinging the Server ##

Let's write some code. We're going to call PING against Redis to make sure that all of our plumbing works. If you haven't done this already, go ahead and start the server:

```bash
npm start
```

Now, let's open up the **`status-router.js`** file in the **`routers`** folder. We need to replace the clearly unimplemented code with something a little more... implemented.

Add a call to `.ping()` and await a response. Then, return that response—along with some other server details (just for fun):

```javascript
  const pingResponse = await redis.ping()
  res.send({ name, version, pingResponse })
```

Note that most calls to Redis are `async`. So, you'll need to `await` them.

You might notice that the PING command in Redis is mapped to the `.ping()` function in Node Redis. This is a common pattern. Almost all of the Redis commands map to a function of the same name in Node Redis. But they are converted from uppercase to camelcase.

For single-word commands, this is really easy. Things like PING, GET, and EXPIRE become `.ping()`, `.get()`, and `.expire()`. More verbosely named commands are only slightly trickier. For example, HGETALL and SISMEMBER become `.hGetAll()` and `.sIsMember()`.

But we just called `.ping()`. So let's try it out. You can use your browser, curl, Postman, or whatever you want to do so. All of my examples will be using curl like this:

```bash
curl -X GET localhost:8080/status
```

Personally, I like to use curl combined with [jq](https://jqlang.github.io/jq/) as that makes my JSON pretty. It's an option of you want to explore it:

```bash
curl -X GET localhost:8080/status -s | jq
```

Regardless, this should return the following JSON:

```json
{
  "name": "bigfoot-tracker-api",
  "version": "1.0.0",
  "pingResponse": "PONG"
}
```


## One Last Thing

Before we start adding more code to our API and more data to Redis, let's go ahead and clean out the data we have already stored from the previous section of the workshop. To do that, I'm going to teach you a **very dangerous** Redis command—[FLUSHALL](https://redis.io/commands/flushall/).

FLUSHALL removes all data from Redis. All data. Everything. And, it doesn't prompt you to ask if you are sure. It just *does it*. So, this is fine to use for learning and experiments and workshops and whatnot. But if you run it in production, you're gonna have a bad day.

Go ahead and run this command from RedisInsight:

```bash
127.0.0.1:6379> FLUSHALL
OK
```

And that's it. We successfully talked to Redis and learned a dangerous thing. Now, let's [do something with some Strings](10-NODE-REDIS-STRINGS.md).
