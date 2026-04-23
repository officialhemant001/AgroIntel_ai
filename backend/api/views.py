"""
AgroIntel API Views

Implements all REST API endpoints:
- Health check
- Authentication (login with email/username, register)
- Crop scan (upload, history, detail, stats)
- AI chat assistant
- Weather
- Database search/query (diseases, pests, fertilizers, medicines)
"""

import logging
from django.contrib.auth.models import User
from django.db.models import Q, Avg
from rest_framework.decorators import api_view, parser_classes, permission_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import CropScan, ChatMessage, Disease, Pest, Fertilizer, Medicine
from .serializers import (
    CropScanSerializer,
    CropScanUploadSerializer,
    ChatInputSerializer,
    ChatMessageSerializer,
    RegisterSerializer,
    UserSerializer,
    DiseaseSerializer,
    PestSerializer,
    FertilizerSerializer,
    MedicineSerializer,
)
from .utils import (
    analyze_image,
    generate_chat_response,
    get_weather_data,
    api_success,
    api_error,
)

logger = logging.getLogger('api')


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
        'version': '2.0.0',
        'database': {
            'diseases': Disease.objects.filter(is_active=True).count(),
            'pests': Pest.objects.filter(is_active=True).count(),
            'fertilizers': Fertilizer.objects.filter(is_active=True).count(),
            'medicines': Medicine.objects.filter(is_active=True).count(),
        }
    }))


# ============================================
# Crop Scan Endpoints
# ============================================
@api_view(['POST'])
@parser_classes([MultiPartParser, FormParser])
@permission_classes([IsAuthenticated])
def scan_crop(request):
    """
    Upload a crop/leaf image for AI analysis.
    Pipeline: Image → Preprocess → AI Model → DB Cross-check → Structured Response
    """
    try:
        upload_serializer = CropScanUploadSerializer(data=request.data)
        if not upload_serializer.is_valid():
            return Response(
                api_error(upload_serializer.errors),
                status=status.HTTP_400_BAD_REQUEST,
            )

        image = upload_serializer.validated_data['image']

        # Run full AI analysis pipeline (with DB cross-verification)
        logger.info(f"Starting scan for image: {image.name} by user: {request.user.email}")
        result = analyze_image(image)

        # Check for unclear image
        if result.get('disease') == 'Analysis Inconclusive' and result.get('confidence', 0) == 0:
            return Response(api_success({
                'status': 'error',
                'message': 'Image not clear, please upload again',
                **result,
            }), status=status.HTTP_200_OK)

        # Save to database with all enriched fields
        scan = CropScan.objects.create(
            user=request.user,
            image=image,
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

        serializer = CropScanSerializer(scan, context={'request': request})
        logger.info(f"Scan saved: ID={scan.id}, Disease={scan.disease}, DB_Verified={scan.database_verified}")

        return Response(
            api_success(serializer.data, 'Scan completed successfully'),
            status=status.HTTP_201_CREATED,
        )

    except Exception as e:
        logger.error(f"Scan failed: {e}", exc_info=True)
        return Response(
            api_error(f'Analysis failed: {str(e)}'),
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def scan_history(request):
    """Get scan history for the current user."""
    try:
        limit = int(request.GET.get('limit', 20))
        limit = min(limit, 100)

        scans = CropScan.objects.filter(user=request.user)[:limit]
        serializer = CropScanSerializer(
            scans, many=True, context={'request': request}
        )

        return Response(api_success({
            'scans': serializer.data,
            'total': CropScan.objects.filter(user=request.user).count(),
        }))

    except Exception as e:
        logger.error(f"History fetch failed: {e}", exc_info=True)
        return Response(
            api_error(str(e)),
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def scan_detail(request, scan_id):
    """Get a specific scan result by ID."""
    try:
        scan = CropScan.objects.get(id=scan_id, user=request.user)
        serializer = CropScanSerializer(scan, context={'request': request})
        return Response(api_success(serializer.data))

    except CropScan.DoesNotExist:
        return Response(
            api_error('Scan not found'),
            status=status.HTTP_404_NOT_FOUND,
        )
    except Exception as e:
        logger.error(f"Scan detail failed: {e}", exc_info=True)
        return Response(
            api_error(str(e)),
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def scan_stats(request):
    """Get aggregate scan statistics for the dashboard."""
    try:
        user_scans = CropScan.objects.filter(user=request.user)
        total_scans = user_scans.count()
        diseases_found = user_scans.exclude(
            disease__in=['', 'Healthy', 'Analysis Inconclusive']
        ).count()

        avg_confidence = user_scans.aggregate(
            avg=Avg('confidence')
        )['avg'] or 0

        healthy_count = user_scans.filter(disease='Healthy').count()
        health_score = round((healthy_count / max(total_scans, 1)) * 100)

        db_verified_count = user_scans.filter(database_verified=True).count()

        return Response(api_success({
            'total_scans': total_scans,
            'diseases_found': diseases_found,
            'treatments_given': user_scans.exclude(treatment='').count(),
            'health_score': f"{health_score}%",
            'avg_confidence': round(avg_confidence, 1),
            'db_verified_count': db_verified_count,
        }))

    except Exception as e:
        logger.error(f"Stats failed: {e}", exc_info=True)
        return Response(
            api_error(str(e)),
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


# ============================================
# AI Chat Endpoints
# ============================================
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def chat(request):
    """Send a message to the AI chat assistant."""
    try:
        serializer = ChatInputSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                api_error(serializer.errors),
                status=status.HTTP_400_BAD_REQUEST,
            )

        data = serializer.validated_data
        user_message = data['message']
        language = data.get('language', 'en')
        session_id = data.get('session_id', '')

        ChatMessage.objects.create(
            user=request.user,
            role='user',
            message=user_message,
            language=language,
            session_id=session_id,
        )

        ai_response = generate_chat_response(user_message, language)

        ChatMessage.objects.create(
            user=request.user,
            role='assistant',
            message=ai_response,
            language=language,
            session_id=session_id,
        )

        return Response(api_success({
            'response': ai_response,
            'language': language,
        }))

    except Exception as e:
        logger.error(f"Chat failed: {e}", exc_info=True)
        return Response(
            api_error(str(e)),
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def chat_history(request):
    """Get chat message history for the current user."""
    try:
        session_id = request.GET.get('session_id', '')
        limit = int(request.GET.get('limit', 50))

        messages = ChatMessage.objects.filter(user=request.user)
        if session_id:
            messages = messages.filter(session_id=session_id)
        messages = messages.order_by('-created_at')[:limit]

        serializer = ChatMessageSerializer(messages, many=True)

        return Response(api_success({
            'messages': list(reversed(serializer.data)),
        }))

    except Exception as e:
        logger.error(f"Chat history failed: {e}", exc_info=True)
        return Response(
            api_error(str(e)),
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


# ============================================
# Weather Endpoint
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
        return Response(
            api_error(str(e)),
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


# ============================================
# Database Search / Query Endpoints
# ============================================
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_diseases(request):
    """List all diseases. Optional filter: ?plant=wheat"""
    try:
        queryset = Disease.objects.filter(is_active=True)

        plant = request.GET.get('plant', '')
        if plant:
            queryset = queryset.filter(plant_name__icontains=plant)

        severity = request.GET.get('severity', '')
        if severity:
            queryset = queryset.filter(severity=severity)

        serializer = DiseaseSerializer(queryset, many=True)

        return Response(api_success({
            'category': 'diseases',
            'count': queryset.count(),
            'data': serializer.data,
        }))

    except Exception as e:
        logger.error(f"Disease list failed: {e}", exc_info=True)
        return Response(api_error(str(e)), status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_pests(request):
    """List all pests. Optional filter: ?crop=wheat"""
    try:
        queryset = Pest.objects.filter(is_active=True)

        crop = request.GET.get('crop', '')
        if crop:
            queryset = queryset.filter(affected_crops__icontains=crop)

        damage = request.GET.get('damage', '')
        if damage:
            queryset = queryset.filter(damage_level=damage)

        serializer = PestSerializer(queryset, many=True)

        return Response(api_success({
            'category': 'pests',
            'count': queryset.count(),
            'data': serializer.data,
        }))

    except Exception as e:
        logger.error(f"Pest list failed: {e}", exc_info=True)
        return Response(api_error(str(e)), status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_fertilizers(request):
    """List all fertilizers. Optional filter: ?type=organic"""
    try:
        queryset = Fertilizer.objects.filter(is_active=True)

        ftype = request.GET.get('type', '')
        if ftype:
            queryset = queryset.filter(type=ftype)

        crop = request.GET.get('crop', '')
        if crop:
            queryset = queryset.filter(suitable_crops__icontains=crop)

        serializer = FertilizerSerializer(queryset, many=True)

        return Response(api_success({
            'category': 'fertilizers',
            'count': queryset.count(),
            'data': serializer.data,
        }))

    except Exception as e:
        logger.error(f"Fertilizer list failed: {e}", exc_info=True)
        return Response(api_error(str(e)), status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_medicines(request):
    """List all medicines. Optional filter: ?target=rust"""
    try:
        queryset = Medicine.objects.filter(is_active=True)

        med_type = request.GET.get('type', '')
        if med_type:
            queryset = queryset.filter(type=med_type)

        target = request.GET.get('target', '')
        if target:
            queryset = queryset.filter(
                Q(target_diseases__icontains=target) | Q(target_pests__icontains=target)
            )

        serializer = MedicineSerializer(queryset, many=True)

        return Response(api_success({
            'category': 'medicines',
            'count': queryset.count(),
            'data': serializer.data,
        }))

    except Exception as e:
        logger.error(f"Medicine list failed: {e}", exc_info=True)
        return Response(api_error(str(e)), status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def search_database(request):
    """
    Unified search across all agriculture databases.
    Usage: GET /api/v1/db/search/?q=blight
    """
    try:
        query = request.GET.get('q', '').strip()
        if not query:
            return Response(
                api_error('Search query "q" parameter is required'),
                status=status.HTTP_400_BAD_REQUEST,
            )

        results = []

        # Search diseases
        diseases = Disease.objects.filter(
            Q(name__icontains=query) | Q(plant_name__icontains=query) | Q(cause__icontains=query),
            is_active=True,
        )[:10]
        for d in diseases:
            results.append({
                'category': 'diseases',
                'name': d.name,
                'details': f"Affects {d.plant_name}. Cause: {d.cause[:100]}",
                'treatment': '; '.join((d.organic_treatment or [])[:2]),
                'severity': d.severity,
            })

        # Search pests
        pests = Pest.objects.filter(
            Q(name__icontains=query) | Q(scientific_name__icontains=query),
            is_active=True,
        )[:10]
        for p in pests:
            results.append({
                'category': 'pests',
                'name': p.name,
                'details': f"Affects: {', '.join((p.affected_crops or [])[:3])}. {p.identification_features[:100]}",
                'treatment': '; '.join((p.control_methods or [])[:2]),
                'severity': p.damage_level,
            })

        # Search fertilizers
        fertilizers = Fertilizer.objects.filter(
            Q(name__icontains=query) | Q(benefits__icontains=query),
            is_active=True,
        )[:10]
        for f in fertilizers:
            results.append({
                'category': 'fertilizers',
                'name': f.name,
                'details': f"Type: {f.get_type_display()}. {f.benefits[:100]}",
                'treatment': f.dosage[:100] if f.dosage else '',
            })

        # Search medicines
        medicines = Medicine.objects.filter(
            Q(name__icontains=query),
            is_active=True,
        )[:10]
        for m in medicines:
            results.append({
                'category': 'medicines',
                'name': m.name,
                'details': f"Type: {m.get_type_display()}. {m.application_method[:100]}",
                'treatment': m.dosage[:100] if m.dosage else '',
            })

        return Response(api_success({
            'query': query,
            'total_results': len(results),
            'data': results,
        }))

    except Exception as e:
        logger.error(f"Search failed: {e}", exc_info=True)
        return Response(api_error(str(e)), status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ============================================
# Authentication Endpoints
# ============================================
@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """Register a new user and return tokens."""
    try:
        serializer = RegisterSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                api_error(serializer.errors),
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        user_data = UserSerializer(user).data

        data = {
            'user': user_data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }

        logger.info(f"User registered: {user.email}")
        return Response(
            api_success(data, 'Registration successful'),
            status=status.HTTP_201_CREATED,
        )

    except Exception as e:
        logger.error(f"Registration failed: {e}", exc_info=True)
        return Response(
            api_error(str(e)),
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


class LoginView(TokenObtainPairView):
    """
    Custom Login view using SimpleJWT.
    Accepts login via email OR username.
    """
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        data = request.data.copy()

        # Support login by email or username
        login_identifier = data.get('email') or data.get('username', '')

        if not login_identifier:
            return Response(
                {'success': False, 'error': 'Email or username is required'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Resolve to username for SimpleJWT
        resolved_username = login_identifier
        if '@' in login_identifier:
            # Email login — look up the username
            try:
                user_obj = User.objects.get(email=login_identifier)
                resolved_username = user_obj.username
            except User.DoesNotExist:
                return Response(
                    {'success': False, 'error': 'Invalid credentials'},
                    status=status.HTTP_401_UNAUTHORIZED,
                )
        else:
            # Username login — verify user exists
            if not User.objects.filter(username=login_identifier).exists():
                return Response(
                    {'success': False, 'error': 'Invalid credentials'},
                    status=status.HTTP_401_UNAUTHORIZED,
                )

        data['username'] = resolved_username
        serializer = self.get_serializer(data=data)

        try:
            serializer.is_valid(raise_exception=True)
        except Exception:
            return Response(
                {'success': False, 'error': 'Invalid credentials'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        user = User.objects.get(username=resolved_username)
        user_data = UserSerializer(user).data

        return Response(api_success({
            'user': user_data,
            'tokens': serializer.validated_data
        }, 'Login successful'))