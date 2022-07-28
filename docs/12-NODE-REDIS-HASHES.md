# Hashes #

Let's get to the meat of the Bigfoot Tracker API and store and retrieve Bigfoot sightings. We'll use Hashes to do this—storing a single sighting in a single Hash using at keyspace of `bigfoot:sighting:`.

We'll be using the Redis commands of [HSET](https://redis.io/commands/hset/), [HGETALL](https://redis.io/commands/hgetall/), and [UNLINK](https://redis.io/commands/unlink/) in this section.

Go ahead and open **`src/sightings.js`** as this is where we'll be making our changes.

## Endpoints ##

Here's the various endpoints for this section. We'll add more endpoints to it in the next section when we talk about RediSearch and RediJSON:

| Verb   | Path | Description
|:-------|:-----|:------------------------------------------------------------
| GET    | /    | Get all of the Bigfoot sighting
| POST   | /    | Add a new Bigfoot sighting and assign it an ID
| GET    | /:id | Get an existing Bigfoot sighting by ID
| PUT    | /:id | Create or replace a Bigfoot sighting with the given ID
| PATCH  | /:id | Add a new Bigfoot sighting and assign it an ID
| DELETE | /:id | Add a new Bigfoot sighting and assign it an ID

## Optimzing `curl` ##

We've been typing in all the data for `curl` for the last view examples, and, frankly, it's kinda tedious. So, in the **`data`** folder, there are several JSON files containing Bigfoot sightings. We'll tell `curl` to load these instead of typing in the data manually for all the examples in this section.

## Adding a New Sighting ##

Add the following code to add a report to the list:

```javascript
  const { report } = req.body
  redis.rPush(reportKey, report)
  res.send({
    status: "OK",
    message: `Report accepted.`
  })
```

Try adding some reports:

```bash
curl -X POST -H "Content-Type: application/json" -d '{ "report": "I saw Bigfoot out by the Walmart" }' http://localhost:8080/report
curl -X POST -H "Content-Type: application/json" -d '{ "report": "I heard Bigfoot behind the trailer digging through some trash cans" }' http://localhost:8080/report
curl -X POST -H "Content-Type: application/json" -d '{ "report": "My grandpa told me about this time he saw Bigfoot when he was a kid in Kentucky" }' http://localhost:8080/report
```

Each of these should respond with the following:

```json
{
  "status": "OK",
  "message": "Report accepted."
}
```

## Fetching All the Reports ##

Add the following code to retrieve all the incoming reports:

```javascript
  const reports = await redis.lRange(reportKey, 0, -1)
  res.send(reports)
```

And test it out:

```bash
curl -X GET http://localhost:8080/report -s | jq
```

Hey, look. There's all the reports we added:

```json
[
  "I saw Bigfoot out by the Walmart",
  "I heard Bigfoot behind the trailer digging through some trash cans",
  "My grandpa told me about this time he saw Bigfoot when he was a kid in Kentucky"
]
```

## Processing Reports

Let's add the code to pop a report off of the list for processing:

```javascript
  const report = await redis.lPop(reportKey)
  res.send({ report })
```

Let's pop one off the queue:

```bash
curl -X PATCH http://localhost:8080/report
```

You should get back the first one you added. Hey, we made a FIFO queue!

```json
{
  "report": "I saw Bigfoot out by the Walmart"
}
```

Go ahead and use the same command to pop them all off the list. What happens when the list is empty?

Once they are all gone, let's try fetching all the reports again and see what we get:

```bash
curl -X GET http://localhost:8080/report
```

Nothing. We get nothing:
```json
[]
```

----------------------------------------
