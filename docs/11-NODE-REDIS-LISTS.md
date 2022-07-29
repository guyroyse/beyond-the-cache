# Lists #

We want our Bigfoot Tracker API to accept new reports of Bigfoot sightings from the general public. We can store these as a List in Redis, pushing incoming sightings to the end of the List. Then our army of volunteers can pop those messages from the front of the List, vet them, and create new Bigfoot sightings.

We'll work on creating new Bigfoot sighting using Hashes in the next session. For now, let's focus on gettting reports into and out of the API.

We'll be using the Redis commands of [RPUSH](https://redis.io/commands/rpush/), [LRANGE](https://redis.io/commands/lrange/), and [LPOP](https://redis.io/commands/lpop/) through Node Redis for this section.

Go ahead and open **`src/report.js`** as this is where we'll be making our changes.

## Endpoints ##

Here's the various endpoints for this section:

| Verb  | Path    | Description
|:------|:--------|:------------------------------------------------------------
| POST  | /report | Add a new report to the list of reported Bigfoot sightings
| GET   | /report | Get all the reported Bigfoot sightings in the list
| PATCH | /report | Remove and return the next report of a Bigfoot sighting

## Adding a New Report ##

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
curl \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{ "report": "I saw Bigfoot out by the Walmart" }' \
  localhost:8080/report

curl \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{ "report": "I heard Bigfoot behind the trailer digging through some trash cans" }' \
  localhost:8080/report

curl \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{ "report": "My grandpa told me about this time he saw Bigfoot when he was a kid in Kentucky" }' \
  localhost:8080/report
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
curl -X GET localhost:8080/report
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
curl -X PATCH localhost:8080/report
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
curl -X GET localhost:8080/report
```

Nothing. We get nothing:
```json
[]
```

----------------------------------------

Now the we are bringing in reports, let's see how to create Bigfoot sightings using [Hashes](12-NODE-REDIS-HASHES.md).
