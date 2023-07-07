# Using RediSearch #

[RediSearch](https://redis.io/docs/stack/search/) is a module that adds indexing and full-text search to Redis. You can use it to make your Hashes and JSON documents fully searchable. RediSearch is a *really* big topic and would probably be suitable as a workshop all its own. We're just going to cover the basics here so that we can finish up our Bigfoot Tracker API. If you'd like to know more, check out the [full search query syntax](https://redis.io/docs/stack/search/reference/query_syntax/) to see what you can do.

In the next few sections, we'll be using the [FT.CREATE](https://redis.io/commands/ft.create/) to create an index, [FT.SEARCH](https://redis.io/commands/ft.search/) to search, and [FT.DROPINDEX](https://redis.io/commands/ft.dropindex/) to delete an index. We'll also use [FT.INFO](https://redis.io/commands/ft.info/) to get information about our index and [FT._LIST](https://redis.io/commands/ft._list/) to get a list of existing indices.

## Loading Some Data ##

To really show off RediSearch, we need some data. Like, maybe, 4,586 Bigfoot sightings. We have all of those in the **`data/json`** folder but adding them one by one might be a *bit* tedious. So, I wrote a shell script to do it for you.

Make sure your Bigfoot Tracker API is running. Then, in another terminal and in the **`data`** folder, just run the `load-sightings.sh` script:

```bash
./load-sightings.sh
```

You should be rewards with a massive list of ULIDs and filenames. Like this:

```bash
./load-sightings.sh
{"id":"01G9HSR74GG3XMMT2T7X80FMVD"} <- json/bigfoot-sighting-10006.json
{"id":"01G9HSR753T26ZDBF8EP4B6YKF"} <- json/bigfoot-sighting-10012.json
{"id":"01G9HSR75HAFAMHB2JTN8YB89R"} <- json/bigfoot-sighting-10024.json
{"id":"01G9HSR75ZKNG5EMZ8QCXR61RG"} <- json/bigfoot-sighting-1003.json
{"id":"01G9HSR76DEQB0X7RK3TJ37K1T"} <- json/bigfoot-sighting-10034.json
{"id":"01G9HSR76TZ7ECDPN0JEZKQN4F"} <- json/bigfoot-sighting-10037.json
{"id":"01G9HSR778PWTJNR9E7A4PX69J"} <- json/bigfoot-sighting-10046.json
{"id":"01G9HSR77PMK0RTW57WVKPVD83"} <- json/bigfoot-sighting-1005.json
...
```

It might take a minute or two to run but when its done, you'll have plenty of Bigfoot sightings to play with.

## Creating Indices ##

Now that we have some data, let's create an index to use it. Take a look at the following command. In fact, go ahead and run it:

```bash
127.0.0.1:6379> FT.CREATE bigfoot:sighting:index
  ON JSON
  PREFIX 1 bigfoot:sighting:
  SCHEMA
    $.title AS title TEXT
    $.observed AS observed TEXT
    $.state AS state TAG
    $.classification AS classification TAG
    $.temperature_mid AS temperature_mid NUMERIC
    $.location AS location GEO
OK
```

This creates an index named `bigfoot:sighting:index`. If you look for this index in your keyspace, you won't find it. But if you use the FT._LIST command, you will. Go ahead and try it:

```bash
127.0.0.1:6379> FT._LIST
1) "bigfoot:sighting:index"
```

Yep. There it is.

Immediately after we specify the name of the index, we can provide the data structure that RediSearch can index. RediSearch can index both JSON documents and Hashes, specified by adding either `ON JSON` or `ON HASH`. If this is not specified, it defaults to `ON HASH`.

After specifying the data structure, we can provide one or more keyspaces for this index to, well, index. Whenever a change in made in this keyspace, our index is updated automatically and atomically with the change. We have specified `PREFIX 1 bigfoot:sighting:` so we'll look at any JSON document that starts with `bigfoot:sighting:`. The `1` tells Redis that we only have one prefix. If we had more, it might look like this:

```
PREFIX 3 bigfoot:sighting: ufo:sighting: ghost:sighting:
```

Then, we specify the schema for the index. This tells RediSearch how to index our data. Each section in the schema tells Redis three things.

The first is the location of the field. This is the JSONPath to the field if we are indexing JSON documents or just the name of the field if we are indexing Hashes.

Next, is an optional alias to use when we search with the index later. With Hashes, this is only mildly useful. But with JSON documents, this allows us to rename something like `$.foo.bar[*].baz` to `baz`.

Third and lastly, we tell Redis the type of data that is stored at that location. Valid types a TEXT, TAG, NUMERIC, and GEO. We'll cover these more later when we search on them.

## Removing Indices ##

If for some reason we don't like our index, we can always remove it using FT.DROPINDEX. Go ahead an remove the index:

```bash
127.0.0.1:6379> FT.DROPINDEX bigfoot:sighting:index
OK
```

A quick check of the indices will confirm it is removed:

```bash
127.0.0.1:6379> FT._LIST
(empty array)
```

And it's gone! Of course, we *want* our index, `cuz we're gonna search against it. So go ahead and recreate it:

```bash
127.0.0.1:6379> FT.CREATE bigfoot:sighting:index
  ON JSON
  PREFIX 1 bigfoot:sighting:
  SCHEMA
    $.title AS title TEXT
    $.observed AS observed TEXT
    $.state AS state TAG
    $.classification AS classification TAG
    $.temperature_mid AS temperature_mid NUMERIC
    $.location AS location GEO
OK
```

## Searching Indices ##

We search our index using the FT.SEARCH command. The simplest of searches is a search for everything. Go ahead and try it out:

```bash
127.0.0.1:6379> FT.SEARCH bigfoot:sighting:index *
 1) (integer) 4586
 2) "bigfoot:sighting:01G9HSS0HBED8CZR84RN32GQ89"
 3) 1) "$"
    2) "{\"id\":\"01G9HSS0HBED8CZR84RN32GQ89\",\"reportId\":\"27167\",\"title\":\"\",\"date\":\"\",\"observed\":\"\",\"classification\":\"Class A\",\"county\":\"Marshall\",\"state\":\"Mississippi\",\"location_details\":\"\",\"summary\":\"\"}"
 4) "bigfoot:sighting:01G9HSRRMTXMX7WDM0S4XS1YAQ"
 5) 1) "$"
    2) "{\"id\":\"01G9HSRRMTXMX7WDM0S4XS1YAQ\",\"reportId\":\"22852\",\"title\":\"\",\"date\":\"\",\"observed\":\"\",\"classification\":\"Class B\",\"county\":\"White\",\"state\":\"Georgia\",\"location_details\":\"[Exact location omitted] on the Appalachian trail\",\"summary\":\"\"}"
 6) "bigfoot:sighting:01G9HSSHBG3X799TKWSWXE128J"
 7) 1) "$"
    2) "{\"id\":\"01G9HSSHBG3X799TKWSWXE128J\",\"reportId\":\"44350\",\"title\":\"\",\"date\":\"\",\"observed\":\"\",\"classification\":\"Class B\",\"county\":\"Jefferson\",\"state\":\"Pennsylvania\",\"location_details\":\"On the night before that I believe the tracks were made, it was heavy snow pack, and there was very lite flurries and a little blowing, over night, with temp somewhere I think -5. The morning when I seen the tracks it was about 7, I believe/remember from TV News.\",\"summary\":\"\"}"
 8) "bigfoot:sighting:01G9HSSAKBP8DJQBFK0A62QVG3"
 9) 1) "$"
    2) "{\"id\":\"01G9HSSAKBP8DJQBFK0A62QVG3\",\"reportId\":\"3629\",\"title\":\"\",\"date\":\"\",\"observed\":\"\",\"classification\":\"Class A\",\"county\":\"Cassia\",\"state\":\"Idaho\",\"location_details\":\"i can take you to the spot that i saw it. it was off the road a ways and the road are just dirt and logging roads. it was walking up a revien when i smelled it\",\"summary\":\"\"}"
10) "bigfoot:sighting:01G9HSRFRAAS9W8MWBXNQ87C2F"
11) 1) "$"
    2) "{\"id\":\"01G9HSRFRAAS9W8MWBXNQ87C2F\",\"reportId\":\"14887\",\"title\":\"Possible sighting, vocalizations, stalking, etc., near Sweetwater Creek\",\"date\":\"2006-07-05\",\"timestamp\":1152057600,\"observed\":\"\",\"classification\":\"Class B\",\"county\":\"Paulding\",\"state\":\"Georgia\",\"latitude\":33.81283,\"longitude\":-84.80283,\"location\":\"-84.80283,33.81283\",\"location_details\":\"From Hwy 92 going south through Hiram, GA, you will come to Ridge Rd.  Turn right at the light. Go a few miles just past a baseball field on the right. Once you pass this it will be the next street (not subdivision) on the left. This is Austin Bridge Rd. Go down about a half mile to a subdivision called Austin Meadows.  (Exact location removed at request of witness.)\",\"temperature_high\":88.91,\"temperature_mid\":80.17,\"temperature_low\":71.43,\"dew_point\":68.41,\"humidity\":0.73,\"cloud_cover\":0.43,\"moon_phase\":0.31,\"precip_intensity\":0.0075,\"precip_probability\":0.48,\"precip_type\":\"rain\",\"pressure\":1015.9,\"summary\":\"Partly cloudy throughout the day.\",\"uv_index\":10,\"visibility\":6.83,\"wind_bearing\":341,\"wind_speed\":1}"
12) "bigfoot:sighting:01G9HSRW2EHRWB2XRH4PT8QV2R"
13) 1) "$"
    2) "{\"id\":\"01G9HSRW2EHRWB2XRH4PT8QV2R\",\"reportId\":\"24646\",\"title\":\"Early morning sighting by a fisherman south of Montgomery\",\"date\":\"2001-04-13\",\"timestamp\":987120000,\"observed\":\"\",\"classification\":\"Class A\",\"county\":\"Lowndes\",\"state\":\"Alabama\",\"latitude\":32.184,\"longitude\":-86.581,\"location\":\"-86.581,32.184\",\"location_details\":\"South of Montgomery , Al near the town of Hayneville at a small fishing club with about 5 pond/ lakes around more details available if interested\",\"temperature_high\":81.87,\"temperature_mid\":71.63,\"temperature_low\":61.39,\"dew_point\":69.41,\"humidity\":0.84,\"cloud_cover\":0.6,\"moon_phase\":0.69,\"precip_intensity\":0.0035,\"precip_probability\":0.84,\"precip_type\":\"rain\",\"pressure\":1018.23,\"summary\":\"Mostly cloudy throughout the day.\",\"uv_index\":7,\"visibility\":8.34,\"wind_bearing\":241,\"wind_speed\":5.99}"
14) "bigfoot:sighting:01G9HSRXK1FG9BNZBP3H7H2X86"
15) 1) "$"
    2) "{\"id\":\"01G9HSRXK1FG9BNZBP3H7H2X86\",\"reportId\":\"25444\",\"title\":\"High school teacher recalls a nighttime sighting while camping in the Los Padres National Forest\",\"date\":\"1982-04-15\",\"timestamp\":387676800,\"observed\":\"\",\"classification\":\"Class A\",\"county\":\"Santa Barbara\",\"state\":\"California\",\"latitude\":34.73389,\"longitude\":-119.9254,\"location\":\"-119.9254,34.73389\",\"location_details\":\"we were near the confluence of the sisquac and manzanita rivers in the wilderness area where access is only made by horseback or on foot; we were on foot.\",\"temperature_high\":62.01,\"temperature_mid\":52.175,\"temperature_low\":42.34,\"dew_point\":42.68,\"humidity\":0.66,\"cloud_cover\":0.2,\"moon_phase\":0.73,\"precip_intensity\":0,\"precip_probability\":0,\"pressure\":1015.82,\"summary\":\"Partly cloudy until afternoon.\",\"uv_index\":9,\"visibility\":9.02,\"wind_bearing\":312,\"wind_speed\":9.55}"
16) "bigfoot:sighting:01G9HSSNGN5QTYGQC40NRS908H"
17) 1) "$"
    2) "{\"id\":\"01G9HSSNGN5QTYGQC40NRS908H\",\"reportId\":\"49621\",\"title\":\"Teen recounts possible encounter while walking in a Lansing city park\",\"date\":\"2015-04-01\",\"timestamp\":1427846400,\"observed\":\"\",\"classification\":\"Class B\",\"county\":\"Ingham\",\"state\":\"Michigan\",\"latitude\":42.75195,\"longitude\":-81.52805,\"location\":\"-81.52805,42.75195\",\"location_details\":\"It happened in Bancroft park in Lansing\",\"temperature_high\":45.33,\"temperature_mid\":40.395,\"temperature_low\":35.46,\"dew_point\":30.78,\"humidity\":0.81,\"cloud_cover\":0.24,\"moon_phase\":0.41,\"precip_intensity\":0,\"precip_probability\":0,\"pressure\":1018.5,\"summary\":\"Partly cloudy until afternoon.\",\"uv_index\":5,\"visibility\":8.33,\"wind_bearing\":135,\"wind_speed\":4.13}"
18) "bigfoot:sighting:01G9HSSDJ4JKDDK9H0YFYWPYJ1"
19) 1) "$"
    2) "{\"id\":\"01G9HSSDJ4JKDDK9H0YFYWPYJ1\",\"reportId\":\"40106\",\"title\":\"Possible daylight sighting by a motorist near Mio.\",\"date\":\"2013-03-12\",\"timestamp\":1363046400,\"observed\":\"\",\"classification\":\"Class B\",\"county\":\"Oscoda\",\"state\":\"Michigan\",\"latitude\":44.68,\"longitude\":-84.01165,\"location\":\"-84.01165,44.68\",\"location_details\":\"Most would immediately say \\\"I can draw it!\\\" The encounter was incredible in broad day ight! There was NO question in my mind with what I had encountered. The significant part of my sighting was I saw this in between an open 6ft. spaced groupings of pine trees.....this creature was alarmed when spotted. Darted. Others claim aggressiveness!? In my situation, this thing couldn't get away fast enough!\",\"temperature_high\":29.44,\"temperature_mid\":24.725,\"temperature_low\":20.01,\"dew_point\":25.22,\"humidity\":0.84,\"cloud_cover\":0.99,\"moon_phase\":0.03,\"precip_intensity\":0.0013,\"precip_probability\":0.38,\"precip_type\":\"snow\",\"pressure\":1006.38,\"summary\":\"Overcast throughout the day.\",\"uv_index\":2,\"visibility\":6.78,\"wind_bearing\":254,\"wind_speed\":9.91}"
20) "bigfoot:sighting:01G9HSRDT6CZZVTDN5KRWXY19N"
21) 1) "$"
    2) "{\"id\":\"01G9HSRDT6CZZVTDN5KRWXY19N\",\"reportId\":\"13613\",\"title\":\"Hikers find footprints, hear sounds, etc., near Leavitt Meadows\",\"date\":\"1980-08-01\",\"timestamp\":333936000,\"observed\":\"\",\"classification\":\"Class B\",\"county\":\"Mono\",\"state\":\"California\",\"latitude\":38.29165,\"longitude\":-119.54,\"location\":\"-119.54,38.29165\",\"location_details\":\"From Leavitt meadows campground: Hike S ~5 mi to Roosevelt & Lane Lakes (connected by narrow stream); At W end of Lane Lake vocalization occurred;  Directly S of Lake is an estabished primitive campsite (area) just E of River & S of Lake. From Campsite Hike SE ~1 mi (past glacier) to top of ridgeline/cliffs to ~1000'+ elev from campsite. \\\"Skunk\\\" odiferous canyon (steep ravine) is just S of Marine Corps Helicopter crash site.\",\"temperature_high\":97.37,\"temperature_mid\":79.465,\"temperature_low\":61.56,\"dew_point\":49.53,\"humidity\":0.33,\"cloud_cover\":0.23,\"moon_phase\":0.68,\"precip_intensity\":0,\"precip_probability\":0,\"pressure\":1012.4,\"summary\":\"Partly cloudy in the morning.\",\"uv_index\":11,\"visibility\":9.91,\"wind_bearing\":296,\"wind_speed\":3.43}"
```

Redis returns a lot of data back. The very first thing is the total number of items that matched out query: 4,586 in our case. After that, you get the keyname followed by the contents of that key. The contents for a Hash would be a series of field names followed by values. But for JSON, the "field name" is just `$` and then "value" is the JSON text.

You might have noticed that we only got 10 results back but we have 4,586 total results. The call to FT.SEARCH has a default limit of `10`. You can override this and paginate the results using the `LIMIT` option. Try just getting five results:

```bash
127.0.0.1:6379> FT.SEARCH bigfoot:sighting:index * LIMIT 0 5
 1) (integer) 4586
 2) "bigfoot:sighting:01G9HSS0HBED8CZR84RN32GQ89"
 3) 1) "$"
    2) "{\"id\":\"01G9HSS0HBED8CZR84RN32GQ89\",\"reportId\":\"27167\",\"title\":\"\",\"date\":\"\",\"observed\":\"\",\"classification\":\"Class A\",\"county\":\"Marshall\",\"state\":\"Mississippi\",\"location_details\":\"\",\"summary\":\"\"}"
 4) "bigfoot:sighting:01G9HSRRMTXMX7WDM0S4XS1YAQ"
 5) 1) "$"
    2) "{\"id\":\"01G9HSRRMTXMX7WDM0S4XS1YAQ\",\"reportId\":\"22852\",\"title\":\"\",\"date\":\"\",\"observed\":\"\",\"classification\":\"Class B\",\"county\":\"White\",\"state\":\"Georgia\",\"location_details\":\"[Exact location omitted] on the Appalachian trail\",\"summary\":\"\"}"
 6) "bigfoot:sighting:01G9HSSHBG3X799TKWSWXE128J"
 7) 1) "$"
    2) "{\"id\":\"01G9HSSHBG3X799TKWSWXE128J\",\"reportId\":\"44350\",\"title\":\"\",\"date\":\"\",\"observed\":\"\",\"classification\":\"Class B\",\"county\":\"Jefferson\",\"state\":\"Pennsylvania\",\"location_details\":\"On the night before that I believe the tracks were made, it was heavy snow pack, and there was very lite flurries and a little blowing, over night, with temp somewhere I think -5. The morning when I seen the tracks it was about 7, I believe/remember from TV News.\",\"summary\":\"\"}"
 8) "bigfoot:sighting:01G9HSSAKBP8DJQBFK0A62QVG3"
 9) 1) "$"
    2) "{\"id\":\"01G9HSSAKBP8DJQBFK0A62QVG3\",\"reportId\":\"3629\",\"title\":\"\",\"date\":\"\",\"observed\":\"\",\"classification\":\"Class A\",\"county\":\"Cassia\",\"state\":\"Idaho\",\"location_details\":\"i can take you to the spot that i saw it. it was off the road a ways and the road are just dirt and logging roads. it was walking up a revien when i smelled it\",\"summary\":\"\"}"
10) "bigfoot:sighting:01G9HSRFRAAS9W8MWBXNQ87C2F"
11) 1) "$"
    2) "{\"id\":\"01G9HSRFRAAS9W8MWBXNQ87C2F\",\"reportId\":\"14887\",\"title\":\"Possible sighting, vocalizations, stalking, etc., near Sweetwater Creek\",\"date\":\"2006-07-05\",\"timestamp\":1152057600,\"observed\":\"\",\"classification\":\"Class B\",\"county\":\"Paulding\",\"state\":\"Georgia\",\"latitude\":33.81283,\"longitude\":-84.80283,\"location\":\"-84.80283,33.81283\",\"location_details\":\"From Hwy 92 going south through Hiram, GA, you will come to Ridge Rd.  Turn right at the light. Go a few miles just past a baseball field on the right. Once you pass this it will be the next street (not subdivision) on the left. This is Austin Bridge Rd. Go down about a half mile to a subdivision called Austin Meadows.  (Exact location removed at request of witness.)\",\"temperature_high\":88.91,\"temperature_mid\":80.17,\"temperature_low\":71.43,\"dew_point\":68.41,\"humidity\":0.73,\"cloud_cover\":0.43,\"moon_phase\":0.31,\"precip_intensity\":0.0075,\"precip_probability\":0.48,\"precip_type\":\"rain\",\"pressure\":1015.9,\"summary\":\"Partly cloudy throughout the day.\",\"uv_index\":10,\"visibility\":6.83,\"wind_bearing\":341,\"wind_speed\":1}"
```

The `LIMIT` option takes a starting point within the results and a total number of results to return. So, to get the fifth result you would enter:

```bash
FT.SEARCH bigfoot:sighting:index * LIMIT 4 1
```

If you tell limit to return zero items, you will get only the count of items that match your query:

```bash
127.0.0.1:6379> FT.SEARCH bigfoot:sighting:index * LIMIT 0 0
1) (integer) 4586
```

You can also specify what fields you want returned with the `RETURN` option:

```bash
127.0.0.1:6379> FT.SEARCH bigfoot:sighting:index * RETURN 2 $.id $.title
 1) (integer) 4586
 2) "bigfoot:sighting:01G9HSS0HBED8CZR84RN32GQ89"
 3) 1) "$.id"
    2) "01G9HSS0HBED8CZR84RN32GQ89"
    3) "$.title"
    4) ""
 4) "bigfoot:sighting:01G9HSRRMTXMX7WDM0S4XS1YAQ"
 5) 1) "$.id"
    2) "01G9HSRRMTXMX7WDM0S4XS1YAQ"
    3) "$.title"
    4) ""
 6) "bigfoot:sighting:01G9HSSHBG3X799TKWSWXE128J"
 7) 1) "$.id"
    2) "01G9HSSHBG3X799TKWSWXE128J"
    3) "$.title"
    4) ""
 8) "bigfoot:sighting:01G9HSSAKBP8DJQBFK0A62QVG3"
 9) 1) "$.id"
    2) "01G9HSSAKBP8DJQBFK0A62QVG3"
    3) "$.title"
    4) ""
10) "bigfoot:sighting:01G9HSRFRAAS9W8MWBXNQ87C2F"
11) 1) "$.id"
    2) "01G9HSRFRAAS9W8MWBXNQ87C2F"
    3) "$.title"
    4) "Possible sighting, vocalizations, stalking, etc., near Sweetwater Creek"
12) "bigfoot:sighting:01G9HSRW2EHRWB2XRH4PT8QV2R"
13) 1) "$.id"
    2) "01G9HSRW2EHRWB2XRH4PT8QV2R"
    3) "$.title"
    4) "Early morning sighting by a fisherman south of Montgomery"
14) "bigfoot:sighting:01G9HSRXK1FG9BNZBP3H7H2X86"
15) 1) "$.id"
    2) "01G9HSRXK1FG9BNZBP3H7H2X86"
    3) "$.title"
    4) "High school teacher recalls a nighttime sighting while camping in the Los Padres National Forest"
16) "bigfoot:sighting:01G9HSSNGN5QTYGQC40NRS908H"
17) 1) "$.id"
    2) "01G9HSSNGN5QTYGQC40NRS908H"
    3) "$.title"
    4) "Teen recounts possible encounter while walking in a Lansing city park"
18) "bigfoot:sighting:01G9HSSDJ4JKDDK9H0YFYWPYJ1"
19) 1) "$.id"
    2) "01G9HSSDJ4JKDDK9H0YFYWPYJ1"
    3) "$.title"
    4) "Possible daylight sighting by a motorist near Mio."
20) "bigfoot:sighting:01G9HSRDT6CZZVTDN5KRWXY19N"
21) 1) "$.id"
    2) "01G9HSRDT6CZZVTDN5KRWXY19N"
    3) "$.title"
    4) "Hikers find footprints, hear sounds, etc., near Leavitt Meadows"
```

The `2` in the above command is similar to the number in the `PREFIX` option of `FT.CREATE`—it tells Redis how many arguments to expect. Interestingly, you can tell Redis to return `0` fields.

```bash
127.0.0.1:6379> FT.SEARCH bigfoot:sighting:index * RETURN 0
 1) (integer) 4586
 2) "bigfoot:sighting:01G9HSS0HBED8CZR84RN32GQ89"
 3) "bigfoot:sighting:01G9HSRRMTXMX7WDM0S4XS1YAQ"
 4) "bigfoot:sighting:01G9HSSHBG3X799TKWSWXE128J"
 5) "bigfoot:sighting:01G9HSSAKBP8DJQBFK0A62QVG3"
 6) "bigfoot:sighting:01G9HSRFRAAS9W8MWBXNQ87C2F"
 7) "bigfoot:sighting:01G9HSRW2EHRWB2XRH4PT8QV2R"
 8) "bigfoot:sighting:01G9HSRXK1FG9BNZBP3H7H2X86"
 9) "bigfoot:sighting:01G9HSSNGN5QTYGQC40NRS908H"
10) "bigfoot:sighting:01G9HSSDJ4JKDDK9H0YFYWPYJ1"
11) "bigfoot:sighting:01G9HSRDT6CZZVTDN5KRWXY19N"
```

When you do this, you just get the key names back.

----------------------------------------

That's the basics of the basics. Now, let's see [how to search on common field types](17-REDISEARCH-TEXT-AND-TAG.md).
