# Basic Data Structures in Redis

Redis can be thought of as networked memory. That memory can contain a variety of data structures. You know, those things you learned about in college but modern languges just provide natively like hash tables, linked lists, and sets. These data strucutres are created, manipulated, and exposed over the network via a wire protocol, called [RESP](https://redis.io/docs/reference/protocol-spec/). The details of RESP are not terribly important for this workshop, but when you issue a command in RedisInsight to Redis, it translates your commands and their responses to and from that wire protocol.

Speaking of commands, the full reference documention for all of Redis' commands can be found online at https://redis.io/commands/. Feel free to refer to this page during the workshop. I _work_ for Redis and use it nearly every day.

Nearly everything in Redis is stored in keys. A key is just the name of one of the data structures you have stored in Redis. Think of it like a file name. So, you might have keys such as `messages`, `user:1`, or `704A5AC6-681F-4C62-9F75-25449603AE20`.

It is common practice to create namespaces within our keys. We call this a keyspace. By convention, the elements of a keyspace are delimited with colons. Here are some sample keys with keysapces:

```
bigfoot:user:1234
bigfoot:sighting:8086
bigfoot:sighting:8086:county
bigfoot:sighting:8086:state
bigfoot:sightings:new
bigfoot:sightings:byCounty:Athens
bigfoot:sightings:byState:OH
```

Oh, and we're going to build parts of a Bigfoot tracker with users, sightings, forums, etc. so all of the example data will be Bigfoot related. I hope that's OK.

## Strings ##

[Strings](https://redis.io/commands/?group=string) contain more than just text, although they contain text just fine.

Store a hashed password for a user.

## Hashes ##

Store some bigfoot sightings ID, Title, Text, Classification, County, State, DateTime

## Lists ##

Store some new reports, using it as a work queue

## Sets ##



## Deleting and Expiring Keys ##

Now that you've tried out these data structures from Redis, it's time to [write some code](02-API-SETUP.md) using Node Redis.
