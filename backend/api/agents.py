"""
AgroIntel Multi-Agent System

6 specialized agents with intelligent routing:
1. Query Router — classifies and routes to specialist
2. Crop Disease Expert — diagnosis + treatment
3. Soil Analyst — soil health assessment
4. Fertilizer Advisor — personalized fertilizer plans
5. Weather Advisor — farming decisions based on weather
6. General Farming Assistant — catch-all
"""

import os
import logging
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.prompts import PromptTemplate
from .rag_db import get_retriever
from .services.agent_memory import classify_query, get_conversation_context

logger = logging.getLogger('api')


def get_llm(temperature=0.2):
    """Returns the LLM instance."""
    api_key = os.environ.get('GEMINI_API_KEY') or os.environ.get('GOOGLE_API_KEY')
    if not api_key:
        raise ValueError("GEMINI_API_KEY environment variable is not set.")
    return ChatGoogleGenerativeAI(
        model="gemini-1.5-flash",
        temperature=temperature,
        google_api_key=api_key,
        convert_system_message_to_human=True
    )


# ============================================
# Agent 1: Diagnosis Agent (for image scans)
# ============================================
def diagnosis_agent(ai_prediction):
    """Standardizes the raw prediction from AI model."""
    logger.info(f"Diagnosis Agent: {ai_prediction.get('disease')}")
    disease = ai_prediction.get('disease', 'Unknown')
    if disease in ('Healthy', 'No Disease', 'Analysis Inconclusive'):
        return {"disease": disease, "needs_treatment": False}
    return {
        "disease": disease,
        "plant_name": ai_prediction.get('plant_name', ''),
        "confidence": ai_prediction.get('confidence', 0),
        "needs_treatment": True
    }


# ============================================
# Agent 2: Retrieval Agent (RAG)
# ============================================
def retrieval_agent(query_state):
    """Fetches contextual knowledge from FAISS Vector DB."""
    disease = query_state.get('disease', query_state.get('query', ''))
    logger.info(f"Retrieval Agent: searching for '{disease}'")
    if not query_state.get('needs_treatment', True):
        return {**query_state, "context": "Crop is healthy. No specific treatment needed."}
    try:
        retriever = get_retriever()
        query = f"Symptoms, treatments, medicines, and fertilizers for {disease}"
        if query_state.get('plant_name'):
            query += f" in {query_state['plant_name']}"
        docs = retriever.invoke(query)
        context = "\n---\n".join([doc.page_content for doc in docs])
    except Exception as e:
        logger.error(f"Retrieval Agent error: {e}")
        context = "No specific data found in knowledge base."
    return {**query_state, "context": context}


# ============================================
# Agent 3: Recommendation Agent
# ============================================
def recommendation_agent(state):
    """Generates precise treatment using retrieved context + LLM."""
    disease = state.get('disease', 'Unknown')
    logger.info(f"Recommendation Agent: generating treatment for '{disease}'")
    if not state.get('needs_treatment', True):
        if disease == 'Healthy':
            return "Crop looks healthy! Maintain regular watering and standard fertilizer plan."
        return "Analysis was inconclusive. Please upload a clearer image."
    try:
        llm = get_llm()
        prompt = PromptTemplate.from_template(
            "You are an expert agronomist.\n\n"
            "Context from database:\n{context}\n\n"
            "Provide an actionable treatment plan for '{disease}':\n"
            "- Immediate Action\n- Organic Treatment\n- Chemical Treatment\n- Prevention Tips\n"
            "Do NOT hallucinate. If context is empty, give general safe advice."
        )
        chain = prompt | llm
        response = chain.invoke({"context": state['context'], "disease": disease})
        return response.content
    except Exception as e:
        logger.error(f"Recommendation Agent error: {e}")
        return "Please consult a local agriculture expert for advice."


# ============================================
# Agent 4: Tracking Agent
# ============================================
def tracking_agent(user, image, ai_prediction, recommendation):
    """Logs final state. CropScan creation happens in views.py."""
    logger.info(f"Tracking Agent: {ai_prediction.get('disease')}")
    return {
        "disease": ai_prediction.get('disease'),
        "treatment_recommendation": recommendation,
        "database_verified": True
    }


# ============================================
# Agent 5: Specialized Chat Agents
# ============================================
AGENT_PROMPTS = {
    'disease_expert': (
        "You are AgroIntel's Crop Disease Expert Agent 🦠.\n"
        "You specialize in plant disease identification, symptoms, and treatment.\n"
        "Context from knowledge base:\n{context}\n\n"
        "Conversation history:\n{history}\n\n"
        "User question: {message}\n\n"
        "Provide detailed, practical disease management advice.\n"
        "Language: {lang_instruction}"
    ),
    'soil_analyst': (
        "You are AgroIntel's Soil Analyst Agent 🧪.\n"
        "You specialize in soil health, pH, nutrient analysis, and improvement.\n"
        "Context:\n{context}\n\nHistory:\n{history}\n\n"
        "User: {message}\n\nProvide soil improvement recommendations.\nLanguage: {lang_instruction}"
    ),
    'fertilizer_advisor': (
        "You are AgroIntel's Fertilizer Advisor Agent 🌱.\n"
        "You recommend fertilizers based on crop, soil, and season.\n"
        "Context:\n{context}\n\nHistory:\n{history}\n\n"
        "User: {message}\n\nRecommend specific fertilizers with dosage.\nLanguage: {lang_instruction}"
    ),
    'weather_advisor': (
        "You are AgroIntel's Weather Advisor Agent 🌤️.\n"
        "You help farmers make decisions based on weather conditions.\n"
        "Context:\n{context}\n\nHistory:\n{history}\n\n"
        "User: {message}\n\nGive weather-based farming advice.\nLanguage: {lang_instruction}"
    ),
    'pest_expert': (
        "You are AgroIntel's Pest Control Expert Agent 🐛.\n"
        "You identify pests and recommend control methods.\n"
        "Context:\n{context}\n\nHistory:\n{history}\n\n"
        "User: {message}\n\nProvide pest identification and control advice.\nLanguage: {lang_instruction}"
    ),
    'crop_advisor': (
        "You are AgroIntel's Crop Advisor Agent 🌾.\n"
        "You recommend crops based on region, season, and soil type.\n"
        "Context:\n{context}\n\nHistory:\n{history}\n\n"
        "User: {message}\n\nRecommend suitable crops with expected yield info.\nLanguage: {lang_instruction}"
    ),
    'general_assistant': (
        "You are AgroIntel AI 🌱, an expert agricultural assistant.\n"
        "You help Indian farmers with all farming questions.\n"
        "Context:\n{context}\n\nHistory:\n{history}\n\n"
        "User: {message}\n\nProvide helpful, practical farming advice.\nLanguage: {lang_instruction}"
    ),
}

AGENT_NAMES = {
    'disease_expert': '🦠 Disease Expert',
    'soil_analyst': '🧪 Soil Analyst',
    'fertilizer_advisor': '🌱 Fertilizer Advisor',
    'weather_advisor': '🌤️ Weather Advisor',
    'pest_expert': '🐛 Pest Expert',
    'crop_advisor': '🌾 Crop Advisor',
    'general_assistant': '🤖 General Assistant',
}


def run_chat_agent(message, lang='en', user=None, session_id=''):
    """Route message to the correct specialist agent and generate response."""
    agent_type = classify_query(message)
    agent_name = AGENT_NAMES.get(agent_type, '🤖 Assistant')
    logger.info(f"Chat routed to: {agent_name}")

    # Get conversation context
    history = get_conversation_context(user, session_id, limit=6) if user else ""

    # Get RAG context
    try:
        retriever = get_retriever()
        docs = retriever.invoke(message)
        context = "\n---\n".join([doc.page_content for doc in docs])
    except Exception as e:
        logger.warning(f"RAG retrieval failed: {e}")
        context = "No specific data found."

    lang_instruction = "Respond in Hindi (Devanagari script)" if lang == 'hi' else "Respond in English"

    try:
        llm = get_llm(temperature=0.3)
        template = AGENT_PROMPTS.get(agent_type, AGENT_PROMPTS['general_assistant'])
        prompt = PromptTemplate.from_template(template)
        chain = prompt | llm
        response = chain.invoke({
            "context": context, "history": history,
            "message": message, "lang_instruction": lang_instruction,
        })
        return {"response": response.content, "agent": agent_name, "agent_type": agent_type}
    except Exception as e:
        logger.error(f"Agent Chat Error: {e}", exc_info=True)
        return {
            "response": "I'm having trouble connecting to my knowledge base. Please try again.",
            "agent": agent_name, "agent_type": agent_type,
        }


# ============================================
# Image Scan Pipeline Orchestrator
# ============================================
def run_agent_pipeline(user, image, ai_prediction):
    """Orchestrates the agent pipeline for an image scan."""
    logger.info("--- Starting RAG Agent Pipeline ---")
    diagnosis = diagnosis_agent(ai_prediction)
    context_state = retrieval_agent(diagnosis)
    treatment = recommendation_agent(context_state)
    final = tracking_agent(user, image, ai_prediction, treatment)
    logger.info("--- Completed RAG Agent Pipeline ---")
    return final
