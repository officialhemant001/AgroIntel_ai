"""
AgroIntel API URL Configuration

All API routes are prefixed with /api/v1/ (set in agrointel/urls.py).
"""

from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    # Health check
    path('health-check/', views.health_check, name='health_check'),

    # Auth
    path('auth/register/', views.register, name='register'),
    path('auth/login/', views.LoginView.as_view(), name='login'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Crop Scans
    path('scan/', views.scan_crop, name='scan_crop'),
    path('scan/history/', views.scan_history, name='scan_history'),
    path('scan/stats/', views.scan_stats, name='scan_stats'),
    path('scan/<int:scan_id>/', views.scan_detail, name='scan_detail'),

    # AI Chat
    path('chat/', views.chat, name='chat'),
    path('chat/history/', views.chat_history, name='chat_history'),

    # Weather
    path('weather/', views.weather, name='weather'),

    # Agriculture Database — Search & Query
    path('db/diseases/', views.list_diseases, name='list_diseases'),
    path('db/pests/', views.list_pests, name='list_pests'),
    path('db/fertilizers/', views.list_fertilizers, name='list_fertilizers'),
    path('db/medicines/', views.list_medicines, name='list_medicines'),
    path('db/search/', views.search_database, name='search_database'),
]