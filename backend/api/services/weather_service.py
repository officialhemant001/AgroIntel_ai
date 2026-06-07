"""
AgroIntel Weather Service
Real OpenWeather API integration with farming alerts.
"""
import os, logging, random
from datetime import datetime

logger = logging.getLogger('api')

def get_weather_data(city='Lucknow'):
    api_key = os.environ.get('OPENWEATHER_API_KEY', '')
    if api_key:
        try:
            import requests
            params = {'q': f"{city},IN", 'appid': api_key, 'units': 'metric'}
            r = requests.get("https://api.openweathermap.org/data/2.5/weather", params=params, timeout=10)
            r.raise_for_status()
            d = r.json()
            rain_pct = 85 if 'rain' in d else max(10, d.get('clouds',{}).get('all',20))
            weather = {
                'city': city, 'temperature': round(d['main']['temp']),
                'humidity': d['main']['humidity'],
                'description': d['weather'][0]['description'].title(),
                'icon': d['weather'][0]['icon'],
                'wind_speed': f"{round(d['wind']['speed']*3.6)} km/h",
                'rain_chance': f"{rain_pct}%",
                'source': 'OpenWeather API',
            }
            weather['farming_alerts'] = _alerts(weather)
            return weather
        except Exception as e:
            logger.error(f"Weather API failed: {e}")
    return _simulate(city)

def _simulate(city):
    month = datetime.now().month
    if month in (12,1,2): t=(8,22); h=(30,60); desc=['Clear','Foggy']; rn=(5,15)
    elif month in (3,4,5): t=(30,45); h=(20,45); desc=['Hot','Hazy']; rn=(5,20)
    elif month in (6,7,8,9): t=(25,35); h=(70,95); desc=['Heavy Rain','Showers']; rn=(60,95)
    else: t=(18,32); h=(40,70); desc=['Cloudy','Pleasant']; rn=(10,30)
    w = {
        'city': city, 'temperature': random.randint(*t), 'humidity': random.randint(*h),
        'description': random.choice(desc), 'icon': '02d',
        'wind_speed': f"{random.randint(5,25)} km/h", 'rain_chance': f"{random.randint(*rn)}%",
        'source': 'AgroIntel Simulated',
    }
    w['farming_alerts'] = _alerts(w)
    return w

def _alerts(w):
    alerts = []
    t, h = w['temperature'], w['humidity']
    rn = int(str(w['rain_chance']).replace('%',''))
    if t > 40: alerts.append({'type':'danger','message':'🔥 Extreme heat — irrigate crops immediately'})
    elif t > 35: alerts.append({'type':'warning','message':'☀️ High temp — increase watering'})
    if t < 5: alerts.append({'type':'danger','message':'❄️ Frost risk — protect crops'})
    if rn > 70: alerts.append({'type':'warning','message':'🌧️ Heavy rain — ensure drainage'})
    if h > 85: alerts.append({'type':'warning','message':'💧 High humidity — watch for fungal diseases'})
    if not alerts: alerts.append({'type':'success','message':'✅ Favorable weather for farming'})
    return alerts
