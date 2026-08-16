export const currentFixture = {
  coord: { lon: 10.99, lat: 44.34 },
  weather: [{ id: 501, main: "Rain", description: "ливень", icon: "10d" }],
  base: "stations",
  main: { temp: 20, feels_like: 19, temp_min: 18, temp_max: 22, pressure: 1015, humidity: 64 },
  wind: { speed: 0.62, deg: 349 },
  clouds: { all: 100 },
  dt: 1661870592,
  sys: { country: "IT", sunrise: 1661834187, sunset: 1661882248 },
  timezone: 7200,
  id: 3163858,
  name: "Zocca",
  cod: 200,
}

export const forecastFixture = {
  cod: "200",
  message: 0,
  cnt: 1,
  list: [
    {
      dt: 1661871600,
      main: {
        temp: 20,
        feels_like: 19,
        temp_min: 18,
        temp_max: 22,
        pressure: 1015,
        humidity: 64,
        temp_kf: 0,
      },
      weather: [{ id: 501, main: "Rain", description: "ливень", icon: "10d" }],
      clouds: { all: 100 },
      wind: { speed: 0.62, deg: 349 },
      pop: 0.32,
      sys: { pod: "d" },
      dt_txt: "2022-08-30 15:00:00",
    },
  ],
  city: {
    id: 3163858,
    name: "Zocca",
    coord: { lat: 44.34, lon: 10.99 },
    country: "IT",
    population: 4593,
    timezone: 7200,
    sunrise: 1661834187,
    sunset: 1661882248,
  },
}

export const airFixture = {
  coord: [44.34, 10.99],
  list: [
    {
      dt: 1661870592,
      main: { aqi: 2 },
      components: { co: 1, no: 1, no2: 1, o3: 1, so2: 1, pm2_5: 5, pm10: 8, nh3: 1 },
    },
  ],
}

export const geoFixture = {
  name: "Москва",
  lat: 55.7558,
  lon: 37.6173,
  country: "RU",
}
