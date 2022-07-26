# Basic Data Structures in Redis

Redis can be thought of as networked memory. That memory can contain a variety of data structures. You know, those things you learned about in college but modern languges just provide natively like hash tables, linked lists, and sets. These data strucutres are created, manipulated, and exposed over the network via a wire protocol, called [RESP](https://redis.io/docs/reference/protocol-spec/). The details of RESP are not terribly important for this workshop, but when you issue a command in RedisInsight to Redis, it translates your commands and their responses to and from that wire protocol.

Speaking of commands, the full reference documention for all of Redis' commands can be found online at https://redis.io/commands/. Feel free to refer to this page during the workshop. I _work_ for Redis and use it every day.

Nearly everything in Redis is stored in keys. A key is just the name of one of the data structures that you have stored in Redis. Think of it like a file name. So, you might have keys such as `messages`, `user:1`, or `704A5AC6-681F-4C62-9F75-25449603AE20`.

It is common practice to create namespaces within our keys. We call this a keyspace. By convention, the elements of a keyspace are delimited with colons. Here are some sample keys with keyspaces:

```
bigfoot:motd
bigfoot:sighting:8086
bigfoot:sightings:byState:OH
bigfoot:sightings:reported
```

Oh, and we're going to build parts of a Bigfoot tracker website with users, sightings, forums, etc. so all of the example data will be Bigfoot related. I hope that's OK.

## Strings ##

[Strings](https://redis.io/commands/?group=string) can contain more than just text, although they contain text just fine. Use [GET](https://redis.io/commands/get/) and [SET](https://redis.io/commands/set/) to, well, get and set a String in Redis. Quotes are optional but needed if you have any whitespace in your string. You can use either single- or double-quotes, just like in JavaScript. Escape quotes within your string with a backslash, also just like in JavaScript.

Try getting and setting the message of the day for our Bigfoot Tracker:

```
127.0.0.1:6379> SET motd Greetings!
OK
127.0.0.1:6379> GET motd
"Greetings!"
```

- What happens when you get a String that isn't there?
- Try changing the message of the day to a message with whitespace. Try one with quotes.
- How do you think you might set a String with a tab or a new-line?

### String Containing Integers ###

String in Redis can be numbers. Weird, I know. But try it:

```
127.0.0.1:6379> SET count 42
OK
127.0.0.1:6379> GET count
"42"
```

I know, that's just a String containing a number. But it's not. Redis stores this internally as a 64-bit signed integer. This let's you modifiy it numerically using [INCR](https://redis.io/commands/incr/), [DECR](https://redis.io/commands/decr/), [INCRBY](https://redis.io/commands/incrby/), and [DECRBY](https://redis.io/commands/decrby/).

Try usuing INCR and DECR to increment and decrement a String:

```
127.0.0.1:6379> INCR count
(integer) 43
127.0.0.1:6379> GET count
"43"
```

Next, use INCRBY and DECRBY to increment and decrement by a specified amount:

```
127.0.0.1:6379> DECRBY count 20
(integer) 23
127.0.0.1:6379> GET count
"23"
```

- What happens when you increment or decrement a String that isn't there?
- What about a String that doesn't contain a number?
- What happens when you give INCRBY and DECRBY negative numbers?


## Basic Key Manipulation ##

Redis has some core commands for checking, removing, and expiring keys. Try them out.

The EXISTS commands tells you if a key exists or not. It returns 1 for true and 0 for false. Try it out:

```
127.0.0.1:6379> EXISTS count
(integer) 1
127.0.0.1:6379> EXISTS bigfoot
(integer) 0
```

You can remove a key from Redis with either [DEL](https://redis.io/commands/del/) or [UNLINK](https://redis.io/commands/unlink/). DEL does it *right now* and doesn't return until the key is removed. UNLINK returns immediately and deletes later.

```
127.0.0.1:6379> DEL motd
(integer) 1
127.0.0.1:6379> UNLINK count
(integer) 1
```

- What happens when you delete a key that isn't there?

Redis can delete keys for you automatically if you give a key a lifetime in seconds using [EXPIRE](https://redis.io/commands/expire/). And you can query the time remaining using [TTL](https://redis.io/commands/ttl/):

```
127.0.0.1:6379> SET bigfoot "Is real!"
OK
127.0.0.1:6379> EXPIRE bigfoot 60
(integer) 1
127.0.0.1:6379> TTL bigfoot
(integer) 55

...wait 55 seconds...

127.0.0.1:6379> EXISTS bigfoot
(integer) 0
```

- What happens when you EXPIRE a missing key?
- What happens when you ask for the TTL on a non-EXPIREd key?
- What happens when you ask for the TTL on a key that no longer exists?


## Lists ##

Store some new reports, using it as a work queue

Now that you've tried out these data structures from Redis, it's time to [write some code](03-API-SETUP.md) using Node Redis.

### LPUSH, RPUSH ###

### LRANGE ###
LRANGE myList 0 -1

### LPOP, RPOP ###

### LMOVE ##


## Hashes ##

Store some bigfoot sightings ID, Title, Text, Classification, County, State, DateTime

### HSET ###
### HGET ###
### HMGET ###
### HGETALL ###

## Sets ##

### SADD ###
### SMEMBERS ###
### SADD ###

Users.

# This Goes in Something Later #

## Sets as Indices ##

Store some indices

## Transactions ##

Making it atomic

