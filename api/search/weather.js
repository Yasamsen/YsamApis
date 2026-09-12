module.exports = {
  meta: {
    name: 'Weather Search',
    description: 'Get current weather information for any city worldwide.',
    category: 'Search',
    method: 'GET',
    status: 'online',
    featured: false,
    tags: ['weather', 'climate', 'forecast'],
    parameters: [
      {
        name: 'city',
        type: 'string',
        required: true,
        description: 'City name (e.g. Jakarta, Tokyo)'
      },
      {
        name: 'units',
        type: 'string',
        required: false,
        description: 'Temperature units (metric, imperial)',
        default: 'metric'
      }
    ],
    responseExample: {
      status: true,
      creator: 'SamApi',
      result: {
        city: 'Jakarta',
        temperature: 30,
        condition: 'Partly Cloudy',
        humidity: 75
      }
    }
  },

  async handler(params) {
    const { city, units = 'metric' } = params;

    if (!city) {
      return { status: false, message: 'Parameter "city" is required' };
    }

    // Simulated weather data
    const temps = { metric: 28 + Math.floor(Math.random() * 8), imperial: 82 + Math.floor(Math.random() * 15) };
    const conditions = ['Sunny', 'Partly Cloudy', 'Cloudy', 'Light Rain', 'Clear'];

    return {
      status: true,
      creator: 'SamApi',
      result: {
        city: city,
        temperature: temps[units] || temps.metric,
        units: units === 'imperial' ? '°F' : '°C',
        condition: conditions[Math.floor(Math.random() * conditions.length)],
        humidity: 60 + Math.floor(Math.random() * 30),
        wind: Math.floor(Math.random() * 20) + 5,
        updated: new Date().toISOString()
      }
    };
  }
};
