<!-- block-id: description -->

## Geocoding API

Geocoding API is a simple tool that we have developed to ease the search for locations while working with geographic names and coordinates.

Supporting API calls by geographical coordinates is the most accurate way to specify any location, that is why this method is integrated in all OpenWeather APIs. However, this way is not always suitable for all users. Geocoding is the process of transformation of any location name into geographical coordinates, and the other way around (reverse geocoding). OpenWeather’s Geocoding API supports both the direct and reverse methods, working at the level of city names, areas and districts, countries and states:

- [Direct geocoding](#direct) converts the specified name of a location or zip/post code into the exact geographical coordinates;
- [Reverse geocoding](#reverse) converts the geographical coordinates into the names of the nearby locations.

<!-- block-id: direct -->

## Direct geocoding

Direct geocoding allows to get geographical coordinates (lat, lon) by using name of the location (city name or area name). If you use the `limit` parameter in the API call, you can cap how many locations with the same name will be seen in the API response (for instance, London in the UK and London in the US).

<!-- block-id: direct_name -->

### Coordinates by location name

<!-- block-id: direct_name_how -->

### How to make an API call

### API call

```text
http://api.openweathermap.org/geo/1.0/direct?q={city name},{state code},{country code}&limit={limit}&appid={API key}
```

| Parameters |          |                                                                                                                                       |
| ---------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `q`        | Yes      | City name, state code (only for the US) and country code divided by comma. Please use ISO 3166 country codes.                         |
| `appid`    | Yes      | Your unique API key (you can always find it on your account page under the ["API key" tab](https://home.openweathermap.org/api_keys)) |
| `limit`    | optional | Number of the locations in the API response (up to 5 results can be returned in the API response)                                     |

### Example of API call

```text
http://api.openweathermap.org/geo/1.0/direct?q=London&limit=5&appid={API key}
```

<!-- block-id: direct_name_fields -->

> Please note that the fields present will vary based on a country to which a location belongs as well as a specific location.

- `name` Name of the found location
- `local_names` - `local_names.[language code]` Name of the found location in different languages. The list of names can be different for different locations
  - `local_names.ascii` Internal field
  - `local_names.feature_name` Internal field
- `lat` Geographical coordinates of the found location (latitude)
- `lon` Geographical coordinates of the found location (longitude)
- `country` Country of the found location
- `state` (where available) State of the found location

<!-- block-id: direct_zip -->

### Coordinates by zip/post code

### How to make an API call

```text
http://api.openweathermap.org/geo/1.0/zip?zip={zip code},{country code}&appid={API key}
```

| Parameters |     |                                                                                                                                       |
| ---------- | --- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `zip code` | Yes | Zip/post code and country code divided by comma. Please use ISO 3166 country codes.                                                   |
| `appid`    | Yes | Your unique API key (you can always find it on your account page under the ["API key" tab](https://home.openweathermap.org/api_keys)) |

### Example of API call

```text
http://api.openweathermap.org/geo/1.0/zip?zip=E14,GB&appid={API key}
```

### Example of API response

```json
{
  "zip": "90210",
  "name": "Beverly Hills",
  "lat": 34.0901,
  "lon": -118.4065,
  "country": "US"
}
```

<!-- block-id: direct_zip_fields -->

### Fields in API response

- `zip` Specified zip/post code in the API request
- `name` Name of the found area
- `lat` Geographical coordinates of the centroid of found zip/post code (latitude)
- `lon` Geographical coordinates of the centroid of found zip/post code (longitude)
- `country` Country of the found zip/post code

<!-- block-id: reverse -->

## Reverse geocoding

Reverse geocoding allows to get name of the location (city name or area name) by using geografical coordinates (lat, lon). The `limit` parameter in the API call allows you to cap how many location names you will see in the API response.

### API call

```text
http://api.openweathermap.org/geo/1.0/reverse?lat={lat}&lon={lon}&limit={limit}&appid={API key}
```

| Parameters |          |                                                                                                                                       |
| ---------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `lat, lon` | Yes      | Geographical coordinates (latitude, longitude)                                                                                        |
| `appid`    | Yes      | Your unique API key (you can always find it on your account page under the ["API key" tab](https://home.openweathermap.org/api_keys)) |
| `limit`    | optional | Number of the location names in the API response (several results can be returned in the API response)                                |

### Example of API call

```text
http://api.openweathermap.org/geo/1.0/reverse?lat=51.5098&lon=-0.1180&limit=5&appid={API key}
```

<!-- block-id: reverse_fields -->

> Please note that the fields present will vary based on a country to which a location belongs as well as a specific location.

- `name` Name of the found location
- `local_names` - `local_names.[language code]` Name of the found location in different languages. The list of names can be different for different locations.
  - `local_names.ascii` Internal field
  - `local_names.feature_name` Internal field
- `lat` Geographical coordinates of the found location (latitude)
- `lon` Geographical coordinates of the found location (longitude)
- `country` Country of the found location
- `state` (where available) State of the found location
