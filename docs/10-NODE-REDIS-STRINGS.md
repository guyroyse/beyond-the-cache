# Strings #

Our Bigfoot Tracker API needs to provide a message of the day. This is a message that will be displayed on the site, if it exists. We want the message to be temporary. So, it needs to be able to be set and removed. And, it'd be nice if it could just go away on it's own.

We'll be using the Redis commands of [GET](https://redis.io/commands/get/), [SET](https://redis.io/commands/set/), and [UNLINK](https://redis.io/commands/unlink/) through Node Redis. And, we'll look at a new command that combines SET and EXPIRE atomically—[SETEX](https://redis.io/commands/setex/).

Go ahead and open **`routers/motd.js`** as this is where we'll be making our changes.

## Endpoints ##

Here's the various endpoints for this section:

| Verb   | Path  | Description
|:-------|:------|:------------------------------------------------------------
| GET    | /motd | Get the message of the day
| PUT    | /motd | Create or replace the message of the day
| DELETE | /motd | Clear the message of the day

## Getting the MOTD ##

Find the route that gets the message of the day and add the following code inside it:

```javascript
  const motd = await redis.get('bigfoot:motd')
  res.send({ motd })
```

Save, and try out the route:

```bash
curl -X GET localhost:8080/motd
```

It should return a null as we've not set the message of the day:

```json
{
  "motd": null
}
```

Let's set one.

## Setting the MOTD ##

Add the following code to set the message of the day:

```javascript
  const { motd } = req.body
  redis.set('bigfoot:motd', motd)
  res.send({
    status: "OK",
    message: `MOTD set to ${motd}.`
  })
```

Note that we are not awaiting the call to `.set()`. This is becauase we don't care about the return value. So, no need to stick around and wait for it.

Invoke it over REST to set a message:

```bash
curl \
  -X PUT \
  -H "Content-Type: application/json" \
  -d '{ "motd": "The Bigfoot Tracker will be down for scheduled maintenance tomorrow." }' \
  localhost:8080/motd
```

You should get the following reply:

```json
{
  "status": "OK",
  "message": "MOTD set to: The Bigfoot Tracker will be down for scheduled maintenance tomorrow."
}
```

Use RedisInsight to look at what you have wrought. There should be a key named `bigfoot:motd`. It should contain our message.

Go ahead and get it from the API:

```bash
curl -X GET localhost:8080/motd
```

And you should see:

```json
{
  "motd": "The Bigfoot Tracker will be down for scheduled maintenance tomorrow."
}
```

## Clearing the MOTD ##

We can read and write. Now let's delete. Add the following code:

```javascript
  redis.unlink('bigfoot:motd')
  res.send({
    status: "OK",
    message: `MOTD removed.`
  })
```

And try deleting the message of the day:

```bash
curl -X DELETE localhost:8080/motd
```

You should get the response:

```json
{
  "status": "OK",
  "message": "MOTD removed."
}
```

Confirm this with a get:

```bash
curl -X GET localhost:8080/motd
```

And you should get a `null`:

```json
{
  "motd": null
}
```

## Expiring the MOTD ##

We want our message of the day to automaitcally expire. That way we don't have to go in and manually remove it. Let's modify our code that sets the message of the day to optionally allow you to provide an expiration:

```javascript
  const { motd, expireIn } = req.body
  if (expireIn ?? 0 > 0) {
    redis.setEx('bigfoot:motd', expireIn, motd)
  } else {
    redis.set('bigfoot:motd', motd)
  }
  res.send({
    status: "OK",
    message: `MOTD set to: ${motd}`,
    expireIn
  })
```

Note that we are checking to see if `expireIn` is defined and that is greater than zero. The is because the SETEX command—and thus `.setEx()`—only takes positive numbers. If it is, we call `.setEx()` and provide it the key, the time-to-live *in seconds*, and the value to set.

Let's try it out and set an expiring message of the day:

```bash
curl \
  -X PUT \
  -H "Content-Type: application/json" \
  -d '{ "expireIn": 60, "motd": "The Bigfoot Tracker will be down for scheduled maintenance tomorrow." }' \
  localhost:8080/motd
```

And you should get:

```json
{
  "status": "OK",
  "message": "MOTD set to: The Bigfoot Tracker will be down for scheduled maintenance tomorrow.",
  "expireIn": 60
}
```

Wait a few second and see if the message disappears. Check it via the API, as you did earlier, or take a look in RedisInsight.

## Refactoring Our Code ##

We've got one little messy bit in our code here. We've used a magic value of `bigfoot:motd` all over the place. Let's clean that up and move it to a constant named `motdKey`.

----------------------------------------

And that's it. We wrote, read, and removed Strings from  Redis. Let's work with [Lists](11-NODE-REDIS-LISTS.md) next.
