"""
AgroIntel Crop Recommendation Service
Region-based, season-aware crop recommendations for Indian agriculture.
"""
import logging

logger = logging.getLogger('api')

INDIA_CROP_DATA = {
    'uttar pradesh': {
        'kharif': ['Rice', 'Sugarcane', 'Maize', 'Soybean', 'Groundnut'],
        'rabi': ['Wheat', 'Mustard', 'Potato', 'Peas', 'Lentils'],
        'zaid': ['Watermelon', 'Muskmelon', 'Cucumber', 'Moong Dal'],
        'soil_types': ['Alluvial', 'Clay'],
    },
    'punjab': {
        'kharif': ['Rice', 'Cotton', 'Maize', 'Sugarcane'],
        'rabi': ['Wheat', 'Barley', 'Mustard', 'Chickpea'],
        'zaid': ['Moong', 'Watermelon', 'Vegetables'],
        'soil_types': ['Alluvial', 'Sandy Loam'],
    },
    'maharashtra': {
        'kharif': ['Cotton', 'Soybean', 'Jowar', 'Bajra', 'Rice'],
        'rabi': ['Wheat', 'Gram', 'Onion', 'Sugarcane'],
        'zaid': ['Groundnut', 'Sunflower', 'Vegetables'],
        'soil_types': ['Black', 'Red', 'Laterite'],
    },
    'madhya pradesh': {
        'kharif': ['Soybean', 'Cotton', 'Rice', 'Maize'],
        'rabi': ['Wheat', 'Gram', 'Mustard', 'Lentils'],
        'zaid': ['Moong', 'Urad', 'Watermelon'],
        'soil_types': ['Black', 'Alluvial'],
    },
    'rajasthan': {
        'kharif': ['Bajra', 'Jowar', 'Groundnut', 'Guar'],
        'rabi': ['Wheat', 'Mustard', 'Barley', 'Gram'],
        'zaid': ['Watermelon', 'Cucumber'],
        'soil_types': ['Sandy', 'Arid'],
    },
    'karnataka': {
        'kharif': ['Rice', 'Ragi', 'Jowar', 'Cotton', 'Sugarcane'],
        'rabi': ['Wheat', 'Gram', 'Sunflower'],
        'zaid': ['Vegetables', 'Fruits'],
        'soil_types': ['Red', 'Black', 'Laterite'],
    },
    'west bengal': {
        'kharif': ['Rice', 'Jute', 'Maize'],
        'rabi': ['Wheat', 'Potato', 'Mustard', 'Lentils'],
        'zaid': ['Vegetables', 'Watermelon'],
        'soil_types': ['Alluvial', 'Laterite'],
    },
    'tamil nadu': {
        'kharif': ['Rice', 'Sugarcane', 'Cotton', 'Groundnut'],
        'rabi': ['Rice', 'Millets', 'Pulses'],
        'zaid': ['Vegetables', 'Banana'],
        'soil_types': ['Red', 'Black', 'Alluvial'],
    },
    'bihar': {
        'kharif': ['Rice', 'Maize', 'Sugarcane'],
        'rabi': ['Wheat', 'Lentils', 'Potato', 'Onion'],
        'zaid': ['Moong', 'Vegetables'],
        'soil_types': ['Alluvial', 'Clay'],
    },
    'gujarat': {
        'kharif': ['Cotton', 'Groundnut', 'Castor', 'Bajra'],
        'rabi': ['Wheat', 'Mustard', 'Cumin', 'Gram'],
        'zaid': ['Watermelon', 'Vegetables'],
        'soil_types': ['Black', 'Sandy', 'Alluvial'],
    },
}

def get_current_season():
    from datetime import datetime
    month = datetime.now().month
    if month in (6, 7, 8, 9): return 'kharif'
    elif month in (10, 11, 12, 1, 2): return 'rabi'
    else: return 'zaid'

def recommend_crops(state, season=None):
    """Get crop recommendations for an Indian state and season."""
    state_lower = state.lower().strip()
    if season is None:
        season = get_current_season()
    season = season.lower().strip()

    data = INDIA_CROP_DATA.get(state_lower)
    if not data:
        # Try partial match
        for key in INDIA_CROP_DATA:
            if state_lower in key or key in state_lower:
                data = INDIA_CROP_DATA[key]
                state_lower = key
                break

    if not data:
        return {
            'state': state, 'season': season,
            'crops': [], 'soil_types': [],
            'message': f'No specific data for {state}. Consult local agriculture office.',
        }

    crops = data.get(season, data.get('kharif', []))
    return {
        'state': state_lower.title(),
        'season': season.title(),
        'crops': crops,
        'soil_types': data.get('soil_types', []),
        'total_options': len(crops),
        'current_season': get_current_season().title(),
        'message': f"Recommended {len(crops)} crops for {state_lower.title()} in {season.title()} season",
    }

def get_all_states():
    """Return list of all supported states."""
    return sorted([s.title() for s in INDIA_CROP_DATA.keys()])
