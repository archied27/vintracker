# Build the Vite app, then serve it from the FastAPI image.
FROM node:22-alpine AS frontend-build

WORKDIR /build/src/frontend
COPY src/frontend/package*.json ./
RUN npm ci
COPY src/frontend/ ./
RUN npm run build

FROM python:3.12-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app/src/backend

WORKDIR /app

COPY src/backend/requirements.txt /app/src/backend/requirements.txt
RUN pip install --no-cache-dir -r /app/src/backend/requirements.txt

COPY src/backend/ /app/src/backend/
COPY --from=frontend-build /build/src/frontend/dist /app/src/frontend/dist

RUN mkdir -p /app/data/uploads

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
