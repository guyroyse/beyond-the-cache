# Strings #

[Strings](https://redis.io/commands/?group=string) are the simplest data structure in Redis. They're called Strings but they're really more insteresting and can contain numbers and binary data as well as text.

Use [GET](https://redis.io/commands/get/) and [SET](https://redis.io/commands/set/) to, well, get and set a String in Redis. Quotes are optional but needed if you have any whitespace in your string. You can use either single- or double-quotes, just like in JavaScript. Escape quotes within your string with a backslash, also just like in JavaScript.

Try getting and setting the message of the day for our Bigfoot Tracker:

```bash
127.0.0.1:6379> SET motd Greetings!
OK
127.0.0.1:6379> GET motd
"Greetings!"
```

## 📍 Figure It Out ##

- What happens when you get a String that isn't there?
- Try changing the message of the day to a message with whitespace. Try one with quotes.
- How do you think you might set a String with a tab or a new-line?

# String Containing Integers #

String in Redis can be numbers. Weird, I know, but try it:

```bash
127.0.0.1:6379> SET sightings:count 42
OK
127.0.0.1:6379> GET sightings:count
"42"
```

I know what you're thinking—that's just a String containing a number. But it's not. Redis stores this internally as a 64-bit signed integer. This let's you modifiy it numerically using a handful of commands.

Use [INCR](https://redis.io/commands/incr/) and [DECR](https://redis.io/commands/decr/) to increment and decrement a String:

```bash
127.0.0.1:6379> INCR sightings:count
(integer) 43
127.0.0.1:6379> GET sightings:count
"43"
```

Next, use [INCRBY](https://redis.io/commands/incrby/) and [DECRBY](https://redis.io/commands/decrby/) to increment and decrement by a specified amount:

```bash
127.0.0.1:6379> DECRBY sightings:count 20
(integer) 23
127.0.0.1:6379> GET sightings:count
"23"
```

## 📍 Figure It Out ##

- What happens when you increment or decrement a String that isn't there?
- What about a String that doesn't contain a number?
- What happens when you give INCRBY and DECRBY negative numbers?

----------------------------------------

Before we explore the next data structure, let's learn some of the commands for [manipulating keys](04-REDIS-KEYS.md) in Redis.
