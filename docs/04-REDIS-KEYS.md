# Basic Key Manipulation #

Redis has some core commands for checking, removing, and expiring keys.

The [EXISTS](https://redis.io/commands/exists/) commands tells you if a key exists or not. It returns 1 for true and 0 for false. Try it out:

```bash
127.0.0.1:6379> EXISTS sightings:count
(integer) 1
127.0.0.1:6379> EXISTS bigfoot
(integer) 0
```

You can remove a key from Redis with either [DEL](https://redis.io/commands/del/) or [UNLINK](https://redis.io/commands/unlink/). DEL does it *right now* and doesn't return until the key is removed. UNLINK returns immediately and deletes later.

```bash
127.0.0.1:6379> DEL motd
(integer) 1
127.0.0.1:6379> UNLINK sightings:count
(integer) 1
```

Redis can delete keys for you automatically if you give a key a lifetime in seconds using [EXPIRE](https://redis.io/commands/expire/). And you can query the time remaining using [TTL](https://redis.io/commands/ttl/):

```bash
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


## 📍 Figure It Out ##

- What happens when you DEL or UNLINK a key that isn't there?
- What happens when you EXPIRE a missing key?
- What happens when you ask for the TTL on a non-EXPIREd key?
- What happens when you ask for the TTL on a key that no longer exists?

----------------------------------------

Let's check out [Lists](05-REDIS-LISTS.md) next.
