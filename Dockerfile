FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1

WORKDIR /app

COPY requirements-deploy.txt .
RUN pip install --no-cache-dir torch torchaudio --index-url https://download.pytorch.org/whl/cpu
RUN pip install --no-cache-dir -r requirements-deploy.txt

COPY backend/ ./backend/

EXPOSE 10000

CMD gunicorn --bind 0.0.0.0:${PORT:-10000} --workers 1 --timeout 300 --preload "backend.app:create_app()"
