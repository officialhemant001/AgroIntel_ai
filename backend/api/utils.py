"""
AgroIntel Utility Helpers
Slim utility module — core logic moved to services/.
"""
import logging
from rest_framework.views import exception_handler

logger = logging.getLogger('api')


# ============================================
# Custom DRF Exception Handler
# ============================================
def custom_exception_handler(exc, context):
    """Wrap all DRF errors in a consistent JSON envelope."""
    response = exception_handler(exc, context)
    if response is not None:
        response.data = {
            'success': False,
            'data': None,
            'error': response.data,
        }
    return response


# ============================================
# Consistent API Response Helpers
# ============================================
def api_success(data=None, message=None):
    """Return a standardized success response dict."""
    result = {'success': True, 'data': data, 'error': None}
    if message:
        result['message'] = message
    return result


def api_error(error):
    """Return a standardized error response dict."""
    return {'success': False, 'data': None, 'error': str(error)}


# ============================================
# Re-exports from services (backward compatibility)
# ============================================
def analyze_image(image_file):
    """Main entry point for image analysis."""
    from .services.image_analysis import analyze_image as _analyze
    return _analyze(image_file)


def analyze_soil(image_file):
    """Main entry point for soil analysis."""
    from .services.image_analysis import analyze_soil as _analyze_soil
    return _analyze_soil(image_file)


def generate_chat_response(message, lang='en', user=None, session_id=''):
    """Generate AI chat response using multi-agent system."""
    from .agents import run_chat_agent
    result = run_chat_agent(message, lang, user, session_id)
    return result


def get_weather_data(city='Lucknow'):
    """Fetch weather data."""
    from .services.weather_service import get_weather_data as _get_weather
    return _get_weather(city)