# Searching TEXT and TAG Fields #

TEXT and TAG fields together allow you to perform most of the types of searches against strings that you'd want to do. TEXT fields provide full-text search so you can find words within blocks of texts. Tags act as keys or collections of keys that match on an entire value.

## Searching TEXT Fields ##

A TEXT field in Redis search indicates a field that contains human-readable text that we want to perform full-text search against. TEXT fields understand related words using a process called *stemming*. So RediSearch knows that a search for `give` should match text with `gives`, `gave`, `given`, and `giving`. TEXT fields also know that certain words—called *stopwords*—are common and not useful for search. Thus, words like `a`, `and`, and `the` are ignored when searching TEXT fields.

By default, RediSearch will search all text fields in the index. Let's find some Bigfoot sightings with the word `creek` in any TEXT field:

```bash
127.0.0.1:6379> FT.SEARCH bigfoot:sighting:index creek RETURN 0
 1) (integer) 669
 2) "bigfoot:sighting:01G9HSRFRAAS9W8MWBXNQ87C2F"
 3) "bigfoot:sighting:01G9HSRTGFYST26ZEY3JEM6ZT9"
 4) "bigfoot:sighting:01G9HSRR815TDYDF9CG69N2GE8"
 5) "bigfoot:sighting:01G9HSSAJXCAYBJJBXDFFAKM35"
 6) "bigfoot:sighting:01G9HSR97XJF0ZFDN89DRBMYVD"
 7) "bigfoot:sighting:01G9HSRYA6956XAE123A3N1YMY"
 8) "bigfoot:sighting:01G9HSS66A0DY4JB8M2CPWYXDP"
 9) "bigfoot:sighting:01G9HSS3D21Y5BF6V32HTN1TW7"
10) "bigfoot:sighting:01G9HSSJ5DBT3XYPGBYSNHW36H"
11) "bigfoot:sighting:01G9HSRNQ0E24FF71C243NA4NQ"
```

Looks like we got quite a few. Turns out there are a lot of creeks in the woods.

To search a specific field, prefix it with the field name. Let's look for Bigfoot sightings with the word `creek` in the `title`:

```bash
127.0.0.1:6379> FT.SEARCH bigfoot:sighting:index @title:creek RETURN 0
 1) (integer) 105
 2) "bigfoot:sighting:01G9HSRFRAAS9W8MWBXNQ87C2F"
 3) "bigfoot:sighting:01G9HSR97XJF0ZFDN89DRBMYVD"
 4) "bigfoot:sighting:01G9HSRYA6956XAE123A3N1YMY"
 5) "bigfoot:sighting:01G9HSS66A0DY4JB8M2CPWYXDP"
 6) "bigfoot:sighting:01G9HST2ERPCMGVVSCY429NFVP"
 7) "bigfoot:sighting:01G9HSSVG2H0H6G3302ESHQFNG"
 8) "bigfoot:sighting:01G9HSSBEK06GD4FR29NH37R4Q"
 9) "bigfoot:sighting:01G9HST1M99BN2VDH27RDT3AJV"
10) "bigfoot:sighting:01G9HSRPA24RMQAF0X5D2KQPFJ"
11) "bigfoot:sighting:01G9HSSBDRCTD3WW8NYT6TC8GT"
```

So far, our queries haven't used quotes. But it's usually needed for anything beyond the most basic searches. Let's search for Bigfoot sightings with the word `creek` in the `title` and `woods` in the `observed`:

```bash
127.0.0.1:6379> FT.SEARCH bigfoot:sighting:index "@title:creek @observed:woods" RETURN 0
 1) (integer) 45
 2) "bigfoot:sighting:01G9HSS32Y030EMK2AHGTG97TF"
 3) "bigfoot:sighting:01G9HSS66A0DY4JB8M2CPWYXDP"
 4) "bigfoot:sighting:01G9HSSD068FVBEDCEKAR90E11"
 5) "bigfoot:sighting:01G9HSRAMMNVR7212JGAC9S4AK"
 6) "bigfoot:sighting:01G9HSRN4NVY2AYHGH194M53ZN"
 7) "bigfoot:sighting:01G9HSSNMEVB4BGJH1M03BME75"
 8) "bigfoot:sighting:01G9HSS28YME96PQGCQT24CY7H"
 9) "bigfoot:sighting:01G9HST2ERPCMGVVSCY429NFVP"
10) "bigfoot:sighting:01G9HSSG2E9RTH7B8676595N76"
11) "bigfoot:sighting:01G9HSS67ZGGS7ANYAGZK7DZTQ"
```

## Searching TAG Fields ##

TAG fields represent a single string or a collection of strings. They are stored in Hashes and JSON as comma-delimited strings like:

```
Ohio,West Virginia,Kentucky
```

In JSON, they can also be stored as any JSONPath that would return an array of strings. For example, look at the following JSON:

```json
{
  "reportId": "1234",
  "counties": [
    {
      "county": "Athens",
      "state": "Ohio"
    },
    {
      "county": "Boone",
      "state": "West Virginia"
    },
    {
      "county": "Flemming ",
      "state": "Kentucky"
    }
  ]
}
```

You could create a TAG field with a JSONPath of `$.bigfootState[*].state`.

You can think of TAGs as the tags clouds on a blog. You can search for JSON documents and Hashes that contain a specific value within that TAG. So, you could search for `Ohio` and any document tagged with `Ohio` will be returned.

If you provide only a single values in a TAG, it can make an excellent key—foreign or primary. In the above JSON, you can specify a TAG field for the `reportId` property with a JSONPath of `$.reportId`.

You can search on a TAG field using the following syntax:

```bash
FT.SEARCH bigfoot:sighting:index "@state:{Ohio}" RETURN 0
 1) (integer) 257
 2) "bigfoot:sighting:01G9HSSNN8XM2QBJF1P0P6NFZQ"
 3) "bigfoot:sighting:01G9HSRTZ55Z55Q69R2DG9DWAF"
 4) "bigfoot:sighting:01G9HSSP8WHJRCZQ4Z270CS36V"
 5) "bigfoot:sighting:01G9HSRJ1B454H8S1HPFAEW5V0"
 6) "bigfoot:sighting:01G9HSSBQKKVPP7CYZMXXARM41"
 7) "bigfoot:sighting:01G9HSSGAYRG295WPR7TYWNVN3"
 8) "bigfoot:sighting:01G9HSSNSGAJ8SNK7R6S1WJ9CA"
 9) "bigfoot:sighting:01G9HSSG97AVJ9R1TB9X9TKC2Q"
10) "bigfoot:sighting:01G9HSSJD1GHYYMTMDFJEWW0AD"
11) "bigfoot:sighting:01G9HSSNFTE9W8MQ3EVTHPSY6J"
```

If you want to search on TAGs that contain whitespace, be sure to escape it with backslashes:

```bash
127.0.0.1:6379> FT.SEARCH bigfoot:sighting:index "@state:{West\\ Virginia}" RETURN 0
 1) (integer) 99
 2) "bigfoot:sighting:01G9HSS511R305GDJG3NBAJD57"
 3) "bigfoot:sighting:01G9HSRAXN7560P70XYFQTC0DR"
 4) "bigfoot:sighting:01G9HSSFDKPG3XW1C7ZD44XYEV"
 5) "bigfoot:sighting:01G9HSRAYE6JVDE1BF87VBNRJ8"
 6) "bigfoot:sighting:01G9HSSY7V9C2GJE2ZA3YYN8QW"
 7) "bigfoot:sighting:01G9HSRATT7PKKMHCDMA5K9G6G"
 8) "bigfoot:sighting:01G9HSRAX8RHJT94FRMXGQ2AEZ"
 9) "bigfoot:sighting:01G9HSRWTY6YZHJSJWGYZ2MPZB"
10) "bigfoot:sighting:01G9HSRCD3JN3ZJP64Z5TW208X"
11) "bigfoot:sighting:01G9HSS0RWA4QC6B084FT5V9TJ"
```

You can search on documents tagged with one value *or* another with a `|`:

```bash
127.0.0.1:6379> FT.SEARCH bigfoot:sighting:index "@state:{Ohio|Kentucky}" RETURN 0
 1) (integer) 365
 2) "bigfoot:sighting:01G9HSSHXK5ARH3PMSDW79MVXT"
 3) "bigfoot:sighting:01G9HSSCQDZ03NQY6RCDT21BZ1"
 4) "bigfoot:sighting:01G9HSSNN8XM2QBJF1P0P6NFZQ"
 5) "bigfoot:sighting:01G9HSRTZ55Z55Q69R2DG9DWAF"
 6) "bigfoot:sighting:01G9HSSP8WHJRCZQ4Z270CS36V"
 7) "bigfoot:sighting:01G9HSRJ1B454H8S1HPFAEW5V0"
 8) "bigfoot:sighting:01G9HSSK5Y1JJRBM8P67P305C2"
 9) "bigfoot:sighting:01G9HSRS8D4EAS1264WG615WJY"
10) "bigfoot:sighting:01G9HSSBQKKVPP7CYZMXXARM41"
11) "bigfoot:sighting:01G9HSSGAYRG295WPR7TYWNVN3"
```

You can search on documents tagged with one value *and* another by specifying the same field twice:

```bash
127.0.0.1:6379> FT.SEARCH bigfoot:sighting:index "@state:{Ohio} @state:{Kentucky}" RETURN 0
1) (integer) 0
```

Of course, Bigfoot sightings happen only in a single state so this returns zero results.

Let's find all the Bigfoot sightings in Ohio that are Class A:

```bash
127.0.0.1:6379> FT.SEARCH bigfoot:sighting:index "@state:{Ohio} @classification:{Class\\ A}" RETURN 0
 1) (integer) 139
 2) "bigfoot:sighting:01G9HSRTZ55Z55Q69R2DG9DWAF"
 3) "bigfoot:sighting:01G9HSSP8WHJRCZQ4Z270CS36V"
 4) "bigfoot:sighting:01G9HSRJ1B454H8S1HPFAEW5V0"
 5) "bigfoot:sighting:01G9HSSG97AVJ9R1TB9X9TKC2Q"
 6) "bigfoot:sighting:01G9HSSJD1GHYYMTMDFJEWW0AD"
 7) "bigfoot:sighting:01G9HSRY4P8YXBDWS7CJ2ZWQPN"
 8) "bigfoot:sighting:01G9HSSKA7G2E41Y311F7VTCFP"
 9) "bigfoot:sighting:01G9HSSK82V5TQWX2JJ3F5XRWX"
10) "bigfoot:sighting:01G9HSSB9Z4ZG18X644S696QB1"
11) "bigfoot:sighting:01G9HSS146MK9STPD9QGDAB5VS"
```

Note that TAG fields that contain stopwords result in invalid queries. Escaping the string here keeps the parser from seeing the `A` in `Class A` as a stopword.

----------------------------------------

Now that we have searched TEXT and TAG fields, let's [search on NUMERIC and GEO](18-REDISEARCH-NUMERIC-AND-GEO.md) fields.
