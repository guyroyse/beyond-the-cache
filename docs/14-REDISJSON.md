# Using RedisJSON #

[RedisJSON](https://redis.io/docs/stack/json/) is a module. Modules are plugins to Redis that extend it with new data structures and new commands. Anyone can [write a module](https://redis.io/docs/reference/modules/), if they are handy with a systems-level programing language like C or Rust.

RedisJSON, as you might have guessed based on the name, adds a JSON document data strucutre and and [commands](https://redis.io/commands/?group=json) to manipulate those documents.

Let's try it out from RedisInsight first. Then we can take a look at changing our API to write out to JSON instead.

## Getting and Setting JSON ##

Let's store a simple user in RedisJSON using the [JSON.SET](https://redis.io/commands/json.set/) command:

```bash
127.0.0.1:6379> JSON.SET user:luser $ '{ "username": "luser", "firstName": "Lyle", "lastName": "User" }'
OK
```

Note that the JSON.SET command takes a JSON string. Since JSON strings are full of double-quotes, I always use single-quotes when providing this string. However, you *can* use double-quotes if you want, you just need to escape the inner quotes. Like this:

```bash
127.0.0.1:6379> JSON.SET user:luser $ "{ \"username\": \"luser\", \"firstName\": \"Lyle\", \"lastName\": \"User\" }"
OK
```

Probably not worth it.

Now, let's get our JSON string it using [JSON.GET](https://redis.io/commands/json.get/):

```bash
127.0.0.1:6379> JSON.GET user:luser
"{\"username\":\"luser\",\"firstName\":\"Lyle\",\"lastName\":\"User\",\"age\":35,\"admin\":false,\"occupation\":null}"
```

We can get individual properties from our JSON document too. Just provide the path to the property you want to to get in [JSONPath](https://redis.io/docs/stack/json/path/) syntax:

```bash
JSON.GET user:luser $.firstName
"[\"Lyle\"]"
```

Note that a JSON array is returned. This can seem annoying, but since a JSONPath query might return multiple items, RedisJSON needs to return arrays. For example, let's say we have a JSON document in Redis that looks like this:

```json
{
  "users": [
    { "userName": "luser", "firstName": "Lyle", "lastName": "User" },
    { "userName": "kuser", "firstName": "Kyle", "lastName": "User" },
    { "userName": "muser", "firstName": "Miles", "lastName": "User" }
  ]
}
```

If we queried it with a JSONPath of `$..userName`—which would return any property in the entire JSON document with the name of `userName`—we would get back an array of values.

In fact let's go ahead and try this out. Set the following JSON:

```bash
127.0.0.1:6379> JSON.SET bigfoot:users $ '{ "users": [ { "userName": "luser", "firstName": "Lyle", "lastName": "User" }, { "userName": "kuser", "firstName": "Kyle", "lastName": "User" }, { "userName": "muser", "firstName": "Miles", "lastName": "User" } ] }'
OK
```

And let's query it with the aforementioned query:

```bash
127.0.0.1:6379> JSON.GET bigfoot:users $..userName
"[\"luser\",\"kuser\",\"muser\"]"
```

That array is kinda handy now.

Of course, you can query arrays and objects as well:

```bash
127.0.0.1:6379> JSON.GET bigfoot:users $.users
"[[{\"userName\":\"luser\",\"firstName\":\"Lyle\",\"lastName\":\"User\"},{\"userName\":\"kuser\",\"firstName\":\"Kyle\",\"lastName\":\"User\"},{\"userName\":\"muser\",\"firstName\":\"Miles\",\"lastName\":\"User\"}]]"
127.0.0.1:6379> JSON.GET bigfoot:users $.users[0]
"[{\"userName\":\"luser\",\"firstName\":\"Lyle\",\"lastName\":\"User\"}]"
```

You can also get multiple properties by providing multiple paths:

```bash
127.0.0.1:6379> JSON.GET bigfoot:users $..firstName $..userName
"{\"$..firstName\":[\"Lyle\",\"Kyle\",\"Miles\"],\"$..userName\":[\"luser\",\"kuser\",\"muser\"]}"
```

Note that when you provide multiple paths, you get back an object with each of your queries as property names. The values in those properties are the arrays from that query.

In addition to getting properties on a document, we can also set properties. Just provide the path to the property you want to to set. If it does't exist, it will be created. If it does exist, it will be changed.

Since we've only be setting strings in our JSON, let's set some numbers and booleans:

```bash
127.0.0.1:6379> JSON.SET user:luser $.age 35
OK
127.0.0.1:6379> JSON.SET user:luser $.verified true
OK
127.0.0.1:6379> JSON.GET user:luser
"{\"username\":\"luser\",\"firstName\":\"Lyle\",\"lastName\":\"User\",\"age\":35,\"verified\":true}"
```

You can also set paths the match more than one property in a document. If you do, it will update everything that matches. Let's update all of our `lastName` properties:

```bash
127.0.0.1:6379> JSON.SET bigfoot:users $..lastName '"Userman"'
OK
127.0.0.1:6379> JSON.GET bigfoot:users
"{\"users\":[{\"userName\":\"luser\",\"firstName\":\"Lyle\",\"lastName\":\"Userman\"},{\"userName\":\"kuser\",\"firstName\":\"Kyle\",\"lastName\":\"Userman\"},{\"userName\":\"muser\",\"firstName\":\"Miles\",\"lastName\":\"Userman\"}]}"
```

Note the odd syntax here. The value we are setting is JSON. In order for a string to be valid JSON, it needs to be in quotes, double-quotes specifically. If we set a string in Redis, we need to put it in quotes. So, we wrap it in single-quotes. Strings in strings. Yo dawg.

We'll cover on last command here: [JSON.DEL](https://redis.io/commands/json.del/). As you might imagine, this deletes all or part of a JSON document based on a JSONPath. Let's delete a user from `bigfoot:users`:

```bash
127.0.0.1:6379> JSON.DEL bigfoot:users $.users[0]
(integer) 1
127.0.0.1:6379> JSON.GET bigfoot:users
"{\"users\":[{\"userName\":\"kuser\",\"firstName\":\"Kyle\",\"lastName\":\"Userman\"},{\"userName\":\"muser\",\"firstName\":\"Miles\",\"lastName\":\"Userman\"}]}"
```

Our first user, Lyle, has been removed.

If a JSONPath matches multiple properties in the doucment, everything matching will be removed. Let's remove the `lastName` property for all of our users:

```bash
127.0.0.1:6379> JSON.DEL bigfoot:users $.users[*].lastName
(integer) 2
127.0.0.1:6379> JSON.GET bigfoot:users
"{\"users\":[{\"userName\":\"kuser\",\"firstName\":\"Kyle\"},{\"userName\":\"muser\",\"firstName\":\"Miles\"}]}"
```

If we delete all of the propeties in the document, we have just an empty document:

```bash
127.0.0.1:6379> JSON.DEL bigfoot:users $.users
(integer) 1
127.0.0.1:6379> JSON.GET bigfoot:users
"{}"
```

If we want to remove the JSON document itself, we need to delete the root. Or just call delete without a path:

```bash
127.0.0.1:6379> JSON.DEL bigfoot:users $
(integer) 1
127.0.0.1:6379> JSON.GET bigfoot:users
(nil)
127.0.0.1:6379> JSON.DEL user:luser
(integer) 1
127.0.0.1:6379> JSON.GET user:luser
(nil)
```

That's plenty to get you started with RedisJSON. There are a [lots of additional](https://redis.io/commands/?group=json) to manipulate JSON documents in Redis. I encourage you to play around with them.

----------------------------------------

Next, we're going to [convert our Bigfoot Tracker API to use RedisJSON](15-HASHES-TO-JSON.md).
