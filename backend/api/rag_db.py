import os
import logging
from django.conf import settings
from langchain_community.vectorstores import FAISS
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_core.documents import Document

logger = logging.getLogger('api')

INDEX_PATH = os.path.join(settings.BASE_DIR, 'api', 'faiss_index')

def get_embeddings():
    """Returns the embedding model."""
    # Ensure GEMINI_API_KEY or GOOGLE_API_KEY is set in environment
    api_key = os.environ.get('GEMINI_API_KEY') or os.environ.get('GOOGLE_API_KEY')
    if not api_key:
        logger.error("No Gemini API key found. Please set GEMINI_API_KEY.")
        raise ValueError("GEMINI_API_KEY environment variable is not set.")
    
    return GoogleGenerativeAIEmbeddings(
        model="models/embedding-001",
        google_api_key=api_key
    )

def initialize_faiss_index():
    """
    Reads data from Django database and builds a local FAISS index.
    Should be run once or periodically to update the knowledge base.
    """
    from .models import Disease, Pest, Fertilizer, Medicine
    
    logger.info("Initializing FAISS Vector DB from Django Models...")
    documents = []

    # 1. Add Diseases
    for d in Disease.objects.filter(is_active=True):
        content = f"Disease Name: {d.name}\nAffects Plant: {d.plant_name}\n"
        content += f"Symptoms: {', '.join(d.symptoms)}\n"
        content += f"Cause: {d.cause}\n"
        content += f"Organic Treatment: {', '.join(d.organic_treatment)}\n"
        content += f"Chemical Treatment: {', '.join(d.chemical_treatment)}\n"
        content += f"Dosage: {d.dosage}\n"
        content += f"Prevention: {', '.join(d.prevention)}\n"
        
        doc = Document(
            page_content=content,
            metadata={"source": "disease", "id": d.id, "name": d.name}
        )
        documents.append(doc)

    # 2. Add Pests
    for p in Pest.objects.filter(is_active=True):
        content = f"Pest Name: {p.name}\nAffects Crops: {', '.join(p.affected_crops)}\n"
        content += f"Identification: {p.identification_features}\n"
        content += f"Control Methods: {', '.join(p.control_methods)}\n"
        content += f"Prevention: {', '.join(p.prevention)}\n"
        
        doc = Document(
            page_content=content,
            metadata={"source": "pest", "id": p.id, "name": p.name}
        )
        documents.append(doc)

    # 3. Add Fertilizers
    for f in Fertilizer.objects.filter(is_active=True):
        content = f"Fertilizer: {f.name}\nType: {f.type}\n"
        content += f"Suitable for: {', '.join(f.suitable_crops)}\n"
        content += f"Benefits: {f.benefits}\n"
        content += f"Application Method: {f.application_method}\n"
        
        doc = Document(
            page_content=content,
            metadata={"source": "fertilizer", "id": f.id, "name": f.name}
        )
        documents.append(doc)
        
    # 4. Add Medicines
    for m in Medicine.objects.filter(is_active=True):
        content = f"Medicine: {m.name}\nType: {m.type}\n"
        content += f"Target Diseases: {', '.join(m.target_diseases)}\n"
        content += f"Target Pests: {', '.join(m.target_pests)}\n"
        content += f"Application Method: {m.application_method}\n"
        content += f"Dosage: {m.dosage}\n"
        
        doc = Document(
            page_content=content,
            metadata={"source": "medicine", "id": m.id, "name": m.name}
        )
        documents.append(doc)

    if not documents:
        logger.warning("No documents found to build FAISS index. Please populate DB first.")
        # Create a dummy doc to avoid FAISS initialization errors
        documents.append(Document(page_content="Empty Knowledge Base", metadata={"source": "dummy"}))

    embeddings = get_embeddings()
    vectorstore = FAISS.from_documents(documents, embeddings)
    vectorstore.save_local(INDEX_PATH)
    logger.info(f"FAISS index saved successfully at {INDEX_PATH}")
    return vectorstore

def get_retriever():
    """
    Returns a FAISS retriever. Initializes index if not found.
    """
    embeddings = get_embeddings()
    
    if not os.path.exists(os.path.join(INDEX_PATH, "index.faiss")):
        vectorstore = initialize_faiss_index()
    else:
        try:
            vectorstore = FAISS.load_local(INDEX_PATH, embeddings, allow_dangerous_deserialization=True)
        except Exception as e:
            logger.error(f"Failed to load FAISS index: {e}. Rebuilding...")
            vectorstore = initialize_faiss_index()
            
    return vectorstore.as_retriever(search_kwargs={"k": 3})
