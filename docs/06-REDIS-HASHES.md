# Hashes #

[Hashes](https://redis.io/commands/?group=hash) in Redis are data structures that store a bunch of fields and their respective value in pairs. This is probably the most ubiquitous data structure in software. You see this in programing languages under lots of names. In Java, they call them Maps, Python and C# call them dictionaries, and in JavaScript, well, they're just objects.

You store things in a Hash in Redis using the [HSET](https://redis.io/commands/hset/) command. It just takes the key, a field, and the value. But it's also variadic, so you can specify multiple fields and values. Try it out by adding a Bigfoot sighting:

```bash
127.0.0.1:6379> HSET bigfoot:sighting:1234 text "I saw Bigfoot buying shoes at Walmart. Turns out, he wears a size 27."
(integer) 1
127.0.0.1:6379> HSET bigfoot:sighting:1234 title "Bigfoot by the Walmart" class "Class A" county "Athens" state "Ohio"
(integer) 4
127.0.0.1:6379> HSET bigfoot:sighting:1234 title "Bigfoot by the Walmart in Athens, Ohio"
(integer) 0
```

Notice that the return value is the number of fields *added* to the hash. Modifying a field returns a zero.

We've written, let's read. To get the value of a field out of a Hash, use [HGET](https://redis.io/commands/hget/). To get the values of multiple fields, use [HMGET](https://redis.io/commands/hmget/). And to get *all* the fields, just [HGETALL](https://redis.io/commands/hgetall/). Give it a try:

```bash
127.0.0.1:6379> HGET bigfoot:sighting:1234 title
"Bigfoot by the Walmart in Athens, Ohio"
127.0.0.1:6379> HMGET bigfoot:sighting:1234 title class state
1) "Bigfoot by the Walmart in Athens, Ohio"
2) "Class A"
3) "Ohio"
127.0.0.1:6379> HGETALL bigfoot:sighting:1234
 1) "title"
 2) "Bigfoot by the Walmart in Athens, Ohio"
 3) "text"
 4) "I saw Bigfoot buying shoes at Walmart. Turns out, he wears a size 27."
 5) "class"
 6) "Class A"
 7) "state"
 8) "Ohio"
 9) "views"
10) "47"
11) "county"
12) "Athens"
```

You can see that HGET and HMGET return just values while HGETALL returns the values *and* the fields for those values.

The values stored in Hashes are Strings. This means you can't nest Hashes inside of Hashes as a Hash isn't a String. But it *does* mean that Strings containing numbers stored in the Hash are stored as integers. And there's a command to increment them called [HINCRBY](https://redis.io/commands/hincrby/) that works just like INCRBY. Let's try it out:

```bash
127.0.0.1:6379> HSET bigfoot:sighting:1234 views 42
(integer) 1
127.0.0.1:6379> HINCRBY bigfoot:sighting:1234 views 5
(integer) 47
127.0.0.1:6379> HGET bigfoot:sighting:1234 views
"47"
```

And, of course, you need to be able to delete things. You can do this with the [HDEL](https://redis.io/commands/hdel/) command. Try deleting some fields in our Hash:

```bash
127.0.0.1:6379> HDEL bigfoot:sighting:1234 title
(integer) 1
127.0.0.1:6379> HDEL bigfoot:sighting:1234 county state
(integer) 2
127.0.0.1:6379> HGETALL bigfoot:sighting:1234
1) "text"
2) "I saw Bigfoot by the Walmart. He was buying shoes. Turns out, he wears a size 27."
3) "class"
4) "Class A"
5) "views"
6) "47"
```

### 📍 Figure It Out ###

- What happens when you remove an item that's not in the Hash?
- What happens when you remove all the items from a Hash?
- Look at the [Hash commands](https://redis.io/commands/?group=hash). How would you get the field names of a Hash? The length?

----------------------------------------

Hashes down. Let's take a look at [Sets](07-REDIS-SETS.md).
