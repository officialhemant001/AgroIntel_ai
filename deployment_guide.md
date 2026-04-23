# AgroIntel AI: Production Deployment & Optimization Guide

This guide covers the steps to deploy the AgroIntel AI system to production and optimize its performance.

## 1. Environment Setup

### Backend (.env)
Create a `.env` file in `backend/` with the following variables:
```env
DEBUG=False
SECRET_KEY=your-secure-secret-key
DATABASE_URL=postgres://user:password@host:port/dbname
ALLOWED_HOSTS=your-domain.com,your-app.railway.app
CORS_ORIGINS=https://your-frontend-domain.vercel.app
```

### Frontend (.env)
Create a `.env` file in `frontend/` with:
```env
VITE_API_URL=https://your-backend-domain.railway.app/api/v1
```

---

## 2. Model Optimization (TFLite)

To reduce prediction time and server memory usage, convert your Keras model to TensorFlow Lite:

### Conversion Script
Run this script in your backend environment:
```python
import tensorflow as tf

# Load your model
model = tf.keras.models.load_model('api/ai_models/disease_cnn.h5')

# Convert to TFLite
converter = tf.lite.TFLiteConverter.from_keras_model(model)
tflite_model = converter.convert()

# Save
with open('api/ai_models/disease_model.tflite', 'wb') as f:
    f.write(tflite_model)
```

### Inference Update
Update `utils.py` to use `tf.lite.Interpreter` for 5x-10x faster inference.

---

## 3. Deployment Strategy

### Backend (Render / Railway)
1. **Docker**: Use the provided `backend/Dockerfile`.
2. **PostgreSQL**: Provision a PostgreSQL instance and provide the `DATABASE_URL`.
3. **Static Files**: Django uses `whitenoise` to serve static files. Run `python manage.py collectstatic`.

### Frontend (Vercel / Netlify)
1. **Framework**: Vite/React.
2. **Build Command**: `npm run build`.
3. **Output Directory**: `dist`.

---

## 4. Production Checklist
- [ ] Set `DEBUG=False` in environment.
- [ ] Use a production-grade WSGI server like `gunicorn`.
- [ ] Enable SSL (provided automatically by Render/Vercel).
- [ ] Configure automated backups for PostgreSQL.
- [ ] Monitor logs via Render/Railway dashboard.
