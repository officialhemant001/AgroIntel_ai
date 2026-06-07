"""
AgroIntel Agent Memory Service
Session-based conversation memory for multi-agent system.
"""
import logging
from ..models import ChatMessage

logger = logging.getLogger('api')

def get_conversation_context(user, session_id='', limit=6):
    """Get last N messages for context injection into agent prompts."""
    try:
        qs = ChatMessage.objects.filter(user=user)
        if session_id:
            qs = qs.filter(session_id=session_id)
        messages = qs.order_by('-created_at')[:limit]
        history = []
        for msg in reversed(list(messages)):
            role = "User" if msg.role == "user" else "AgroIntel AI"
            history.append(f"{role}: {msg.message}")
        return "\n".join(history)
    except Exception as e:
        logger.error(f"Memory retrieval failed: {e}")
        return ""

def classify_query(message):
    """Classify user query to route to the correct agent."""
    msg = message.lower()
    disease_kw = ['disease','blight','rust','wilt','mildew','rot','spot','leaf','bimari','rog']
    soil_kw = ['soil','mitti','ph','nutrient','nitrogen','phosphorus','potassium','drainage']
    fert_kw = ['fertilizer','urvarak','npk','compost','manure','khad','dap','urea']
    weather_kw = ['weather','mausam','rain','barish','temperature','frost','humidity','monsoon']
    pest_kw = ['pest','keet','insect','bug','aphid','caterpillar','worm','kida']
    crop_kw = ['crop','fasal','recommend','suggest','grow','plant','season','kharif','rabi']

    for kw in disease_kw:
        if kw in msg: return 'disease_expert'
    for kw in soil_kw:
        if kw in msg: return 'soil_analyst'
    for kw in fert_kw:
        if kw in msg: return 'fertilizer_advisor'
    for kw in weather_kw:
        if kw in msg: return 'weather_advisor'
    for kw in pest_kw:
        if kw in msg: return 'pest_expert'
    for kw in crop_kw:
        if kw in msg: return 'crop_advisor'
    return 'general_assistant'
