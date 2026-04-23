"""
AgroIntel API Serializers

Handles data validation and serialization for all API endpoints.
"""

from django.contrib.auth.models import User
from rest_framework import serializers
from .models import CropScan, ChatMessage, Disease, Pest, Fertilizer, Medicine


# ============================================
# Agriculture Knowledge Base Serializers
# ============================================

class DiseaseSerializer(serializers.ModelSerializer):
    """Serializer for disease database entries."""

    class Meta:
        model = Disease
        fields = [
            'id', 'name', 'plant_name', 'symptoms', 'cause',
            'organic_treatment', 'chemical_treatment', 'dosage',
            'prevention', 'severity', 'watering_schedule',
            'fertilizer_plan', 'is_active', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class PestSerializer(serializers.ModelSerializer):
    """Serializer for pest database entries."""

    class Meta:
        model = Pest
        fields = [
            'id', 'name', 'scientific_name', 'affected_crops',
            'damage_level', 'control_methods', 'prevention',
            'identification_features', 'is_active', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class FertilizerSerializer(serializers.ModelSerializer):
    """Serializer for fertilizer database entries."""

    class Meta:
        model = Fertilizer
        fields = [
            'id', 'name', 'type', 'suitable_crops',
            'application_method', 'dosage', 'frequency',
            'benefits', 'is_active', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class MedicineSerializer(serializers.ModelSerializer):
    """Serializer for medicine database entries."""

    class Meta:
        model = Medicine
        fields = [
            'id', 'name', 'type', 'target_diseases', 'target_pests',
            'dosage', 'application_method', 'safety_period',
            'is_active', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class SearchResultSerializer(serializers.Serializer):
    """Generic search result serializer for unified database queries."""
    name = serializers.CharField()
    details = serializers.CharField()
    treatment = serializers.CharField(required=False, default='')


# ============================================
# Crop Scan Serializers
# ============================================

class CropScanSerializer(serializers.ModelSerializer):
    """Serializer for crop scan results — full enriched response."""
    image_url = serializers.SerializerMethodField()
    treatment_data = serializers.SerializerMethodField()

    class Meta:
        model = CropScan
        fields = [
            'id', 'image', 'image_url',
            # AI Detection
            'plant_name', 'disease', 'confidence', 'severity',
            'symptoms', 'cause',
            # Treatment (structured)
            'treatment', 'treatment_data',
            'organic_treatment', 'chemical_treatment', 'dosage',
            # Pest & Fertilizer
            'pest', 'pest_control', 'fertilizer', 'fertilizer_plan',
            'medicine_list', 'watering_schedule',
            # Prevention
            'prevention',
            # Verification
            'database_verified',
            # Frontend Support
            'short_summary', 'card_title', 'severity_color',
            # Meta
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']

    def get_image_url(self, obj):
        """Return absolute URL for the uploaded image."""
        request = self.context.get('request')
        if obj.image and request:
            return request.build_absolute_uri(obj.image.url)
        return None

    def get_treatment_data(self, obj):
        """Return structured treatment object for frontend."""
        return {
            'organic': obj.organic_treatment or [],
            'chemical': obj.chemical_treatment or [],
            'dosage': obj.dosage or '',
        }


class CropScanUploadSerializer(serializers.Serializer):
    """Validates image upload for scanning."""
    image = serializers.ImageField(required=True, help_text='Crop/leaf image file')

    def validate_image(self, value):
        """Validate image file size and type."""
        max_size = 10 * 1024 * 1024  # 10 MB
        if value.size > max_size:
            raise serializers.ValidationError('Image size must be less than 10MB.')

        valid_types = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
        if value.content_type not in valid_types:
            raise serializers.ValidationError(
                f'Unsupported image type: {value.content_type}. '
                'Supported: JPEG, PNG, WEBP.'
            )
        return value


# ============================================
# Chat Serializers
# ============================================

class ChatMessageSerializer(serializers.ModelSerializer):
    """Serializer for chat messages."""

    class Meta:
        model = ChatMessage
        fields = ['id', 'role', 'message', 'language', 'created_at']
        read_only_fields = ['id', 'created_at']


class ChatInputSerializer(serializers.Serializer):
    """Validates chat input from user."""
    message = serializers.CharField(
        max_length=2000,
        required=True,
        help_text='User question or message',
    )
    language = serializers.ChoiceField(
        choices=[('en', 'English'), ('hi', 'Hindi')],
        default='en',
    )
    session_id = serializers.CharField(
        max_length=100, required=False, default='',
    )


# ============================================
# Auth Serializers
# ============================================

class RegisterSerializer(serializers.Serializer):
    """Validates user registration data."""
    name = serializers.CharField(max_length=150, required=True)
    email = serializers.EmailField(required=True)
    password = serializers.CharField(min_length=4, write_only=True, required=True)

    def validate_email(self, value):
        """Check that email is unique."""
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError('A user with this email already exists.')
        return value

    def create(self, validated_data):
        """Create a new user."""
        user = User.objects.create_user(
            username=validated_data['email'],  # Use email as username
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data['name'],
        )
        return user


class LoginSerializer(serializers.Serializer):
    """Validates login credentials — accepts email OR username."""
    email = serializers.CharField(required=False)
    username = serializers.CharField(required=False)
    password = serializers.CharField(required=True)

    def validate(self, attrs):
        if not attrs.get('email') and not attrs.get('username'):
            raise serializers.ValidationError('Either email or username is required.')
        return attrs


class UserSerializer(serializers.ModelSerializer):
    """Serializer for user profile data."""
    name = serializers.CharField(source='first_name')

    class Meta:
        model = User
        fields = ['id', 'name', 'email', 'date_joined']
        read_only_fields = ['id', 'date_joined']
