"""
AgroIntel API Views — Production Grade

Endpoints: health, auth, scan, chat, weather, soil, crop recommend, dashboard, database
"""
import logging
from django.contrib.auth.models import User
from django.db.models import Q, Avg, Count
from rest_framework.decorators import api_view, parser_classes, permission_classes, throttle_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.throttling import ScopedRateThrottle
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import CropScan, ChatMessage, Disease, Pest, Fertilizer, Medicine
from .serializers import (
    CropScanSerializer, CropScanUploadSerializer,
    ChatInputSerializer, ChatMessageSerializer,
    RegisterSerializer, UserSerializer,
    DiseaseSerializer, PestSerializer, FertilizerSerializer, MedicineSerializer,
)
from .utils import analyze_image, generate_chat_response, get_weather_data, api_success, api_error

logger = logging.getLogger('api')

SAFE_ERROR = "An error occurred. Please try again later."


# ============================================
# Health Check
# ============================================
@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """System health check endpoint."""
    return Response(api_success({
        'status': 'healthy',
        'service': 'AgroIntel API',
        'version': '3.0.0',
    }))


# ============================================
# Crop Scan
# ============================================
@api_view(['POST'])
@parser_classes([MultiPartParser, FormParser])
@permission_classes([IsAuthenticated])
def scan_crop(request):
    """Upload a crop/leaf image for AI analysis."""
    request.throttle_scope = 'scan'
    try:
        serializer = CropScanUploadSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(api_error(serializer.errors), status=status.HTTP_400_BAD_REQUEST)

        image = serializer.validated_data['image']
        logger.info(f"Scan started: {image.name} by {request.user.username}")
        result = analyze_image(image)

        if result.get('disease') == 'Analysis Inconclusive' and result.get('confidence', 0) == 0:
            return Response(api_success({
                'status': 'error',
                'message': 'Image not clear, please upload again',
                **result,
            }))

        scan = CropScan.objects.create(
            user=request.user, image=image,
            plant_name=result.get('plant_name', ''),
            disease=result.get('disease', ''),
            confidence=result.get('confidence', 0.0),
            severity=result.get('severity', 'unknown'),
            symptoms=result.get('symptoms', []),
            cause=result.get('cause', ''),
            treatment=result.get('treatment', ''),
            organic_treatment=result.get('organic_treatment', []),
            chemical_treatment=result.get('chemical_treatment', []),
            dosage=result.get('dosage', ''),
            pest=result.get('pest', ''),
            pest_control=result.get('pest_control', []),
            fertilizer=result.get('fertilizer', ''),
            fertilizer_plan=result.get('fertilizer_plan', []),
            medicine_list=result.get('medicine_list', []),
            watering_schedule=result.get('watering_schedule', ''),
            prevention=result.get('prevention', ''),
            database_verified=result.get('database_verified', False),
            short_summary=result.get('short_summary', ''),
            card_title=result.get('card_title', ''),
            severity_color=result.get('severity_color', 'green'),
        )

        data = CropScanSerializer(scan, context={'request': request}).data
        logger.info(f"Scan saved: ID={scan.id}, Disease={scan.disease}")
        return Response(api_success(data, 'Scan completed'), status=status.HTTP_201_CREATED)

    except Exception as e:
        logger.error(f"Scan failed: {e}", exc_info=True)
        return Response(api_error(SAFE_ERROR), status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def scan_history(request):
    """Get scan history for the current user."""
    try:
        limit = min(int(request.GET.get('limit', 20)), 100)
        scans = CropScan.objects.filter(user=request.user)[:limit]
        data = CropScanSerializer(scans, many=True, context={'request': request}).data
        return Response(api_success({
            'scans': data,
            'total': CropScan.objects.filter(user=request.user).count(),
        }))
    except Exception as e:
        logger.error(f"History failed: {e}", exc_info=True)
        return Response(api_error(SAFE_ERROR), status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def scan_detail(request, scan_id):
    """Get a specific scan result by ID."""
    try:
        scan = CropScan.objects.get(id=scan_id, user=request.user)
        return Response(api_success(CropScanSerializer(scan, context={'request': request}).data))
    except CropScan.DoesNotExist:
        return Response(api_error('Scan not found'), status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Scan detail failed: {e}", exc_info=True)
        return Response(api_error(SAFE_ERROR), status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def scan_stats(request):
    """Get aggregate scan statistics for the dashboard."""
    try:
        scans = CropScan.objects.filter(user=request.user)
        total = scans.count()
        diseases = scans.exclude(disease__in=['', 'Healthy', 'Analysis Inconclusive']).count()
        avg_conf = scans.aggregate(avg=Avg('confidence'))['avg'] or 0
        healthy = scans.filter(disease='Healthy').count()
        score = round((healthy / max(total, 1)) * 100)
        verified = scans.filter(database_verified=True).count()

        return Response(api_success({
            'total_scans': total,
            'diseases_found': diseases,
            'treatments_given': scans.exclude(treatment='').count(),
            'health_score': f"{score}%",
            'avg_confidence': round(avg_conf, 1),
            'db_verified_count': verified,
        }))
    except Exception as e:
        logger.error(f"Stats failed: {e}", exc_info=True)
        return Response(api_error(SAFE_ERROR), status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ============================================
# AI Chat
# ============================================
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def chat(request):
    """Send a message to the AI chat assistant."""
    request.throttle_scope = 'chat'
    try:
        serializer = ChatInputSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(api_error(serializer.errors), status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        user_message = data['message']
        language = data.get('language', 'en')
        session_id = data.get('session_id', '')

        ChatMessage.objects.create(
            user=request.user, role='user', message=user_message,
            language=language, session_id=session_id,
        )

        result = generate_chat_response(user_message, language, request.user, session_id)

        # result is now a dict with response, agent, agent_type
        ai_response = result.get('response', str(result)) if isinstance(result, dict) else str(result)
        agent_name = result.get('agent', '🤖 Assistant') if isinstance(result, dict) else '🤖 Assistant'
        agent_type = result.get('agent_type', 'general') if isinstance(result, dict) else 'general'

        ChatMessage.objects.create(
            user=request.user, role='assistant', message=ai_response,
            language=language, session_id=session_id,
        )

        return Response(api_success({
            'response': ai_response,
            'language': language,
            'agent': agent_name,
            'agent_type': agent_type,
        }))
    except Exception as e:
        logger.error(f"Chat failed: {e}", exc_info=True)
        return Response(api_error(SAFE_ERROR), status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def chat_history(request):
    """Get chat message history."""
    try:
        session_id = request.GET.get('session_id', '')
        limit = int(request.GET.get('limit', 50))
        messages = ChatMessage.objects.filter(user=request.user)
        if session_id:
            messages = messages.filter(session_id=session_id)
        messages = messages.order_by('-created_at')[:limit]
        data = ChatMessageSerializer(messages, many=True).data
        return Response(api_success({'messages': list(reversed(data))}))
    except Exception as e:
        logger.error(f"Chat history failed: {e}", exc_info=True)
        return Response(api_error(SAFE_ERROR), status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ============================================
# Weather
# ============================================
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def weather(request):
    """Get weather data for a city."""
    try:
        city = request.GET.get('city', 'Lucknow')
        data = get_weather_data(city)
        return Response(api_success(data))
    except Exception as e:
        logger.error(f"Weather failed: {e}", exc_info=True)
        return Response(api_error(SAFE_ERROR), status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ============================================
# Soil Analysis
# ============================================
@api_view(['POST'])
@parser_classes([MultiPartParser, FormParser])
@permission_classes([IsAuthenticated])
def soil_analyze(request):
    """Analyze soil from uploaded image."""
    try:
        from .utils import analyze_soil
        serializer = CropScanUploadSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(api_error(serializer.errors), status=status.HTTP_400_BAD_REQUEST)
        image = serializer.validated_data['image']
        result = analyze_soil(image)
        return Response(api_success(result, 'Soil analysis completed'))
    except Exception as e:
        logger.error(f"Soil analysis failed: {e}", exc_info=True)
        return Response(api_error(SAFE_ERROR), status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ============================================
# Crop Recommendation
# ============================================
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def crop_recommend(request):
    """Get crop recommendations for a region/season."""
    try:
        from .services.crop_recommender import recommend_crops, get_all_states
        if request.method == 'GET':
            state = request.GET.get('state', '')
            season = request.GET.get('season', None)
            if not state:
                return Response(api_success({
                    'states': get_all_states(),
                    'seasons': ['Kharif', 'Rabi', 'Zaid'],
                }))
            result = recommend_crops(state, season)
        else:
            state = request.data.get('state', '')
            season = request.data.get('season', None)
            if not state:
                return Response(api_error('State is required'), status=status.HTTP_400_BAD_REQUEST)
            result = recommend_crops(state, season)
        return Response(api_success(result))
    except Exception as e:
        logger.error(f"Crop recommend failed: {e}", exc_info=True)
        return Response(api_error(SAFE_ERROR), status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ============================================
# Dashboard Insights
# ============================================
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_insights(request):
    """Generate real AI insights for the dashboard."""
    try:
        scans = CropScan.objects.filter(user=request.user)
        total = scans.count()
        insights = []

        if total == 0:
            insights = [
                {'type': 'info', 'message': 'Welcome! Upload your first crop image to get started.'},
                {'type': 'tip', 'message': 'Use the AI Chat to ask farming questions in Hindi or English.'},
            ]
        else:
            healthy = scans.filter(disease='Healthy').count()
            diseased = scans.exclude(disease__in=['', 'Healthy', 'Analysis Inconclusive']).count()
            health_pct = round((healthy / max(total, 1)) * 100)

            if health_pct > 70:
                insights.append({'type': 'success', 'message': f'✅ Crop health is good — {health_pct}% healthy scans'})
            elif health_pct > 40:
                insights.append({'type': 'warning', 'message': f'⚠️ Moderate health — {health_pct}% healthy. Consider treatment.'})
            else:
                insights.append({'type': 'danger', 'message': f'🔴 Low health score ({health_pct}%). Immediate action recommended.'})

            if diseased > 0:
                common = scans.exclude(disease__in=['', 'Healthy']).values('disease').annotate(
                    cnt=Count('id')).order_by('-cnt').first()
                if common:
                    insights.append({'type': 'warning', 'message': f'Most common issue: {common["disease"]} ({common["cnt"]} times)'})

            verified = scans.filter(database_verified=True).count()
            if verified > 0:
                insights.append({'type': 'info', 'message': f'📊 {verified} scans verified against agriculture database'})

            insights.append({'type': 'tip', 'message': '💡 Scan regularly to track crop health trends over time'})

        return Response(api_success({'insights': insights, 'total_scans': total}))
    except Exception as e:
        logger.error(f"Insights failed: {e}", exc_info=True)
        return Response(api_error(SAFE_ERROR), status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ============================================
# Database Search / Query
# ============================================
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_diseases(request):
    try:
        qs = Disease.objects.filter(is_active=True)
        plant = request.GET.get('plant', '')
        if plant: qs = qs.filter(plant_name__icontains=plant)
        severity = request.GET.get('severity', '')
        if severity: qs = qs.filter(severity=severity)
        return Response(api_success({'category': 'diseases', 'count': qs.count(), 'data': DiseaseSerializer(qs, many=True).data}))
    except Exception as e:
        logger.error(f"Disease list failed: {e}", exc_info=True)
        return Response(api_error(SAFE_ERROR), status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_pests(request):
    try:
        qs = Pest.objects.filter(is_active=True)
        crop = request.GET.get('crop', '')
        if crop: qs = qs.filter(affected_crops__icontains=crop)
        damage = request.GET.get('damage', '')
        if damage: qs = qs.filter(damage_level=damage)
        return Response(api_success({'category': 'pests', 'count': qs.count(), 'data': PestSerializer(qs, many=True).data}))
    except Exception as e:
        logger.error(f"Pest list failed: {e}", exc_info=True)
        return Response(api_error(SAFE_ERROR), status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_fertilizers(request):
    try:
        qs = Fertilizer.objects.filter(is_active=True)
        ftype = request.GET.get('type', '')
        if ftype: qs = qs.filter(type=ftype)
        crop = request.GET.get('crop', '')
        if crop: qs = qs.filter(suitable_crops__icontains=crop)
        return Response(api_success({'category': 'fertilizers', 'count': qs.count(), 'data': FertilizerSerializer(qs, many=True).data}))
    except Exception as e:
        logger.error(f"Fertilizer list failed: {e}", exc_info=True)
        return Response(api_error(SAFE_ERROR), status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_medicines(request):
    try:
        qs = Medicine.objects.filter(is_active=True)
        med_type = request.GET.get('type', '')
        if med_type: qs = qs.filter(type=med_type)
        target = request.GET.get('target', '')
        if target: qs = qs.filter(Q(target_diseases__icontains=target) | Q(target_pests__icontains=target))
        return Response(api_success({'category': 'medicines', 'count': qs.count(), 'data': MedicineSerializer(qs, many=True).data}))
    except Exception as e:
        logger.error(f"Medicine list failed: {e}", exc_info=True)
        return Response(api_error(SAFE_ERROR), status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def search_database(request):
    """Unified search across all agriculture databases."""
    try:
        query = request.GET.get('q', '').strip()
        if not query:
            return Response(api_error('"q" parameter required'), status=status.HTTP_400_BAD_REQUEST)
        results = []
        for d in Disease.objects.filter(Q(name__icontains=query)|Q(plant_name__icontains=query), is_active=True)[:10]:
            results.append({'category': 'diseases', 'name': d.name, 'details': f"Affects {d.plant_name}", 'severity': d.severity})
        for p in Pest.objects.filter(Q(name__icontains=query)|Q(scientific_name__icontains=query), is_active=True)[:10]:
            results.append({'category': 'pests', 'name': p.name, 'details': f"Affects: {', '.join((p.affected_crops or [])[:3])}", 'severity': p.damage_level})
        for f in Fertilizer.objects.filter(Q(name__icontains=query)|Q(benefits__icontains=query), is_active=True)[:10]:
            results.append({'category': 'fertilizers', 'name': f.name, 'details': f"Type: {f.get_type_display()}"})
        for m in Medicine.objects.filter(Q(name__icontains=query), is_active=True)[:10]:
            results.append({'category': 'medicines', 'name': m.name, 'details': f"Type: {m.get_type_display()}"})
        return Response(api_success({'query': query, 'total_results': len(results), 'data': results}))
    except Exception as e:
        logger.error(f"Search failed: {e}", exc_info=True)
        return Response(api_error(SAFE_ERROR), status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ============================================
# Auth
# ============================================
@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """Register a new user and return tokens."""
    try:
        serializer = RegisterSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(api_error(serializer.errors), status=status.HTTP_400_BAD_REQUEST)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response(api_success({
            'user': UserSerializer(user).data,
            'tokens': {'refresh': str(refresh), 'access': str(refresh.access_token)},
        }, 'Registration successful'), status=status.HTTP_201_CREATED)
    except Exception as e:
        logger.error(f"Registration failed: {e}", exc_info=True)
        return Response(api_error(SAFE_ERROR), status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class LoginView(TokenObtainPairView):
    """Custom Login — accepts email OR username."""
    permission_classes = [AllowAny]
    throttle_scope = 'auth'

    def post(self, request, *args, **kwargs):
        data = request.data.copy()
        login_id = data.get('email') or data.get('username', '')
        if not login_id:
            return Response({'success': False, 'error': 'Email or username required'}, status=status.HTTP_400_BAD_REQUEST)

        resolved = login_id
        if '@' in login_id:
            try:
                resolved = User.objects.get(email=login_id).username
            except User.DoesNotExist:
                return Response({'success': False, 'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
        elif not User.objects.filter(username=login_id).exists():
            return Response({'success': False, 'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

        data['username'] = resolved
        serializer = self.get_serializer(data=data)
        try:
            serializer.is_valid(raise_exception=True)
        except Exception:
            return Response({'success': False, 'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

        user = User.objects.get(username=resolved)
        return Response(api_success({
            'user': UserSerializer(user).data,
            'tokens': serializer.validated_data,
        }, 'Login successful'))