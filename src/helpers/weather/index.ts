import axios from "axios";

interface WeatherData {
  temperature: number;
  weatherCode: number;
  weatherDescription: string;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  precipitation: number;
  cloudCover: number;
  uvIndex: number;
}

interface WeatherResponse {
  current: {
    temperature_2m: number;
    weather_code: number;
    relative_humidity_2m: number;
    wind_speed_10m: number;
    wind_direction_10m: number;
    precipitation: number;
    cloud_cover: number;
    uv_index: number;
  };
}

/**
 * Weather code mapping based on WMO Weather interpretation codes
 * https://open-meteo.com/en/docs
 */
const getWeatherDescription = (code: number): string => {
  const weatherCodes: { [key: number]: string } = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Foggy",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    56: "Light freezing drizzle",
    57: "Dense freezing drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    66: "Light freezing rain",
    67: "Heavy freezing rain",
    71: "Slight snow fall",
    73: "Moderate snow fall",
    75: "Heavy snow fall",
    77: "Snow grains",
    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    85: "Slight snow showers",
    86: "Heavy snow showers",
    95: "Thunderstorm",
    96: "Thunderstorm with slight hail",
    99: "Thunderstorm with heavy hail",
  };
  return weatherCodes[code] || "Unknown";
};

/**
 * Fetch current weather data using Open-Meteo API (Free, no API key required)
 * @param latitude - Latitude coordinate
 * @param longitude - Longitude coordinate
 * @returns WeatherData object with current weather information
 */
export const getCurrentWeather = async (
  latitude: number,
  longitude: number
): Promise<WeatherData | null> => {
  try {
    const url = `https://api.open-meteo.com/v1/forecast`;
    const params = {
      latitude,
      longitude,
      current: [
        "temperature_2m",
        "weather_code",
        "relative_humidity_2m",
        "wind_speed_10m",
        "wind_direction_10m",
        "precipitation",
        "cloud_cover",
        "uv_index",
      ].join(","),
      timezone: "auto",
    };

    const response = await axios.get<WeatherResponse>(url, { params });

    if (response.data && response.data.current) {
      const current = response.data.current;
      return {
        temperature: current.temperature_2m,
        weatherCode: current.weather_code,
        weatherDescription: getWeatherDescription(current.weather_code),
        humidity: current.relative_humidity_2m,
        windSpeed: current.wind_speed_10m,
        windDirection: current.wind_direction_10m,
        precipitation: current.precipitation,
        cloudCover: current.cloud_cover,
        uvIndex: current.uv_index,
      };
    }

    return null;
  } catch (error) {
    console.error("Error fetching weather data:", error);
    return null;
  }
};

/**
 * Alternative: Fetch weather using OpenWeatherMap API (requires free API key)
 * Sign up at: https://openweathermap.org/api
 * Uncomment and use this if you prefer OpenWeatherMap
 */
/*
export const getCurrentWeatherOpenWeatherMap = async (
  latitude: number,
  longitude: number,
  apiKey: string
): Promise<any> => {
  try {
    const url = `https://api.openweathermap.org/data/2.5/weather`;
    const params = {
      lat: latitude,
      lon: longitude,
      appid: apiKey,
      units: 'metric',
    };

    const response = await axios.get(url, { params });
    
    if (response.data) {
      return {
        temperature: response.data.main.temp,
        weatherDescription: response.data.weather[0].description,
        humidity: response.data.main.humidity,
        windSpeed: response.data.wind.speed,
        cloudCover: response.data.clouds.all,
      };
    }

    return null;
  } catch (error) {
    console.error("Error fetching weather data from OpenWeatherMap:", error);
    return null;
  }
};
*/

