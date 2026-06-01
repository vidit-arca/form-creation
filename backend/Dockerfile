FROM python:3.10-slim
WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source code
COPY . .

# Create a directory for the database to reside in (so we can mount a volume to it)
RUN mkdir -p /app/data

# Tell the backend to use the data folder for SQLite if needed. 
# (You may need to update database.py to point to /app/data/forms.db)

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
