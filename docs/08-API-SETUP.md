# Using Redis from Node.js #

We're gonna build a simple Express API. All the Express stuff is already there so don't worry about that. We'll just focus on endpoints that do things.


## Cloning the Repo ##

If you haven't cloned this repo yet, do so. You're gonna need it:

```bash
git clone git@github.com:guyroyse/beyond-the-cache.git
```

Note the folders:

- **`data`**: Contains sample Bigfoot Tracker data we can load into Redis and a shell script to load it.
- **`docs`**: Contains all the instructions for the workshop. You are reading them right now.
- **`slides`**: Contains the slides I'll be presenting during the workshop.
- **`solution`**: This is the folder that contains the completed API that you'll be creating. If you get stuck and need to see the answer (i.e. cheat) this is where you can do it.
- **`src`**: This is the folder you will be working from. Change into here to run the application.

The rest of the instructions will assume that you are in the `src` folder. So, do this:

```bash
cd src
```


## Make Sure You Have Node.js Installed ##

This is the _Beyond the Cache with Redis + **Node.js**_ workshop. We've installed Redis. Now you need Node.js. I'm gonna assume that you are able to [download and install](https://nodejs.org/en/) Node.js yourself. You might even have it installed already.

However, I took advantage of the [top-level await](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await#top_level_await) feature in newer versions of JavaScript. So, you'll need to use a version of Node.js that supports that. Specifically, that would be 14.8 or later. I used version 16.16, which is listed in the `.nvmrc` file.

Speaking of the `.nvmrc` file, I like to use [`nvm`](https://github.com/nvm-sh/nvm). It's a tidy way to manage various Node.js versions on my machine. And, if you use `nvm` you can just enter:

```bash
nvm install `cat .nvmrc`
```

That installs the version of Node.js I used. And then tell `nvm` to use it:

```bash
nvm use
```

But you don't have to do that. Install Node.js however you want as long as it's version 14.8 or later. Don't let me tell you how to live your life.


## Configure the API ##

The API is configured using [dotenv](https://www.npmjs.com/package/dotenv) so you need a `.env` file in that contains that configuration. In the root of the folder, there's a `sample.env` file. Copy that file to `.env` and make some changes:

```bash
cp sample.env .env
```

Open this file. If you are running Redis Stack via Docker, the default setting should be fine. If you installed it some other way or had to use a different port or something, update the `REDIS_HOST`, `REDIS_PORT`, and `REDIS_PASSWORD` values to match the values you are using.

By default, the file has the API listening port port 8080. If this won't work for you, feel free to change it by updating the `SERVER_PORT`,


## Installing Packages ##

You also need to install all the Node.js packages the application uses. Packages like Node Redis. You know, the things this workshop is showing you how to use.

You probably know what happens next, but just in case:

```bash
npm install
```


## First Run ##

You have Redis and Node.js. You have the code. Everything is configured and installed. You should be able to run the application. So let's do that:

```bash
npm start
```

You should see:

```
> bigfoot-tracker-api@1.0.0 start
> nodemon --inspect ./server.js

[nodemon] 2.0.19
[nodemon] to restart at any time, enter `rs`
[nodemon] watching path(s): *.*
[nodemon] watching extensions: js,mjs,json
[nodemon] starting `node --inspect ./server.js`
Debugger listening on ws://127.0.0.1:9229/1a6c17e9-2a1c-4bcc-907f-6bf991373448
For help, see: https://nodejs.org/en/docs/inspector
👣 Bigfoot Tracker API ready at http://localhost:8080. 👣
```

It's up and running. Give it a quick test pointing your browser at http://localhost:8080. You should see a simple JSON response of:

```json
{
  "hello": "world"
}
```

Now that's it's running, let's take a look at some of the code we've just run and learn the [basics of Node Redis](09-NODE-REDIS-BASICS.md).
