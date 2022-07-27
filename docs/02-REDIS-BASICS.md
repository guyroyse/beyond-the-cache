# Basic Data Structures in Redis #

Redis can be thought of as networked memory. That memory can contain a variety of [data structures](https://redis.io/docs/manual/data-types/). You know, those things you learned about in college but modern languges just provide natively. Like hash tables, linked lists, and sets. These data strucutres are created, manipulated, and exposed over the network via a wire protocol, called [RESP](https://redis.io/docs/reference/protocol-spec/). The details of RESP are not terribly important for this workshop. Just know that when you issue a command in RedisInsight to Redis, it translates your commands and their responses to and from that wire protocol.

Speaking of commands, the full reference documention for all of Redis' commands can be found online at https://redis.io/commands/. Feel free to refer to this page during the workshop. I _work_ for Redis and use it every day.

Nearly everything in Redis is stored in keys. A key is just the name of one of the data structures that you have stored in Redis. Think of it like a file name. So, you might have keys such as `messages`, `user:1`, or `704A5AC6-681F-4C62-9F75-25449603AE20`.

It is common practice to create namespaces within our keys. We call this a keyspace. By convention, the elements of a keyspace are delimited with colons. Here are some sample keys with keyspaces:

```bash
bigfoot:motd
bigfoot:sighting:8086
bigfoot:sightings:byState:OH
bigfoot:sightings:reported
```

Oh, and we're going to build parts of a Bigfoot tracker website with users, sightings, forums, etc. so all of the example data will be Bigfoot related. I hope that's OK.

Let's start by looking at [Strings](03-REDIS-STRINGS.md).
