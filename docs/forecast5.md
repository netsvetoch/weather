<!-- block-id: concept -->

## 5 day weather forecast

### Product concept

5 day forecast is available at any location on the globe. It includes weather forecast data with 3-hour step. Forecast is available in JSON or XML format.

<!-- block-id: 5days -->

## Call 5 day / 3 hour forecast data

<!-- block-id: geo5 -->

### How to make an API call

You can search weather forecast for 5 days with data every 3 hours by geographic coordinates. All weather data can be obtained in JSON and XML formats.

### API call

```text
api.openweathermap.org/data/2.5/forecast?lat={lat}&lon={lon}&appid={API key}
```

| Parameters |          |                                                                                                                                                                                          |
| ---------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lat`      | Yes      | Latitude. If you need the geocoder to automatic convert city names and zip-codes to geo coordinates and the other way around, please use our [Geocoding API](/api/geocoding-api.md)      |
| `lon`      | Yes      | Longitude. If you need the geocoder to automatic convert city names and zip-codes to geo coordinates and the other way around, please use our [Geocoding API](/api/geocoding-api.md)     |
| `appid`    | Yes      | Your unique API key (you can always find it on your account page under the ["API key" tab](https://home.openweathermap.org/api_keys))                                                    |
| `units`    | optional | Units of measurement. `standard`, `metric` and `imperial` units are available. If you do not use the `units` parameter, `standard` units will be applied by default. [Learn more](#data) |
| `mode`     | optional | Response format. JSON format is used by default. To get data in XML format use `mode=xml`. [Learn more](#format)                                                                         |
| `cnt`      | optional | A number of timestamps, which will be returned in the API response. [Learn more](#limit)                                                                                                 |
| `units`    | optional | Units of measurement. `standard`, `metric` and `imperial` units are available. If you do not use the `units` parameter, `standard` units will be applied by default. [Learn more](#data) |
| `lang`     | optional | You can use the `lang` parameter to get the output in your language. [Learn more](#multi)                                                                                                |

> Please use [Geocoder API](/api/geocoding-api.md) if you need automatic convert city names and zip-codes to geo coordinates and the other way around.
>
> Please note that [built-in geocoder](#geocoding) has been deprecated. Although it is still available for use, bug fixing and updates are no longer available for this functionality.

<!-- block-id: parameter -->

## API response

> If you do not see some of the parameters in your API response it means that these weather phenomena are just not happened for the time of measurement for the city or location chosen. Only really measured or calculated data is displayed in API response.

<!-- block-id: fields_JSON -->

## JSON format API response fields

- `cod` Internal parameter
- `message` Internal parameter
- `cnt`A number of timestamps returned in the API response
- `list` - `list.dt ` Time of data forecasted, unix, UTC
  - `list.main` - `list.main.temp` Temperature. Unit Default: Kelvin, Metric: Celsius, Imperial: Fahrenheit
    - `list.main.feels_like` This temperature parameter accounts for the human perception of weather. Unit Default: Kelvin, Metric: Celsius, Imperial: Fahrenheit
    - `list.main.temp_min` Minimum temperature at the moment of calculation. This is minimal forecasted temperature (within large megalopolises and urban areas), use this parameter optionally. Please find more info [here](#min). Unit Default: Kelvin, Metric: Celsius, Imperial: Fahrenheit
    - `list.main.temp_max` Maximum temperature at the moment of calculation. This is maximal forecasted temperature (within large megalopolises and urban areas), use this parameter optionally. Please find more info [here](#min). Unit Default: Kelvin, Metric: Celsius, Imperial: Fahrenheit
    - `list.main.pressure` Atmospheric pressure on the sea level by default, hPa
    - `list.main.sea_level` Atmospheric pressure on the sea level, hPa
    - `list.main.grnd_level` Atmospheric pressure on the ground level, hPa
    - `list.main.humidity` Humidity, %
    - `list.main.temp_kf` Internal parameter
  - `list.weather` - `list.weather.id` Weather condition id
    - `list.weather.main` Group of weather parameters (Rain, Snow, Clouds etc.)
    - `list.weather.description` Weather condition within the group. Please find more [here.](#list) You can get the output in your language. [Learn more](#multi)
    - `list.weather.icon` Weather icon id
  - `list.clouds` - `list.clouds.all` Cloudiness, %
  - `list.wind` - `list.wind.speed` Wind speed. Unit Default: meter/sec, Metric: meter/sec, Imperial: miles/hour
    - `list.wind.deg` Wind direction, degrees (meteorological)
    - `list.wind.gust` Wind gust. Unit Default: meter/sec, Metric: meter/sec, Imperial: miles/hour
  - `list.visibility` Average visibility, metres. The maximum value of the visibility is 10km
  - `list.pop` Probability of precipitation. The values of the parameter vary between 0 and 1, where 0 is equal to 0%, 1 is equal to 100%
  - `list.rain` - `list.rain.3h` Rain volume for last 3 hours, mm. Please note that only mm as units of measurement are available for this parameter
  - `list.snow` - `list.snow.3h` Snow volume for last 3 hours. Please note that only mm as units of measurement are available for this parameter
  - `list.sys` - `list.sys.pod` Part of the day (n - night, d - day)
  - `list.dt_txt` Time of data forecasted, ISO, UTC
- `city` - `city.id` City ID. Please note that built-in geocoder functionality has been deprecated. Learn more [here](#builtin)
  - `city.name` City name. Please note that built-in geocoder functionality has been deprecated. Learn more [here](#builtin)
  - `city.coord` - `city.coord.lat ` Geo location, latitude
    - `city.coord.lon` Geo location, longitude
  - `city.country` Country code (GB, JP etc.). Please note that built-in geocoder functionality has been deprecated. Learn more [here](#builtin)
  - `city.population` City population
  - `city.timezone` Shift in seconds from UTC
  - `city.sunrise` Sunrise time, Unix, UTC
  - `city.sunset` Sunset time, Unix, UTC

<!-- block-id: example_XML -->

## XML

<!-- block-id: fields_XML -->

- `location` - `location.name ` City name. Please note that built-in geocoder functionality has been deprecated. Learn more [here](#builtin)
  - `location.type` Internal parameter
  - `location.country` Country code (GB, JP etc.). Please note that built-in geocoder functionality has been deprecated. Learn more [here](#builtin)
  - `location.timezone` Shift in seconds from UTC
  - `location.location` - `location.location.altitude` Geo location, altitude above the sea level
    - `location.location.latitude` Geo location, latitude
    - `location.location.longitude` Geo location, longitude
    - `location.location.geobase` Internal parameter
    - `location.location.geobaseid` Internal parameter
- `meta` - `meta.lastupdate` Prototype parameter
  - `meta.calctime` Speed of data calculation
  - `meta.nextupdate` Prototype parameter
- `sun` - `sun.rise` Sunrise time
  - `sun.set` Sunset time
- `forecast` - `forecast.time` - `forecast.time.from` Beginning of the period of data forecasted
  - `forecast.time.to` End of the period of data forecasted
  - `forecast.symbol` - `forecast.symbol.number` Weather condition id
    - `forecast.symbol.name` Weather condition
    - `forecast.symbol.var` Weather icon id
  - `forecast.precipitation` - `forecast.precipitation.probability` Probability of precipitation. The values of the parameter vary between 0 and 1, where 0 is equal to 0%, 1 is equal to 100%
    - `forecast.precipitation.unit` Period of measurements. Possible value is 1 hour, 3 hours
    - `forecast.precipitation.value` Precipitation volume for the last 3 hours, mm. Please note that only mm as units of measurement are available for this parameter
    - `forecast.precipitation.type` Type of precipitation. Possible value is rain, snow
  - `forecast.windDirection` - `forecast.windDirection.deg` Wind direction, degrees (meteorological)
    - `forecast.windDirection.code` Code of the wind direction. Possible value is WSW, N, S etc.
    - `forecast.windDirection.name` Full name of the wind direction
  - `forecast.windSpeed` - `forecast.windSpeed.mps` Wind speed, meters per second
    - `forecast.windSpeed.unit` Wind speed units, m/s
    - `forecast.windSpeed.name`Type of wind
  - `forecast.windGust` - `forecast.windGust.gust` Wind gust, meters per second
    - `forecast.windGust.unit` Wind gust units, m/s
  - `forecast.temperature` - `forecast.temperature.unit` Unit of measurements. Possible value is Celsius, Kelvin, Fahrenhei.
    - `forecast.temperature.value` Temperature
    - `forecast.temperature.min` Minimum temperature at the moment of calculation. This is minimal forecasted temperature (within large megalopolises and urban areas), use this parameter optionally. Please find more info [here](#min)
    - `forecast.temperature.max` Maximum temperature at the moment of calculation. This is maximal forecasted temperature (within large megalopolises and urban areas), use this parameter optionally. Please find more info [here](#min)
  - `forecast.feels_like` - `forecast.feels_like.unit` Unit of measurements. Possible value is Celsius, Kelvin, Fahrenheit. Unit Default: Kelvin
    - `forecast.feels_like.value` Temperature. This temperature parameter accounts for the human perception of weather
  - `forecast.pressure` - `forecast.pressure.unit` hPa
    - `forecast.pressure.value` Pressure value
  - `forecast.humidity` - `forecast.humidity.unit` %
    - `forecast.humidity.value` Humidity value
  - `forecast.clouds` - `forecast.pressure.value` Name of the cloudiness
    - `forecast.pressure.all` Cloudiness
    - `forecast.pressure.unit` %
  - `forecast.visibility` - `forecast.visibility.value` Average visibility, metres. The maximum value of the visibility is 10km

<!-- block-id: promotion -->

> We provide a broad variety of products such as [One Call API 4.0,](/api/one-call-4.md) [Solar Irradiance & Energy Prediction service,](/api.md#solar) [Road Risk API,](/api/road-risk.md) [Air Pollution API](/api/air-pollution.md) and solutions for advanced weather parameters like solar irradiance data, UVI, dew point, government weather alerts, etc. Please review our [product list](/api.md) page and find more info in the product documentation and [pricing](/price.md) pages.

<!-- block-id: list -->

### List of weather condition codes

List of [weather condition codes](/weather-conditions.md) with icons (range of thunderstorm, drizzle, rain, snow, clouds, atmosphere etc.)

<!-- block-id: min -->

### Min/max temperature in current weather API and forecast API

- In **5 day / 3 hour forecast API**, [Hourly forecast API](/api/hourly-forecast.md) and [Current weather API](/current.md) - **temp_min** and **temp_max** are optional parameters mean min / max temperature in the city at the current moment just for your reference. For large cities and megalopolises geographically expanded it might be applicable. In most cases both **temp_min** and **temp_max** parameters have the same volume as 'temp'. Please use **temp_min** and **temp_max** parameters in current weather API optionally.
- In [16 Day forecast](/forecast16.md) - **min** and **max** mean maximum and minimum temperature in the day.

### Example of Current Weather API response

```text
"main":{
  "temp":306.15, //current temperature
  "pressure":1013,
  "humidity":44,
  "temp_min":30.15, //min current temperature in the city
  "temp_max":306.15 //max current temperature in the city
},
```

For comparison take a look at example of Daily Forecast Weather API response:

### Example of API response

```text
"dt":1406080800,
"temp":{
        "day":297.77,  //daily averaged temperature
        "min":293.52, //daily min temperature
        "max":297.77, //daily max temperature
        "night":293.52, //night temperature
        "eve":297.77, //evening temperature
        "morn":297.77}, //morning temperature
```

<!-- block-id: bulk -->

## Bulk downloading

We provide number of bulk files with current weather and forecasts. More information is on the [Bulk page](/bulk.md).

> Bulk downloading is available not for all accounts. To get more information please refer to the [Price page.](/price.md)

[http://bulk.openweathermap.org/sample/](http://bulk.openweathermap.org/sample/)

<!-- block-id: other -->

## Other features

<!-- block-id: geocoding -->

### Geocoding API

Requesting API calls by geographical coordinates is the most accurate way to specify any location. If you need to convert city names and zip-codes to geo coordinates and the other way around automatically, please use our [Geocoding API](/api/geocoding-api.md).

<!-- block-id: builtin -->

### Built-in geocoding

> Please use [Geocoder API](/api/geocoding-api.md) if you need automatic convert city names and zip-codes to geo coordinates and the other way around.
>
> **Please note that API requests by city name, zip-codes and city id have been deprecated. Although they are still available for use, bug fixing and updates are no longer available for this functionality.**

<!-- block-id: name5 -->

### Built-in API request by city name

You can search weather forecast for 5 days with data every 3 hours by city name. All weather data can be obtained in JSON and XML formats.

### API call

```text
api.openweathermap.org/data/2.5/forecast?q={city name}&appid={API key}
```

### API call

```text
api.openweathermap.org/data/2.5/forecast?q={city name},{country code}&appid={API key}
```

### API call

```text
api.openweathermap.org/data/2.5/forecast?q={city name},{state code},{country code}&appid={API key}
```

| Parameters |          |                                                                                                                                                                                                                                                                                                                                     |
| ---------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `q`        | Yes      | City name, state code and country code divided by comma, use ISO 3166 country codes. You can specify the parameter not only in English. In this case, the API response should be returned in the same language as the language of requested location name if the location is in our predefined list of more than 200,000 locations. |
| `appid`    | Yes      | Your unique API key (you can always find it on your account page under the ["API key" tab](https://home.openweathermap.org/api_keys))                                                                                                                                                                                               |
| `mode`     | optional | Response format. JSON format is used by default. To get data in XML format use `mode=xml`. [Learn more](#format)                                                                                                                                                                                                                    |
| `cnt`      | optional | A number of timestamps, which will be returned in the API response. [Learn more](#limit)                                                                                                                                                                                                                                            |
| `units`    | optional | Units of measurement. `standard`, `metric` and `imperial` units are available. If you do not use the `units` parameter, `standard` units will be applied by default. [Learn more](#data)                                                                                                                                            |
| `lang`     | optional | You can use the `lang` parameter to get the output in your language. [Learn more](#multi)                                                                                                                                                                                                                                           |

> There is a possibility to receive a central district of the city/town with its own parameters (geographic coordinates/id/name) in API response. Please see the example below.

<!-- block-id: cityid5 -->

### Built-in API request by city ID

You can search weather forecast for 5 days with data every 3 hours by city ID. All weather data can be obtained in JSON and XML formats.

List of city ID "city.list.json.gz" can be downloaded [here](http://bulk.openweathermap.org/sample/).

We recommend to call API by city ID to get unambiguous result for your city.

### API call

```text
api.openweathermap.org/data/2.5/forecast?id={city ID}&appid={API key}
```

| Parameters |          |                                                                                                                                                                                          |
| ---------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`       | Yes      | City ID. The list of city IDs 'city.list.json.gz' can be downloaded [here](http://bulk.openweathermap.org/sample/).                                                                      |
| `appid`    | Yes      | Your unique API key (you can always find it on your account page under the ["API key" tab](https://home.openweathermap.org/api_keys))                                                    |
| `mode`     | optional | Response format. JSON format is used by default. To get data in XML format use `mode=xml`. [Learn more](#format)                                                                         |
| `cnt`      | optional | A number of timestamps, which will be returned in the API response. [Learn more](#limit)                                                                                                 |
| `units`    | optional | Units of measurement. `standard`, `metric` and `imperial` units are available. If you do not use the `units` parameter, `standard` units will be applied by default. [Learn more](#data) |
| `lang`     | optional | You can use the `lang` parameter to get the output in your language. [Learn more](multi)                                                                                                 |

<!-- block-id: #zip5 -->

### Built-in API request by ZIP code

Please note if country is not specified then the search works for USA as a default.

### API call

```text
api.openweathermap.org/data/2.5/forecast?zip={zip code},{country code}&appid={API key}
```

| Parameters |          |                                                                                                                                                                                          |
| ---------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `zip`      | Yes      | Zip code                                                                                                                                                                                 |
| `appid`    | Yes      | Your unique API key (you can always find it on your account page under the ["API key" tab](https://home.openweathermap.org/api_keys))                                                    |
| `mode`     | optional | Response format. JSON format is used by default. To get data in XML format use `mode=xml`. [Learn more](#format)                                                                         |
| `cnt`      | optional | A number of timestamps, which will be returned in the API response. [Learn more](#limit)                                                                                                 |
| `units`    | optional | Units of measurement. `standard`, `metric` and `imperial` units are available. If you do not use the `units` parameter, `standard` units will be applied by default. [Learn more](#data) |
| `lang`     | optional | You can use the `lang` parameter to get the output in your language. [Learn more](multi)                                                                                                 |

<!-- block-id: format -->

### Format

Response format. JSON format is used by default. To get data in XML format use `mode=xml`.

| Parameters |          |                                                                                            |
| ---------- | -------- | ------------------------------------------------------------------------------------------ |
| `mode`     | optional | Response format. JSON format is used by default. To get data in XML format use `mode=xml`. |

JSON

XML

<!-- block-id: limit -->

### Limitation of result

To limit number of timestamps in the API response please setup `cnt`.

| Parameters |          |                                                                     |
| ---------- | -------- | ------------------------------------------------------------------- |
| `cnt`      | optional | A number of timestamps, which will be returned in the API response. |

<!-- block-id: data -->

### Units of measurement

`standard`, `metric`, and `imperial` units are available.

| Parameters |          |                                                                                                                                                                     |
| ---------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `units`    | optional | Units of measurement. `standard`, `metric` and `imperial` units are available. If you do not use the `units` parameter, `standard` units will be applied by default |

> List of all API parameters with units [openweathermap.org/weather-data](/weather-data.md)

Standard

Metric

Imperial

<!-- block-id: multi -->

### Multilingual support

You can use the `lang` parameter to get the output in your language.

Translation is applied to the `city name` and `description` fields.

### API call

```text
http://api.openweathermap.org/data/2.5/forecast?id=524901&lang={lang}
```

| Parameters |          |                                                                      |
| ---------- | -------- | -------------------------------------------------------------------- |
| `lang`     | optional | You can use the `lang` parameter to get the output in your language. |

We support the following languages that you can use with the corresponded lang values:

- `sq` Albanian
- `af` Afrikaans
- `ar` Arabic
- `az` Azerbaijani
- `eu` Basque
- `be` Belarusian
- `bg` Bulgarian
- `ca` Catalan
- `zh_cn` Chinese Simplified
- `zh_tw` Chinese Traditional
- `hr` Croatian
- `cz` Czech
- `da` Danish
- `nl` Dutch
- `en` English
- `fi` Finnish
- `fr` French
- `gl` Galician
- `de` German
- `el` Greek
- `he` Hebrew
- `hi` Hindi
- `hu` Hungarian
- `is` Icelandic
- `id` Indonesian
- `it` Italian
- `ja` Japanese
- `kr` Korean
- `ku` Kurmanji (Kurdish)
- `la` Latvian
- `lt` Lithuanian
- `mk` Macedonian
- `no` Norwegian
- `fa` Persian (Farsi)
- `pl` Polish
- `pt` Portuguese
- `pt_br` Português Brasil
- `ro` Romanian
- `ru` Russian
- `sr` Serbian
- `sk` Slovak
- `sl` Slovenian
- `sp, es` Spanish
- `sv, se` Swedish
- `th` Thai
- `tr` Turkish
- `ua, uk` Ukrainian
- `vi` Vietnamese
- `zu` Zulu

<!-- block-id: call -->

### Call back function for JavaScript code

To use JavaScript code you can transfer `callback` functionName to JSONP callback.
