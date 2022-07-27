# Sets #

[Sets](https://redis.io/commands/?group=set) in Redis are, well, sets. Think set theory. You can add, remove, and check membership. And you can do things like unions and intersections, which is pretty cool. Importantly, you cannot add duplicate member to a Set.

You add things to a Set with the [SADD](https://redis.io/commands/sadd/) command. Let's add some states:

```bash
127.0.0.1:6379> SADD states Ohio
(integer) 1
127.0.0.1:6379> SADD states Indiana Kentucky "West Virginia"
(integer) 3
```

We can get all the states, the members of the Set, using the [SMEMBERS](https://redis.io/commands/smembers/) command and a count of members, i.e. the cardinality, using the [SCARD](https://redis.io/commands/scard/) command. Try them:

```bash
127.0.0.1:6379> SMEMBERS states
1) "Kentucky"
2) "Indiana"
3) "Ohio"
4) "West Virginia"
127.0.0.1:6379> SCARD states
(integer) 4
```

You can check to see if a member is in the Set using the [SISMEMBER](https://redis.io/commands/sismember/) command. Give it a whirl:

```bash
127.0.0.1:6379> SISMEMBER states Ohio
(integer) 1
127.0.0.1:6379> SISMEMBER states Hawaii
(integer) 0
```

And, finally, you can remove members from a Set using the [SREM](https://redis.io/commands/SREB/) command. Let's delete some stuff:

```bash
127.0.0.1:6379> SREM states Ohio
(integer) 1
127.0.0.1:6379> SREM states Kentucky Indiana
(integer) 2
```

### 📍 Figure It Out ###

- What happens when you add a member that's already in the Set?
- What happens when you remove a member that's not in the Set?
- Look at the [Hash commands](https://redis.io/commands/?group=hash). How would you get the field names of a Hash? The length?


Now that you've tried out some of the most common data structures in Redis, it's time to write some code using Node Redis. We'll start by [setting up a simple API](08-API-SETUP.md) using Express.
