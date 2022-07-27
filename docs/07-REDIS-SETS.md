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

And, finally, you can remove members from a Set using the [SREM](https://redis.io/commands/srem/) command. Let's delete some stuff:

```bash
127.0.0.1:6379> SREM states Ohio
(integer) 1
127.0.0.1:6379> SREM states Kentucky Indiana
(integer) 2
```

If you have more than one Set, you can get the difference, intersection, or union of those Sets with the [SDIFF](https://redis.io/commands/sdiff/), [SINTER](https://redis.io/commands/sinter/), [SUNION](https://redis.io/commands/sunion/) commands repsectively. Create some sets and try them out:

```bash
127.0.0.1:6379> SADD midwest:states Ohio Indiana Michigan
(integer) 3
127.0.0.1:6379> SADD eastern:states Ohio Pennsylvania Maryland
(integer) 3
127.0.0.1:6379> SDIFF midwest:states eastern:states
1) "Michigan"
2) "Indiana"
127.0.0.1:6379> SINTER midwest:states eastern:states
1) "Ohio"
127.0.0.1:6379> SUNION midwest:states eastern:states
1) "Michigan"
2) "Ohio"
3) "Indiana"
4) "Pennsylvania"
5) "Maryland"
```

### 📍 Figure It Out ###

- What happens when you add a member that's already in a Set?
- What happens when you remove a member that's not in a Set?
- What happens when you check the cardinality of a Set that's not defined in Redis?
- What happens when you flip the order of the arguments in SDIFF?


Now that you've tried out some of the most common data structures in Redis, it's time to write some code using Node Redis. We'll start by [setting up a simple API](08-API-SETUP.md) using Express.
