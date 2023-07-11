# Installing Redis Stack & RedisInsight #

We'll be using [Redis Stack](https://redis.io/docs/stack/) for our flavor of Redis. Redis Stack includes the OSS Redis that you know and love plus several modules that extend it's capabilities. More on modules later.

We'll also be using [RedisInsight](https://redis.io/docs/stack/insight/) which is a graphical client for Redis. We'll use it to issue commands and browse our database.


## Installing Using Docker ##

Installing with Docker is pretty easy. Just run the following command:

```bash
docker run -d --name redis-stack -p 6379:6379 -p 8001:8001 redis/redis-stack:latest
```

And that's it. You now have Redis Stack installed and running. *And* you now have RedisInsight running too. To use it, just point your browser at http://localhost:8001 and browse your database.


## Running Your First Command ##

Let's confirm that the installation of Redis Stack is working by entering our first command from RedisInsight.

- [ ] Select workbench on the left naviagtion bar to access the command-line console.

- [ ] Enter `PING` into the console and click the play button.

- [ ] Observe the `PONG` in response.

![](images/redisinsight-ping.png)


## Next Steps ##

I'm gonna be giving you a lot of Redis commands. Don't expect screenshots all the time, as they're kind of a pain for me make and hard for you to copy and paste from. So, instead, future command-line examples will often be presented in the following format:

```
127.0.0.1:6379> PING
PONG
```

This is the format used by `redis-cli`, the command-line client that ships with OSS Redis.

And that's it. Now, let's start looking at some [Redis basics](02-REDIS-BASICS.md).
