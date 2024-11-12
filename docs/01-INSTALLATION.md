# Installing Redis Community Edition & RedisInsight

We'll be using a bleeding-edge version of Redis—[Redis 8 Milestone 2](https://redis.io/blog/redis-8-0-m02-the-fastest-redis-ever/)—for this workshop. Redis 8 includes the Redis that you know and love plus several modules that extend its capabilities. More on modules later.

We'll also be using [RedisInsight](https://redis.io/docs/stack/insight/) which is a graphical client for Redis. We'll use it to issue commands and browse our database.

## Installing Redis 8 Using Docker

Installing with Docker is pretty easy. Just run the following command:

```bash
docker run -d --name redis -p 6379:6379 redis:8.0-M02
```

And that's it. You now have Redis 8 installed and running.

## Installing RedisInsight

RedisInsight is available for download from:

- **Microsoft Store**: https://apps.microsoft.com/detail/xp8k1ghcb0f1r2
- **Apple's App Store**: https://apps.apple.com/us/app/redis-insight/id6446987963
- **Directly from Redis**: https://redis.io/insight/

Download, run, and follow the instructions.

## Running Your First Command

Let's confirm that the installation of Redis Stack is working by entering our first command from RedisInsight.

- [ ] Select workbench on the left naviagtion bar to access the command-line console.

- [ ] Enter `PING` into the console and click the play button.

- [ ] Observe the `PONG` in response.

![](images/redisinsight-ping.png)

## Next Steps

I'm gonna be giving you a lot of Redis commands. Don't expect screenshots all the time, as they're kind of a pain for me make and hard for you to copy and paste from. So, instead, future command-line examples will often be presented in the following format:

```
127.0.0.1:6379> PING
PONG
```

This is the format used by `redis-cli`, a command-line client for Redis.

And that's it. Now, let's start looking at some [Redis basics](02-REDIS-BASICS.md).
