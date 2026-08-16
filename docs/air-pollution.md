<!-- block-id: concept -->

## Air Pollution API concept

Air Pollution API provides current, forecast and historical air pollution data for any coordinates on the globe.

Besides basic Air Quality Index, the API returns data about polluting gases, such as Carbon monoxide (CO), Nitrogen monoxide (NO), Nitrogen dioxide (NO2), Ozone (O3), Sulphur dioxide (SO2), Ammonia (NH3), and particulates (PM2.5 and PM10).

Air pollution forecast is available for 4 days with hourly granularity. Historical data is accessible from 27th November 2020.

Here is a description of OpenWeather scale for Air Quality Index levels:

| Qualitative name | Index | Pollutant concentration in μg/m3 |            |            |          |            |                |
| ---------------- | ----- | -------------------------------- | ---------- | ---------- | -------- | ---------- | -------------- |
|                  |       | SO2                              | NO2        | PM10       | PM2.5    | O3         | CO             |
| Good             | 1     | [0; 20)                          | [0; 40)    | [0; 20)    | [0; 10)  | [0; 60)    | [0; 4400)      |
| Fair             | 2     | [20; 80)                         | [40; 70)   | [20; 50)   | [10; 25) | [60; 100)  | [4400; 9400)   |
| Moderate         | 3     | [80; 250)                        | [70; 150)  | [50; 100)  | [25; 50) | [100; 140) | [9400-12400)   |
| Poor             | 4     | [250; 350)                       | [150; 200) | [100; 200) | [50; 75) | [140; 180) | [12400; 15400) |
| Very Poor        | 5     | ⩾350                             | ⩾200       | ⩾200       | ⩾75      | ⩾180       | ⩾15400         |

Other parameters that do not affect the AQI calculation:

- NH3: min value 0.1 - max value 200
- NO: min value 0.1 - max value 100

Please find Air Quality Index levels scales used in UK, Europe, USA and Mainland China in the ["Air Pollution Index levels scale"](/air-pollution-index-levels.md) page.

<!-- block-id: current -->

### Current air pollution data

### API call

```text
http://api.openweathermap.org/data/2.5/air_pollution?lat={lat}&lon={lon}&appid={API key}
```

| Parameters |     |                                                                                                                                                                                      |
| ---------- | --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `lat`      | Yes | Latitude. If you need the geocoder to automatic convert city names and zip-codes to geo coordinates and the other way around, please use our [Geocoding API](/api/geocoding-api.md)  |
| `lon`      | Yes | Longitude. If you need the geocoder to automatic convert city names and zip-codes to geo coordinates and the other way around, please use our [Geocoding API](/api/geocoding-api.md) |
| `appid`    | Yes | Your unique API key (you can always find it on your account page under the ["API key" tab](https://home.openweathermap.org/api_keys))                                                |

### Example of API request

```json
{
  "coord": [50.0, 50.0],
  "list": [
    {
      "dt": 1606147200,
      "main": {
        "aqi": 4.0
      },
      "components": {
        "co": 203.609,
        "no": 0.0,
        "no2": 0.396,
        "o3": 75.102,
        "so2": 0.648,
        "pm2_5": 23.253,
        "pm10": 92.214,
        "nh3": 0.117
      }
    }
  ]
}
```

<!-- block-id: forecast -->

### Forecast air pollution data

### API call

```text
http://api.openweathermap.org/data/2.5/air_pollution/forecast?lat={lat}&lon={lon}&appid={API key}
```

| Parameters |     |                                                                                                                                                                                      |
| ---------- | --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `lat`      | Yes | Latitude. If you need the geocoder to automatic convert city names and zip-codes to geo coordinates and the other way around, please use our [Geocoding API](/api/geocoding-api.md)  |
| `lon`      | Yes | Longitude. If you need the geocoder to automatic convert city names and zip-codes to geo coordinates and the other way around, please use our [Geocoding API](/api/geocoding-api.md) |
| `appid`    | Yes | Your unique API key (you can always find it on your account page under the ["API key" tab](https://home.openweathermap.org/api_keys))                                                |

### Example of API request

```json
{
  "coord": [
    50.0,
    50.0
  ],
  "list": [
    {
      "dt": 1605916800,
      "main": {
        "aqi": 1.0
      },
      "components": {
        "co": 211.954,
        "no": 0.0,
        "no2": 0.217,
        "o3": 72.956,
        "so2": 0.514,
        "pm2_5": 2.563,
        "pm10": 5.757,
        "nh3": 0.216
      }
    },
    {
      "dt": 1605920400,
      "main": {
        "aqi": 1.0
      },
      "components": {
        "co": 211.954,
        "no": 0.0,
        "no2": 0.201,
        "o3": 72.241,
        "so2": 0.469,
        "pm2_5": 2.662,
        "pm10": 5.622,
        "nh3": 0.224
      }
    },
    {
      "dt": 1605924000,
      "main": {
        "aqi": 1.0
      },
      "components": {
        "co": 213.623,
        "no": 0.0,
        "no2": 0.185,
        "o3": 71.526,
        "so2": 0.443,
        "pm2_5": 2.724,
        "pm10": 5.51,
        "nh3": 0.23
      }
    },
    {
      "dt": 1605927600,
      "main": {
        "aqi": 1.0
      },
      "components": {
        "co": 213.623,
        "no": 0.0,
        "no2": 0.17,
        "o3": 72.241,
        "so2": 0.432,
        "pm2_5": 2.812,
        "pm10": 5.687,
        "nh3": 0.234
      }
    },
    .....
```

<!-- block-id: history -->

### Historical air pollution data

### API call

```text
http://api.openweathermap.org/data/2.5/air_pollution/history?lat={lat}&lon={lon}&start={start}&end={end}&appid={API key}
```

| Parameters |     |                                                                                                                                                                                      |
| ---------- | --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `lat`      | Yes | Latitude. If you need the geocoder to automatic convert city names and zip-codes to geo coordinates and the other way around, please use our [Geocoding API](/api/geocoding-api.md)  |
| `lon`      | Yes | Longitude. If you need the geocoder to automatic convert city names and zip-codes to geo coordinates and the other way around, please use our [Geocoding API](/api/geocoding-api.md) |
| `start`    | Yes | Start date (unix time, UTC time zone), e.g. start=1606488670                                                                                                                         |
| `end`      | Yes | End date (unix time, UTC time zone), e.g. end=1606747870                                                                                                                             |
| `appid`    | Yes | Your unique API key (you can always find it on your account page under the ["API key" tab](https://home.openweathermap.org/api_keys))                                                |

### Example of API request

```json
{
  "coord": [
    50.0,
    50.0
  ],
  "list": [
    {
      "main": {
        "aqi": 2
      },
      "components": {
        "co": 270.367,
        "no": 5.867,
        "no2": 43.184,
        "o3": 4.783,
        "so2": 14.544,
        "pm2_5": 13.448,
        "pm10": 15.524,
        "nh3": 0.289
      },
      "dt": 1606482000
    },
    {
      "main": {
        "aqi": 2
      },
      "components": {
        "co": 280.38,
        "no": 8.605,
        "no2": 42.155,
        "o3": 2.459,
        "so2": 14.901,
        "pm2_5": 15.103,
        "pm10": 17.249,
        "nh3": 0.162
      },
      "dt": 1606478400
    },
    {
      "main": {
        "aqi": 2
      },
      "components": {
        "co": 293.732,
        "no": 13.523,
        "no2": 41.47,
        "o3": 1.173,
        "so2": 15.14,
        "pm2_5": 17.727,
        "pm10": 19.929,
        "nh3": 0.072
      },
      "dt": 1606474800
    },
    .....
```

<!-- block-id: descr -->

### Air Pollution API response

### Example of the API response

```json
{
  "coord": [50, 50],
  "list": [
    {
      "dt": 1605182400,
      "main": {
        "aqi": 1
      },
      "components": {
        "co": 201.94053649902344,
        "no": 0.01877197064459324,
        "no2": 0.7711350917816162,
        "o3": 68.66455078125,
        "so2": 0.6407499313354492,
        "pm2_5": 0.5,
        "pm10": 0.540438711643219,
        "nh3": 0.12369127571582794
      }
    }
  ]
}
```

<!-- block-id: fields -->

### Fields in API response

#### coord

Coordinates from the specified location (latitude, longitude)

#### list

- `dt` Date and time, Unix, UTC
- `main`
- - `main.aqi` Air Quality Index. Possible values: 1, 2, 3, 4, 5. Where 1 = Good, 2 = Fair, 3 = Moderate, 4 = Poor, 5 = Very Poor. If you want to recalculate Air Quality indexes according UK, Europe, USA and Mainland China scales please use ["Air Pollution Index levels scale"](/air-pollution-index-levels.md) page
- `components`
- - `components.co` Сoncentration of CO ([Carbon monoxide](https://en.wikipedia.org/wiki/Carbon_monoxide)), μg/m3
  - `components.no` Сoncentration of NO ([Nitrogen monoxide](https://en.wikipedia.org/wiki/Nitric_oxide)), μg/m3
  - `components.no2` Сoncentration of NO2 ([Nitrogen dioxide](https://en.wikipedia.org/wiki/Nitrogen_dioxide)), μg/m3
  - `components.o3` Сoncentration of O3 ([Ozone](https://en.wikipedia.org/wiki/Ozone)), μg/m3
  - `components.so2` Сoncentration of SO2 ([Sulphur dioxide](https://en.wikipedia.org/wiki/Sulfur_dioxide)), μg/m3
  - `components.pm2_5` Сoncentration of PM2.5 ([Fine particles matter](https://en.wikipedia.org/wiki/Particulates)), μg/m3
  - `components.pm10` Сoncentration of PM10 ([Coarse particulate matter](https://en.wikipedia.org/wiki/Particulates#Size,_shape,_and_solubility_matter)), μg/m3
  - `components.nh3` Сoncentration of NH3 ([Ammonia](https://en.wikipedia.org/wiki/Ammonia)), μg/m3
