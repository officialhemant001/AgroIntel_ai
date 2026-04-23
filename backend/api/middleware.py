import logging
import time

logger = logging.getLogger('api')

class RequestLoggingMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Log request start
        start_time = time.time()
        logger.info(f"API Request: {request.method} {request.get_full_path()}")

        # Process the request
        response = self.get_response(request)

        # Calculate duration
        duration = time.time() - start_time

        # Log the response status and error details
        if response.status_code >= 400:
            logger.error(f"API Error: {request.method} {request.get_full_path()} - Status: {response.status_code} - Duration: {duration:.2f}s")
        else:
            logger.info(f"API Response: {request.method} {request.get_full_path()} - Status: {response.status_code} - Duration: {duration:.2f}s")

        return response
