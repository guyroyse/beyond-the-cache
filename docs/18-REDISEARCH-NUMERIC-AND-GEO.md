# Searching NUMERIC and GEO Fields #

NUMERIC and GEO fields don't have a ton in common, other than they are both simpler than TEXT and TAG searches. So, I've lumped 'em together.


## Searching NUMERIC Fields ##

NUMERIC fields, unsurprisingly, contain numbers. This can be integers of floating-point numbers. If we have indexed JSON documents, these can be actual numbers in the JSON. If we are working with Hashes, these are Strings that contain numbers. Remember, in Redis that Strings that contain numbers are stored as numbers internally. So, NUMERIC fields are actual numbers.

Searching NUMERIC fields in RediSearch is pretty easy. Just provide the upper and lower bounds for the number range you want for a particular field. For example, to find all the temperatures between 75° and 90° inclusive, we would issue the following query:

```bash
127.0.0.1:6379> FT.SEARCH bigfoot:sighting:index "@temperature_mid:[75 90]" RETURN 1 $.temperature.mid
 1) (integer) 639
 2) "bigfoot:sighting:01G9HSRFRAAS9W8MWBXNQ87C2F"
 3) 1) "$.temperature.mid"
    2) "80.17"
 4) "bigfoot:sighting:01G9HSRDT6CZZVTDN5KRWXY19N"
 5) 1) "$.temperature.mid"
    2) "79.465"
 6) "bigfoot:sighting:01G9HSS7R7R040KJCHJKQ9AP66"
 7) 1) "$.temperature.mid"
    2) "78.935"
 8) "bigfoot:sighting:01G9HSS53ZGTWWVF2QSEKT53D6"
 9) 1) "$.temperature.mid"
    2) "75.55"
10) "bigfoot:sighting:01G9HSSRGGKH7SYV3K2GACKMJD"
11) 1) "$.temperature.mid"
    2) "75.91"
12) "bigfoot:sighting:01G9HSSFNZQCSJ9ZWXD0XF0287"
13) 1) "$.temperature.mid"
    2) "79.77"
14) "bigfoot:sighting:01G9HSSN1GAPCGQMAHYP0R0CA3"
15) 1) "$.temperature.mid"
    2) "77.13"
16) "bigfoot:sighting:01G9HSSP4PEGYBRV6E2SAH3Z5C"
17) 1) "$.temperature.mid"
    2) "78.59"
18) "bigfoot:sighting:01G9HSRHWMA35BJGGW3CWEDS1K"
19) 1) "$.temperature.mid"
    2) "83.545"
20) "bigfoot:sighting:01G9HSS5H0WC7DZ7WFRJ5RBK56"
21) 1) "$.temperature.mid"
    2) "83.36"
```

To make it *exclusive* instead of inclusive:

```bash
127.0.0.1:6379> FT.SEARCH bigfoot:sighting:index "@temperature_mid:[(75 (90]" RETURN 1 $.temperature.mid
 1) (integer) 639
 2) "bigfoot:sighting:01G9HSRFRAAS9W8MWBXNQ87C2F"
 3) 1) "$.temperature.mid"
    2) "80.17"
 4) "bigfoot:sighting:01G9HSRDT6CZZVTDN5KRWXY19N"
 5) 1) "$.temperature.mid"
    2) "79.465"
 6) "bigfoot:sighting:01G9HSS7R7R040KJCHJKQ9AP66"
 7) 1) "$.temperature.mid"
    2) "78.935"
 8) "bigfoot:sighting:01G9HSS53ZGTWWVF2QSEKT53D6"
 9) 1) "$.temperature.mid"
    2) "75.55"
10) "bigfoot:sighting:01G9HSSRGGKH7SYV3K2GACKMJD"
11) 1) "$.temperature.mid"
    2) "75.91"
12) "bigfoot:sighting:01G9HSSFNZQCSJ9ZWXD0XF0287"
13) 1) "$.temperature.mid"
    2) "79.77"
14) "bigfoot:sighting:01G9HSSN1GAPCGQMAHYP0R0CA3"
15) 1) "$.temperature.mid"
    2) "77.13"
16) "bigfoot:sighting:01G9HSSP4PEGYBRV6E2SAH3Z5C"
17) 1) "$.temperature.mid"
    2) "78.59"
18) "bigfoot:sighting:01G9HSRHWMA35BJGGW3CWEDS1K"
19) 1) "$.temperature.mid"
    2) "83.545"
20) "bigfoot:sighting:01G9HSS5H0WC7DZ7WFRJ5RBK56"
21) 1) "$.temperature.mid"
    2) "83.36"
```

Not much of a change. In fact, looks identical. Try poking around with the query and see if you can prove to yourself that this works.

If you want to remove the upper limit, you can use `+inf` instead of a number:

```bash
127.0.0.1:6379> FT.SEARCH bigfoot:sighting:index "@temperature_mid:[90 +inf]" RETURN 1 $.temperature.mid
 1) (integer) 5
 2) "bigfoot:sighting:01G9HSS5J8B1Z2Q1C8VM0PN07V"
 3) 1) "$.temperature.mid"
    2) "94.69"
 4) "bigfoot:sighting:01G9HSRS1A0AVCFB62K4NQVYG1"
 5) 1) "$.temperature.mid"
    2) "93.175"
 6) "bigfoot:sighting:01G9HSSRKEDZ5WM0ZXFMSR60KF"
 7) 1) "$.temperature.mid"
    2) "90.285"
 8) "bigfoot:sighting:01G9HSS810YT674CHQ9A09D9AS"
 9) 1) "$.temperature.mid"
    2) "90.55"
10) "bigfoot:sighting:01G9HSSFVBX0FFCAK4RG61MK42"
11) 1) "$.temperature.mid"
    2) "93.98"
```

Not a lot of Bigfoot sightings at or above 90°. Guess he does have a lot of fur. If you want to remove the lower limit, you can use `-inf` in a similar way:

```bash
127.0.0.1:6379> FT.SEARCH bigfoot:sighting:index "@temperature_mid:[-inf 32]" RETURN 1 $.temperature.mid
 1) (integer) 186
 2) "bigfoot:sighting:01G9HSSDJ4JKDDK9H0YFYWPYJ1"
 3) 1) "$.temperature.mid"
    2) "24.725"
 4) "bigfoot:sighting:01G9HSSZGB9NFTC1NGXM9VVCZH"
 5) 1) "$.temperature.mid"
    2) "26.02"
 6) "bigfoot:sighting:01G9HSSP8WHJRCZQ4Z270CS36V"
 7) 1) "$.temperature.mid"
    2) "14.635"
 8) "bigfoot:sighting:01G9HSS260VJAE3BHGJ7E5T25V"
 9) 1) "$.temperature.mid"
    2) "23.7"
10) "bigfoot:sighting:01G9HSSDPHYCVQR0X9CJBSXK7W"
11) 1) "$.temperature.mid"
    2) "25.655"
12) "bigfoot:sighting:01G9HSSZAVMMXN2XFECA4HE1CQ"
13) 1) "$.temperature.mid"
    2) "24.38"
14) "bigfoot:sighting:01G9HSRD8W8E3PXVTNBG741022"
15) 1) "$.temperature.mid"
    2) "28.735"
16) "bigfoot:sighting:01G9HSS7TQZ0Y2W1YE5MEWD9MC"
17) 1) "$.temperature.mid"
    2) "30.42"
18) "bigfoot:sighting:01G9HSSJD1GHYYMTMDFJEWW0AD"
19) 1) "$.temperature.mid"
    2) "10.495"
20) "bigfoot:sighting:01G9HSRBEE27TEGEAFS0N50E4D"
21) 1) "$.temperature.mid"
    2) "23.865"
```

Quite a few more at or below freezing. And, if you really want to, you can specify `-inf` and `+inf` in the same query. This pretty much just makes sure that the temperature is a number and will filter out things that are null or non-numeric:

```bash
127.0.0.1:6379> FT.SEARCH bigfoot:sighting:index "@temperature_mid:[-inf +inf]" RETURN 0 LIMIT 0 0
1) (integer) 3645
```

You can see here that there are 3,645 Bigfoot sightings with a temperature. But we know that we have a total of 4,586 Bigfoot sightings:

```bash
127.0.0.1:6379> FT.SEARCH bigfoot:sighting:index * RETURN 0 LIMIT 0 0
1) (integer) 4586
```

And that's pretty much everything with NUMERIC fields.


## Searching GEO Fields ##

GEO fields contain a longitude and a latitude. But, in order for RediSearch to properly index them, they must be in a very specific format. That format is `<longitude>,<latitude>`. Many people, people like me, tend to think latitude and then longitude. Redis doesn't. Take a look at some of the GEO fields with a quick search to see how this formatting looks:

```bash
127.0.0.1:6379> FT.SEARCH bigfoot:sighting:index * RETURN 1 $.location
 1) (integer) 4586
 2) "bigfoot:sighting:01G9HSS0HBED8CZR84RN32GQ89"
 3) (empty array)
 4) "bigfoot:sighting:01G9HSRRMTXMX7WDM0S4XS1YAQ"
 5) (empty array)
 6) "bigfoot:sighting:01G9HSSHBG3X799TKWSWXE128J"
 7) (empty array)
 8) "bigfoot:sighting:01G9HSSAKBP8DJQBFK0A62QVG3"
 9) (empty array)
10) "bigfoot:sighting:01G9HSRFRAAS9W8MWBXNQ87C2F"
11) 1) "$.location"
    2) "-84.80283,33.81283"
12) "bigfoot:sighting:01G9HSRW2EHRWB2XRH4PT8QV2R"
13) 1) "$.location"
    2) "-86.581,32.184"
14) "bigfoot:sighting:01G9HSRXK1FG9BNZBP3H7H2X86"
15) 1) "$.location"
    2) "-119.9254,34.73389"
16) "bigfoot:sighting:01G9HSSNGN5QTYGQC40NRS908H"
17) 1) "$.location"
    2) "-81.52805,42.75195"
18) "bigfoot:sighting:01G9HSSDJ4JKDDK9H0YFYWPYJ1"
19) 1) "$.location"
    2) "-84.01165,44.68"
20) "bigfoot:sighting:01G9HSRDT6CZZVTDN5KRWXY19N"
21) 1) "$.location"
    2) "-119.54,38.29165"
```

Not all of the Bigfoot sightings have locations, but those that do are in `<longitude>,<latitude>` format. It's worth noting that beyond a certain degree of precision, RediSearch will ignore the extra digits. So, don't try to cram 14 decimals worth of precision into your coordinates. Anything more than 6 decimals (~10cm) is [probably pointless](https://en.wikipedia.org/wiki/Decimal_degrees) for your application.

To search a GEO field, we need to specify a longitude, a latitude, a radius, and a unit of measure for the radius. This finds all the Bigfoot sightings with 50 miles of Cincinati:

```bash
127.0.0.1:6379> FT.SEARCH bigfoot:sighting:index "@location:[-84.5125 39.1 50 mi]" RETURN 1 $.location
 1) (integer) 21
 2) "bigfoot:sighting:01G9HSSJ5DBT3XYPGBYSNHW36H"
 3) 1) "$.location"
    2) "-84.51192,39.65625"
 4) "bigfoot:sighting:01G9HSSKA7G2E41Y311F7VTCFP"
 5) 1) "$.location"
    2) "-84.80138,39.37215"
 6) "bigfoot:sighting:01G9HSSK82V5TQWX2JJ3F5XRWX"
 7) 1) "$.location"
    2) "-84.17227,39.13595"
 8) "bigfoot:sighting:01G9HSRYSBJFR0H1MCS84ERCAC"
 9) 1) "$.location"
    2) "-84.1317,39.03501"
10) "bigfoot:sighting:01G9HSSBSP791RF4BBP6R8BWAN"
11) 1) "$.location"
    2) "-84.63702,38.73854"
12) "bigfoot:sighting:01G9HSSK6CZMA3MNT466BA5040"
13) 1) "$.location"
    2) "-84.79429,39.37509"
14) "bigfoot:sighting:01G9HSSNPZ4BP4VG7NS0VRM26B"
15) 1) "$.location"
    2) "-84.14354,39.00175"
16) "bigfoot:sighting:01G9HSRYDYA15WY064YSH03GZ4"
17) 1) "$.location"
    2) "-83.80582,38.81772"
18) "bigfoot:sighting:01G9HSRWGGN7GEFR94NTX9A320"
19) 1) "$.location"
    2) "-84.67017,38.90649"
20) "bigfoot:sighting:01G9HSRV4XGGKP0RWP94FF8GWN"
21) 1) "$.location"
    2) "-83.80266,38.63454"
```

Valid units of measure are `m`, `km`, `mi`, and `ft`. I like the freedom units but you do you.

```bash
127.0.0.1:6379> FT.SEARCH bigfoot:sighting:index "@location:[-84.5125 39.1 50 m]" RETURN 0 LIMIT 0 0
1) (integer) 0
127.0.0.1:6379> FT.SEARCH bigfoot:sighting:index "@location:[-84.5125 39.1 50 ft]" RETURN 0 LIMIT 0 0
1) (integer) 0
127.0.0.1:6379> FT.SEARCH bigfoot:sighting:index "@location:[-84.5125 39.1 50 km]" RETURN 0 LIMIT 0 0
1) (integer) 12
```

And that's GEO.

----------------------------------------

Search covered, let's see about making our Bigfoot Tracking API take advantage of [RediSearch from Node Redis](19-NODE-REDIS-SEARCH.md) to get rid of that call to `.keys()` and to complete our API!
