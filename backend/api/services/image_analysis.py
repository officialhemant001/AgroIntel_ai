"""
AgroIntel Image Analysis Service

Production-grade image analysis using:
1. Gemini Vision API for real crop disease detection
2. OpenCV preprocessing pipeline
3. Database cross-verification
4. Failsafe fallback system
"""

import os
import logging
import numpy as np
import cv2
from django.conf import settings

logger = logging.getLogger('api')

# Suppress TF logs if TF is ever loaded
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'


# ============================================
# Severity Helpers
# ============================================
def get_severity_color(severity):
    """Map severity level to frontend color."""
    mapping = {
        'none': 'green',
        'low': 'green',
        'medium': 'yellow',
        'high': 'red',
        'unknown': 'yellow',
    }
    return mapping.get(severity, 'yellow')


def build_card_title(disease, severity):
    """Generate a card title for frontend display."""
    if disease in ('Healthy', 'No Disease'):
        return 'Healthy Crop — No Issues Detected'
    severity_label = severity.capitalize() if severity else 'Unknown'
    return f"{disease} — {severity_label} Severity"


def build_short_summary(disease, confidence):
    """Generate a short summary for frontend display."""
    if disease in ('Healthy', 'No Disease'):
        return f"Crop appears healthy with {confidence}% confidence"
    return f"{disease} detected with {confidence}% confidence"


# ============================================
# Image Preprocessing Pipeline
# ============================================
class ImagePreprocessor:
    """OpenCV-based image preprocessing for better AI analysis."""

    @staticmethod
    def preprocess(image_file):
        """
        Full preprocessing pipeline:
        1. Decode image from uploaded file
        2. Auto-orient and resize
        3. Enhance contrast and sharpness
        4. Normalize for model input
        """
        image_bytes = image_file.read()
        image_file.seek(0)  # Reset pointer

        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
            raise ValueError("Image could not be decoded — invalid format")

        # Step 1: Resize to standard input
        img_resized = cv2.resize(img, (224, 224))

        # Step 2: Enhance contrast using CLAHE
        lab = cv2.cvtColor(img_resized, cv2.COLOR_BGR2LAB)
        l_channel, a, b = cv2.split(lab)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        cl = clahe.apply(l_channel)
        enhanced = cv2.merge((cl, a, b))
        enhanced = cv2.cvtColor(enhanced, cv2.COLOR_LAB2BGR)

        # Step 3: Slight sharpening
        kernel = np.array([[0, -1, 0], [-1, 5, -1], [0, -1, 0]])
        sharpened = cv2.filter2D(enhanced, -1, kernel)

        # Step 4: Normalize
        normalized = sharpened / 255.0

        return normalized

    @staticmethod
    def get_image_bytes(image_file):
        """Get raw bytes for Vision API."""
        image_bytes = image_file.read()
        image_file.seek(0)
        return image_bytes


# ============================================
# Gemini Vision Analyzer
# ============================================
class GeminiVisionAnalyzer:
    """Uses Google Gemini Vision API for real crop disease detection."""

    def __init__(self):
        self._model = None

    def _get_model(self):
        """Lazy-load Gemini model."""
        if self._model is None:
            import google.generativeai as genai
            api_key = os.environ.get('GEMINI_API_KEY') or os.environ.get('GOOGLE_API_KEY')
            if not api_key:
                raise ValueError("GEMINI_API_KEY is not set")
            genai.configure(api_key=api_key)
            self._model = genai.GenerativeModel('gemini-1.5-flash')
        return self._model

    def analyze_crop_image(self, image_bytes):
        """
        Send image to Gemini Vision for crop disease analysis.
        Returns structured disease detection result.
        """
        import json
        try:
            model = self._get_model()

            prompt = """You are an expert agricultural AI. Analyze this crop/plant leaf image and provide a JSON response with EXACTLY this structure (no markdown, just raw JSON):
{
    "disease": "Disease Name or 'Healthy'",
    "plant_name": "Identified plant/crop name",
    "confidence": 85.5,
    "severity": "none|low|medium|high",
    "symptoms": ["symptom1", "symptom2"],
    "cause": "Brief cause description",
    "pest": "Pest name or 'None'",
    "is_leaf_image": true
}

Rules:
- If the plant appears healthy, set disease to "Healthy" and severity to "none"
- Confidence should be 0-100 percentage
- If the image is not a plant/leaf, set disease to "Analysis Inconclusive" and confidence to 0
- Focus on common Indian crop diseases
- Be specific about the disease name"""

            # Create image part for Gemini
            import PIL.Image
            import io
            pil_image = PIL.Image.open(io.BytesIO(image_bytes))

            response = model.generate_content([prompt, pil_image])
            text = response.text.strip()

            # Clean markdown fences if present
            if text.startswith('```'):
                text = text.split('\n', 1)[1] if '\n' in text else text[3:]
            if text.endswith('```'):
                text = text[:-3]
            if text.startswith('json'):
                text = text[4:]
            text = text.strip()

            result = json.loads(text)
            result['confidence'] = round(float(result.get('confidence', 0)), 2)
            logger.info(f"Gemini Vision: Detected {result.get('disease')} with {result.get('confidence')}% confidence")
            return result

        except json.JSONDecodeError as e:
            logger.error(f"Gemini Vision: JSON parse error: {e}")
            return None
        except Exception as e:
            logger.error(f"Gemini Vision analysis failed: {e}")
            return None

    def analyze_soil_image(self, image_bytes):
        """Analyze soil image for type, color, texture estimation."""
        import json
        try:
            model = self._get_model()

            prompt = """You are an expert soil scientist and agronomist. Analyze this soil image with maximum accuracy and provide a JSON response.
Carefully examine the visual characteristics (color, granularity, clumps, moisture sheen) to accurately determine the soil properties.

Provide EXACTLY this JSON structure (no markdown, no backticks, just raw JSON):
{
    "soil_type": "Specific soil type (e.g., Black Cotton, Red Laterite, Alluvial, Clay Loam, Sandy)",
    "color": "Exact visual color description",
    "texture": "Fine|Medium|Coarse",
    "estimated_ph": 6.5,
    "moisture_level": "Dry|Moist|Wet|Waterlogged",
    "organic_matter": "Low|Medium|High",
    "suitability": ["List of top 4 highly suitable crops"],
    "recommendations": ["Scientific fertilizer recommendation", "Actionable soil improvement step"],
    "is_soil_image": true
}

Rules:
- Give highly accurate and scientifically plausible estimations based on the visual evidence.
- Focus strictly on Indian agriculture soil contexts.
- Provide highly practical and specific recommendations.
- If it is definitively NOT a soil image, set is_soil_image to false.
- You MUST return ONLY valid JSON."""

            import PIL.Image
            import io
            pil_image = PIL.Image.open(io.BytesIO(image_bytes))

            response = model.generate_content([prompt, pil_image])
            text = response.text.strip()

            if text.startswith('```'):
                text = text.split('\n', 1)[1] if '\n' in text else text[3:]
            if text.endswith('```'):
                text = text[:-3]
            if text.startswith('json'):
                text = text[4:]
            text = text.strip()

            result = json.loads(text)
            logger.info(f"Soil Analysis: Type={result.get('soil_type')}")
            return result

        except Exception as e:
            logger.error(f"Soil image analysis failed: {e}")
            return None


# Singleton
_gemini_analyzer = None


def get_gemini_analyzer():
    global _gemini_analyzer
    if _gemini_analyzer is None:
        _gemini_analyzer = GeminiVisionAnalyzer()
    return _gemini_analyzer


# ============================================
# Main Analysis Pipeline
# ============================================
class AgroAI:
    """Handles AI inference for crop disease and pest detection."""

    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(AgroAI, cls).__new__(cls)
            cls._instance.initialized = False
        return cls._instance

    def initialize(self):
        """Initialize the AI pipeline."""
        if self.initialized:
            return
        self.preprocessor = ImagePreprocessor()
        self.initialized = True
        logger.info("AgroAI: Pipeline initialized")

    def analyze(self, image_file):
        """
        Full analysis pipeline:
        1. Preprocess image
        2. Try Gemini Vision API for real analysis
        3. Fallback to simulation if API fails
        4. Cross-check with database
        5. Run RAG agent pipeline for treatment
        6. Return structured response
        """
        self.initialize()

        try:
            # Step 1: Get image bytes for Vision API
            image_bytes = ImagePreprocessor.get_image_bytes(image_file)

            # Step 2: Try Gemini Vision for real analysis
            analyzer = get_gemini_analyzer()
            ai_result = analyzer.analyze_crop_image(image_bytes)

            # Step 3: Fallback to simulation if Vision API fails
            if ai_result is None or not ai_result.get('disease'):
                logger.warning("AgroAI: Gemini Vision failed, using simulation fallback")
                preprocessed = ImagePreprocessor.preprocess(image_file)
                ai_result = self._run_simulated_inference(preprocessed)

            # Step 4: Cross-check with database
            enriched = self._enrich_from_database(ai_result)

            # Step 5: Run RAG Agent Pipeline
            try:
                from ..agents import run_agent_pipeline
                pipeline_result = run_agent_pipeline(None, image_file, ai_result)
                enriched['treatment'] = pipeline_result['treatment_recommendation']
                enriched['database_verified'] = True
            except Exception as e:
                logger.warning(f"AgroAI: Agent pipeline skipped: {e}")

            return enriched

        except Exception as e:
            logger.error(f"AgroAI: Analysis pipeline failed: {e}", exc_info=True)
            return self._database_only_fallback()

    def _run_simulated_inference(self, preprocessed_image):
        """Fallback: returns an honest 'unavailable' result when Vision API fails."""
        logger.warning("AgroAI: Vision API unavailable, returning analysis-unavailable response")
        return {
            'disease': 'Analysis Unavailable',
            'plant_name': 'Unknown',
            'confidence': 0,
            'severity': 'unknown',
            'symptoms': [],
            'cause': 'AI vision service is temporarily unavailable',
            'pest': 'None',
            'is_leaf_image': True,
        }

    def _enrich_from_database(self, ai_result):
        """Cross-check AI result with backend database for verified treatment data."""
        from ..models import Disease, Pest, Fertilizer, Medicine

        disease_name = ai_result.get('disease', '')
        plant_name = ai_result.get('plant_name', '')
        pest_name = ai_result.get('pest', 'None')
        confidence = ai_result.get('confidence', 0)
        severity = ai_result.get('severity', 'unknown')

        response = {
            'plant_name': plant_name,
            'disease_detected': disease_name,
            'disease': disease_name,
            'confidence': confidence,
            'severity': severity,
            'symptoms': ai_result.get('symptoms', []),
            'cause': ai_result.get('cause', ''),
            'treatment': '',
            'organic_treatment': [],
            'chemical_treatment': [],
            'dosage': '',
            'fertilizer': '',
            'fertilizer_plan': [],
            'watering_schedule': '',
            'pest': pest_name,
            'pest_control': [],
            'medicine_list': [],
            'prevention': '',
            'database_verified': False,
            'short_summary': build_short_summary(disease_name, confidence),
            'card_title': build_card_title(disease_name, severity),
            'severity_color': get_severity_color(severity),
        }

        # Disease lookup
        try:
            db_disease = Disease.objects.filter(
                name__icontains=disease_name.split('(')[0].strip(),
                is_active=True,
            ).first()

            if db_disease:
                response['symptoms'] = db_disease.symptoms or response['symptoms']
                response['cause'] = db_disease.cause or response['cause']
                response['organic_treatment'] = db_disease.organic_treatment or []
                response['chemical_treatment'] = db_disease.chemical_treatment or []
                response['dosage'] = db_disease.dosage or ''
                response['prevention'] = '; '.join(db_disease.prevention) if db_disease.prevention else ''
                response['watering_schedule'] = db_disease.watering_schedule or ''
                response['fertilizer_plan'] = db_disease.fertilizer_plan or []
                response['database_verified'] = True

                all_treatments = (db_disease.organic_treatment or []) + (db_disease.chemical_treatment or [])
                response['treatment'] = '; '.join(all_treatments[:3]) if all_treatments else ''
                logger.info(f"AgroAI: Disease '{disease_name}' matched in database")
        except Exception as e:
            logger.error(f"AgroAI: Disease DB lookup failed: {e}")

        # Pest lookup
        if pest_name and pest_name != 'None':
            try:
                db_pest = Pest.objects.filter(
                    name__icontains=pest_name.split('(')[0].strip(),
                    is_active=True,
                ).first()
                if db_pest:
                    response['pest_control'] = db_pest.control_methods or []
                    response['pest'] = db_pest.name
                    response['database_verified'] = True
            except Exception as e:
                logger.error(f"AgroAI: Pest DB lookup failed: {e}")

        # Fertilizer lookup
        try:
            db_fertilizers = Fertilizer.objects.filter(
                suitable_crops__icontains=plant_name,
                is_active=True,
            )[:3]
            if db_fertilizers:
                fert_names = [f.name for f in db_fertilizers]
                response['fertilizer'] = ', '.join(fert_names)
                response['fertilizer_plan'] = response['fertilizer_plan'] or fert_names
        except Exception as e:
            logger.error(f"AgroAI: Fertilizer DB lookup failed: {e}")

        # Medicine lookup
        try:
            if disease_name and disease_name not in ('Healthy', 'No Disease'):
                db_medicines = Medicine.objects.filter(
                    target_diseases__icontains=disease_name.split('(')[0].strip(),
                    is_active=True,
                )[:3]
                if db_medicines:
                    response['medicine_list'] = [m.name for m in db_medicines]
                elif pest_name and pest_name != 'None':
                    db_medicines = Medicine.objects.filter(
                        target_pests__icontains=pest_name.split('(')[0].strip(),
                        is_active=True,
                    )[:3]
                    if db_medicines:
                        response['medicine_list'] = [m.name for m in db_medicines]
        except Exception as e:
            logger.error(f"AgroAI: Medicine DB lookup failed: {e}")

        return response

    def _database_only_fallback(self):
        """FAILSAFE: When AI completely fails."""
        logger.warning("AgroAI: FAILSAFE activated")
        return {
            'status': 'fallback',
            'message': 'AI temporarily unavailable',
            'plant_name': 'Unknown',
            'disease_detected': 'Analysis Inconclusive',
            'disease': 'Analysis Inconclusive',
            'confidence': 0.0,
            'severity': 'unknown',
            'symptoms': ['Unable to determine'],
            'cause': 'Please upload a clearer image',
            'treatment': 'Please consult a local agriculture expert',
            'organic_treatment': [], 'chemical_treatment': [],
            'dosage': '', 'fertilizer': '', 'fertilizer_plan': [],
            'watering_schedule': '', 'pest': '', 'pest_control': [],
            'medicine_list': [], 'prevention': 'Regular monitoring recommended',
            'database_verified': False,
            'short_summary': 'Analysis inconclusive',
            'card_title': 'Analysis Inconclusive',
            'severity_color': 'yellow',
        }


# Singleton instance
agro_ai = AgroAI()


def analyze_image(image_file):
    """Main entry point for image analysis."""
    return agro_ai.analyze(image_file)


def analyze_soil(image_file):
    """Main entry point for soil image analysis."""
    image_bytes = ImagePreprocessor.get_image_bytes(image_file)
    analyzer = get_gemini_analyzer()
    result = analyzer.analyze_soil_image(image_bytes)
    if result is None:
        return {
            'soil_type': 'Unknown',
            'color': 'Unable to determine',
            'texture': 'Unknown',
            'estimated_ph': 7.0,
            'moisture_level': 'Unknown',
            'organic_matter': 'Unknown',
            'suitability': [],
            'recommendations': ['Upload a clearer soil image for accurate analysis'],
            'is_soil_image': False,
        }
    return result
