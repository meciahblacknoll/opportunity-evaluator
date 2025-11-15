# PROVENANCE
# Created: 2025-11-14
# Prompt: PROMPTS/PLANNING_PROMPT.md (v1.1)
# Author: Claude Code

FROM python:3.11-slim

WORKDIR /app

# Copy backend requirements
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ ./backend/

# Expose API port
EXPOSE 8000

# Run the application
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
