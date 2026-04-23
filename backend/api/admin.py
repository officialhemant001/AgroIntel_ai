"""
AgroIntel Admin Configuration

Registers all models with Django Admin for management.
"""

from django.contrib import admin
from .models import CropScan, ChatMessage, Disease, Pest, Fertilizer, Medicine


@admin.register(Disease)
class DiseaseAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'plant_name', 'severity', 'is_active', 'created_at']
    list_filter = ['severity', 'is_active', 'plant_name']
    search_fields = ['name', 'plant_name', 'cause']
    readonly_fields = ['created_at']
    ordering = ['name']


@admin.register(Pest)
class PestAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'scientific_name', 'damage_level', 'is_active', 'created_at']
    list_filter = ['damage_level', 'is_active']
    search_fields = ['name', 'scientific_name', 'identification_features']
    readonly_fields = ['created_at']
    ordering = ['name']


@admin.register(Fertilizer)
class FertilizerAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'type', 'frequency', 'is_active', 'created_at']
    list_filter = ['type', 'is_active']
    search_fields = ['name', 'benefits', 'application_method']
    readonly_fields = ['created_at']
    ordering = ['name']


@admin.register(Medicine)
class MedicineAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'type', 'safety_period', 'is_active', 'created_at']
    list_filter = ['type', 'is_active']
    search_fields = ['name', 'dosage', 'application_method']
    readonly_fields = ['created_at']
    ordering = ['name']


@admin.register(CropScan)
class CropScanAdmin(admin.ModelAdmin):
    list_display = ['id', 'plant_name', 'disease', 'confidence', 'severity', 'database_verified', 'created_at']
    list_filter = ['severity', 'database_verified', 'severity_color', 'created_at']
    search_fields = ['disease', 'plant_name', 'pest', 'treatment']
    readonly_fields = ['created_at']
    ordering = ['-created_at']


@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ['id', 'role', 'short_message', 'language', 'session_id', 'created_at']
    list_filter = ['role', 'language', 'created_at']
    search_fields = ['message']
    ordering = ['-created_at']

    def short_message(self, obj):
        return obj.message[:80] + '...' if len(obj.message) > 80 else obj.message
    short_message.short_description = 'Message'
