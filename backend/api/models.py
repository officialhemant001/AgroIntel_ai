"""
AgroIntel API Models

Defines the database schema for:
- Crop scans and AI analysis results
- Chat messages for AI assistant
- Agriculture knowledge base (diseases, pests, fertilizers, medicines)
"""

from django.db import models
from django.contrib.auth.models import User


# ============================================
# Agriculture Knowledge Base Models
# ============================================

class Disease(models.Model):
    """Agriculture disease database — cross-referenced by AI pipeline."""

    SEVERITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
    ]

    name = models.CharField(max_length=200, unique=True)
    plant_name = models.CharField(max_length=200, help_text='Primary affected plant/crop')
    symptoms = models.JSONField(default=list, help_text='List of symptom strings')
    cause = models.TextField(blank=True, default='')
    organic_treatment = models.JSONField(default=list, help_text='List of organic treatment options')
    chemical_treatment = models.JSONField(default=list, help_text='List of chemical treatment options')
    dosage = models.TextField(blank=True, default='')
    prevention = models.JSONField(default=list, help_text='List of prevention tips')
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES, default='medium')
    watering_schedule = models.TextField(blank=True, default='')
    fertilizer_plan = models.JSONField(default=list, help_text='Recommended fertilizers')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']
        verbose_name = 'Disease'
        verbose_name_plural = 'Diseases'

    def __str__(self):
        return f"{self.name} ({self.plant_name})"


class Pest(models.Model):
    """Pest database for crop pest identification."""

    DAMAGE_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
    ]

    name = models.CharField(max_length=200, unique=True)
    scientific_name = models.CharField(max_length=200, blank=True, default='')
    affected_crops = models.JSONField(default=list, help_text='List of affected crop names')
    damage_level = models.CharField(max_length=20, choices=DAMAGE_CHOICES, default='medium')
    control_methods = models.JSONField(default=list, help_text='Control/treatment methods')
    prevention = models.JSONField(default=list, help_text='Prevention tips')
    identification_features = models.TextField(blank=True, default='')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']
        verbose_name = 'Pest'
        verbose_name_plural = 'Pests'

    def __str__(self):
        return f"{self.name} ({self.scientific_name})"


class Fertilizer(models.Model):
    """Fertilizer database for crop nutrition recommendations."""

    TYPE_CHOICES = [
        ('organic', 'Organic'),
        ('chemical', 'Chemical'),
        ('mixed', 'Mixed'),
    ]

    name = models.CharField(max_length=200, unique=True)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='chemical')
    suitable_crops = models.JSONField(default=list, help_text='List of suitable crop names')
    application_method = models.TextField(blank=True, default='')
    dosage = models.TextField(blank=True, default='')
    frequency = models.CharField(max_length=200, blank=True, default='')
    benefits = models.TextField(blank=True, default='')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']
        verbose_name = 'Fertilizer'
        verbose_name_plural = 'Fertilizers'

    def __str__(self):
        return f"{self.name} ({self.get_type_display()})"


class Medicine(models.Model):
    """Agriculture medicine/pesticide database."""

    TYPE_CHOICES = [
        ('fungicide', 'Fungicide'),
        ('pesticide', 'Pesticide'),
        ('herbicide', 'Herbicide'),
        ('growth_regulator', 'Growth Regulator'),
        ('bactericide', 'Bactericide'),
    ]

    name = models.CharField(max_length=200, unique=True)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='fungicide')
    target_diseases = models.JSONField(default=list, help_text='Diseases this medicine treats')
    target_pests = models.JSONField(default=list, help_text='Pests this medicine controls')
    dosage = models.TextField(blank=True, default='')
    application_method = models.TextField(blank=True, default='')
    safety_period = models.CharField(max_length=200, blank=True, default='', help_text='Waiting period before harvest')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']
        verbose_name = 'Medicine'
        verbose_name_plural = 'Medicines'

    def __str__(self):
        return f"{self.name} ({self.get_type_display()})"


# ============================================
# Core Application Models
# ============================================

class CropScan(models.Model):
    """Stores a crop/leaf scan analysis result with full AI + DB enrichment."""

    SEVERITY_CHOICES = [
        ('none', 'None'),
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('unknown', 'Unknown'),
    ]

    SEVERITY_COLOR_CHOICES = [
        ('green', 'Green'),
        ('yellow', 'Yellow'),
        ('red', 'Red'),
    ]

    user = models.ForeignKey(
        User, on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='scans',
        help_text='User who performed the scan (optional)',
    )
    image = models.ImageField(upload_to='scans/%Y/%m/%d/')

    # AI Detection Results
    plant_name = models.CharField(max_length=200, blank=True, default='')
    disease = models.CharField(max_length=200, blank=True, default='')
    confidence = models.FloatField(default=0.0, help_text='AI confidence score (0-100)')
    severity = models.CharField(
        max_length=20, choices=SEVERITY_CHOICES,
        default='unknown',
    )
    symptoms = models.JSONField(default=list, blank=True)
    cause = models.TextField(blank=True, default='')

    # Treatment Data
    treatment = models.TextField(blank=True, default='')
    organic_treatment = models.JSONField(default=list, blank=True)
    chemical_treatment = models.JSONField(default=list, blank=True)
    dosage = models.TextField(blank=True, default='')

    # Pest & Fertilizer
    pest = models.CharField(max_length=200, blank=True, default='')
    pest_control = models.JSONField(default=list, blank=True)
    fertilizer = models.CharField(max_length=300, blank=True, default='')
    fertilizer_plan = models.JSONField(default=list, blank=True)
    medicine_list = models.JSONField(default=list, blank=True)
    watering_schedule = models.TextField(blank=True, default='')

    # Prevention
    prevention = models.TextField(blank=True, default='')

    # Database Verification
    database_verified = models.BooleanField(default=False)

    # Frontend Support Fields
    short_summary = models.TextField(blank=True, default='')
    card_title = models.CharField(max_length=300, blank=True, default='')
    severity_color = models.CharField(
        max_length=10, choices=SEVERITY_COLOR_CHOICES,
        default='green',
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Crop Scan'
        verbose_name_plural = 'Crop Scans'

    def __str__(self):
        return f"{self.disease} ({self.confidence}%) - {self.created_at.strftime('%Y-%m-%d %H:%M')}"


class ChatMessage(models.Model):
    """Stores AI chat assistant conversation messages."""

    ROLE_CHOICES = [
        ('user', 'User'),
        ('assistant', 'Assistant'),
    ]

    user = models.ForeignKey(
        User, on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='chat_messages',
    )
    session_id = models.CharField(
        max_length=100, blank=True, default='',
        help_text='Session identifier for grouping conversations',
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    message = models.TextField()
    language = models.CharField(max_length=5, default='en')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']
        verbose_name = 'Chat Message'
        verbose_name_plural = 'Chat Messages'

    def __str__(self):
        return f"[{self.role}] {self.message[:60]}..."