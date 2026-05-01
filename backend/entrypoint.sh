#!/bin/bash
set -e

echo "⏳ Waiting for database to be ready..."
python -c "
import time, sqlalchemy
for i in range(30):
    try:
        engine = sqlalchemy.create_engine('${DATABASE_URL}')
        conn = engine.connect()
        conn.close()
        print('✅ Database is ready!')
        break
    except Exception:
        print(f'  Attempt {i+1}/30 — waiting...')
        time.sleep(2)
else:
    print('❌ Database not available after 60 seconds')
    exit(1)
"

if [ -d "app/migrations" ]; then
    echo "🔄 Running database migrations..."
    flask db upgrade -d app/migrations
else
    echo "⚠️ No migrations folder found. Skipping database migrations."
fi

echo "🚀 Starting Flask server..."
exec python -m flask run --host=0.0.0.0 --port=5000
