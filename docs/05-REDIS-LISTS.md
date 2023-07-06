# Lists #

[Lists](https://redis.io/commands/?group=list) in Redis are simply lists of strings, sorted by insertion order. Behind the scenes it's just a doubly-linked list.

You can add items to the head or tail of a List with [LPUSH](https://redis.io/commands/lpush/) and [RPUSH](https://redis.io/commands/rpush/). Try them out and create a list of Bigfoot reports:

```bash
127.0.0.1:6379> RPUSH bigfoot:sightings:reported "I saw Bigfoot out by the Walmart"
(integer) 1
127.0.0.1:6379> RPUSH bigfoot:sightings:reported "I heard Bigfoot behind the trailer digging through some trash cans"
(integer) 2
127.0.0.1:6379> LPUSH bigfoot:sightings:reported "My grandpa told me about this time he saw Bigfoot when he was a kid in Kentucky"
(integer) 3
```

You can retreive part or all of a list using [LRANGE](https://redis.io/commands/lrange/). LRANGE takes numeric start and stop indices as arguments. Zero and positive indices start from the head of the list. Negative ones start from the tail.

```bash
127.0.0.1:6379> LRANGE bigfoot:sightings:reported 0 1
1) "My grandpa told me about this time he saw Bigfoot when he was a kid in Kentucky"
2) "I saw Bigfoot out by the Walmart"
127.0.0.1:6379> LRANGE bigfoot:sightings:reported 0 0
1) "My grandpa told me about this time he saw Bigfoot when he was a kid in Kentucky"
127.0.0.1:6379> LRANGE bigfoot:sightings:reported -2 -1
1) "I saw Bigfoot out by the Walmart"
2) "I heard Bigfoot behind the trailer digging through some trash cans"
127.0.0.1:6379> LRANGE bigfoot:sightings:reported 1 -2
1) "I saw Bigfoot out by the Walmart"
```

You can get a single item using the [LINDEX](https://redis.io/commands/lindex/) command. Give it a try:

```bash
127.0.0.1:6379> LINDEX bigfoot:sightings:reported 1
"I saw Bigfoot our by the Walmart"
```

You can remove and retrieve items atomically from the head or tail of a List with [LPOP](https://redis.io/commands/lpop/) and [RPOP](https://redis.io/commands/rpop/).

Try popping a few things off the List:

```bash
127.0.0.1:6379> LPOP bigfoot:sightings:reported
"My grandpa told me about this time he saw Bigfoot when he was a kid in Kentucky"
127.0.0.1:6379> RPOP bigfoot:sightings:reported
"I heard Bigfoot behind the trailer digging through some trash cans"
```

You can even pop from one list and push to another using [LMOVE](https://redis.io/commands/lmove/). LMOVE takes a source and destination list and then arguments to specify which side to pop and which side to push. Since we removed a bunch of stuff from it, recreate the the list above and then try moving some items:

```bash
127.0.0.1:6379>LMOVE bigfoot:sightings:reported bigfoot:sightings:processed RIGHT LEFT
"I heard Bigfoot behind the trailer digging through some trash cans"
127.0.0.1:6379> LRANGE bigfoot:sightings:reported 0 -1
1) "My grandpa told me about this time he saw Bigfoot when he was a kid in Kentucky"
2) "I saw Bigfoot our by the Walmart"
127.0.0.1:6379> LRANGE bigfoot:sightings:processed 0 -1
1) "I heard Bigfoot behind the trailer digging through some trash cans"
```

### 📍 Figure It Out ###

- What happens when you remove all the items from a List?
- How could you get all the values in a List?
- When using LRANGE, happens when indices are out of range?
- What happens when you RPOP or LPOP from an empty List?
- What happens if you set the source and destination of LMOVE to the same List?

----------------------------------------

Now that you've explored Lists, it's time to take a look at [Hashes](06-REDIS-HASHES.md).
