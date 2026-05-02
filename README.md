# 🎥 FaceStream — Real-Time Face Detection Video Streaming System

[![GitHub Repo](https://img.shields.io/badge/GitHub-Repository-181717.svg?style=for-the-badge&logo=github)](https://github.com/Riddhi-chavan/face-stream)

![Architecture](architecture.png)

A fully containerised, full-stack application that captures webcam video in the browser, streams frames to a Flask backend over WebSockets, detects faces using **MediaPipe**, draws bounding boxes with **Pillow**, stores ROI data in **PostgreSQL**, and streams the annotated video back to a **React** frontend — all orchestrated with **Docker Compose**.

---

## ✨ Features

- **Real-time face detection** — MediaPipe processes webcam frames and returns annotated video with bounding boxes and confidence scores
- **Live viewer mode** (`/viewer`) — Share your stream with anyone; viewers connect via a read-only WebSocket and see annotated frames in real-time
- **Mirror toggle** — Flip the camera horizontally; the mirror is applied at the pixel level so viewers see the same orientation as the broadcaster
- **Configurable FPS** — Switch between 30, 60, and 120 fps capture rates on the fly
- **Background-tab safe** — Frame capture uses a Web Worker timer instead of `requestAnimationFrame`, so streaming continues at full FPS even when the browser tab is in the background
- **Live confidence chart** — A real-time line chart (Recharts) visualises detection confidence percentage over time
- **ROI event table** — A panel displaying the 10 most recent detections with coordinates, dimensions, confidence, and detection status, auto-polling every 2 seconds
- **CSV export** — Download all ROI detection history as a CSV file with one click
- **Screenshot capture** — Save the current annotated frame as a PNG directly from the browser
- **Share modal** — Copy the viewer link (`/viewer`) to your clipboard and share with others
- **Dark mode UI** — A polished, dark-themed interface built with Tailwind CSS

---

## 📋 Prerequisites

- [Docker](https://docs.docker.com/get-docker/) (v20+)
- [Docker Compose](https://docs.docker.com/compose/install/) (v2+)

That's it. No Python, Node, or PostgreSQL installation needed on your host machine.

---

## 🚀 Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/Riddhi-chavan/face-stream.git
cd face-stream

# 2. Create environment file
cp .env.example .env

# 3. Build and start all services
docker compose up --build
```

Once running:

- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:5000](http://localhost:5000)
- **pgAdmin**: [http://localhost:5050](http://localhost:5050)

### Usage — Broadcaster (`/`)

1. Open the frontend at `localhost:5173`
2. Click **"Start Camera"** to activate your webcam
3. Click **"Go Live"** in the header to establish the WebSocket connection
4. Watch the annotated output appear with real-time face bounding boxes
5. Use the **FPS dropdown** to switch between 30, 60, and 120 fps
6. Toggle the **mirror button** (↔) to flip the camera horizontally
7. The **ROI Events** panel (right side) shows detection history from the database
8. The **Live Confidence** chart shows detection accuracy over time
9. Click **"Share"** in the header to copy the viewer link

### Usage — Viewer (`/viewer`)

1. Open `localhost:5173/viewer` in a separate tab or device
2. The viewer auto-connects and displays the annotated stream in real-time
3. When the broadcaster is offline, the viewer shows "Broadcaster is offline. Waiting for stream…"
4. Click the 📷 button to save a screenshot of the current frame

> **⚡ Performance Note:** Running both the broadcaster and viewer on the same machine (especially in Docker on a laptop) means the backend is processing frames, running face detection, and serving them — all locally. You may notice some lag on lower-end hardware. Deploying to a dedicated server with better CPU/GPU resources will significantly improve performance and frame rates.

---

## 📡 Endpoints

| Method | Path              | Description                                                               |
| ------ | ----------------- | ------------------------------------------------------------------------- |
| `WS`   | `/ws/stream`      | Bidirectional WebSocket — send JPEG frames, receive annotated JPEG frames |
| `WS`   | `/ws/feed`        | Read-only WebSocket — broadcasts latest annotated frame to viewers        |
| `GET`  | `/api/roi`        | REST — paginated ROI event data (`?limit=50&offset=0`)                    |
| `GET`  | `/api/roi/export` | REST — export all ROI events as CSV download                              |
| `GET`  | `/health`         | Health check — returns `{"status": "ok"}`                                 |

### `/api/roi` Response Format

```json
{
  "total": 312,
  "limit": 50,
  "offset": 0,
  "results": [
    {
      "id": 1,
      "frame_id": "uuid-...",
      "timestamp": "2025-01-01T12:00:00+00:00",
      "x": 120,
      "y": 80,
      "width": 200,
      "height": 210,
      "confidence": 0.97,
      "face_detected": true
    }
  ]
}
```

---

## 🏗️ How It Works

### Frame Pipeline

```
Browser (VideoCapture)
  │  Webcam → <canvas> → JPEG blob
  │  Mirror transform applied at pixel level (if enabled)
  │  Web Worker timer drives capture (not throttled in background tabs)
  │
  ▼
WebSocket (/ws/stream)
  │
  ▼
Flask Backend
  │  1. Decode JPEG → PIL Image → NumPy array
  │  2. MediaPipe FaceDetection → bounding box + confidence
  │  3. Pillow ImageDraw → red bounding box + label
  │  4. Save ROI to PostgreSQL (async thread)
  │  5. Send annotated JPEG back to broadcaster
  │  6. Store in shared frame buffer for viewers
  │
  ├──→ WebSocket (/ws/stream) → Broadcaster's VideoDisplay
  └──→ WebSocket (/ws/feed)   → Viewer's VideoDisplay
```

### Key Design Decisions

- **Web Worker for timing**: `requestAnimationFrame` and `setInterval` are throttled by browsers in background tabs. A dedicated Web Worker runs `setInterval` on a separate thread, ensuring frames continue to be captured at the target FPS even when the tab is not focused.
- **Pixel-level mirror**: The mirror transform is applied on the canvas before encoding to JPEG, so the backend processes and the viewer receives frames in the correct orientation — no client-side CSS coordination needed.
- **Shared frame buffer**: The `/ws/stream` handler stores each annotated frame in a thread-safe shared buffer. The `/ws/feed` endpoint reads from this buffer and broadcasts to all connected viewers, decoupling the processing pipeline from viewer distribution.
- **Async DB writes**: ROI data is saved to PostgreSQL in a background thread to avoid blocking the WebSocket frame loop.

---

## 🧪 Running Tests

```bash
# Run all smoke tests
docker compose exec backend pytest tests/ -v

# Run specific test files
docker compose exec backend pytest tests/test_health.py -v
docker compose exec backend pytest tests/test_detection.py -v
docker compose exec backend pytest tests/test_roi_api.py -v
```

---

## 📂 Project Structure

```
face-stream/
├── docker-compose.yml          # 4 services: db, backend, frontend, pgadmin
├── .env.example                # Environment variable template
├── architecture.png            # Architecture diagram
├── README.md
│
├── backend/
│   ├── Dockerfile
│   ├── entrypoint.sh           # Waits for DB, runs migrations, starts Flask
│   ├── requirements.txt
│   ├── alembic.ini
│   ├── app/
│   │   ├── __init__.py         # Flask app factory
│   │   ├── config.py           # Environment-based configuration
│   │   ├── extensions.py       # SQLAlchemy + Migrate instances
│   │   ├── models/
│   │   │   └── roi.py          # ROIEvent SQLAlchemy model
│   │   ├── routes/
│   │   │   ├── stream.py       # WS /ws/stream — bidirectional frame processing
│   │   │   ├── feed.py         # WS /ws/feed — annotated frame broadcast to viewers
│   │   │   └── roi.py          # REST /api/roi — paginated data + CSV export
│   │   ├── services/
│   │   │   ├── detection.py    # MediaPipe face detection (model_selection=0)
│   │   │   ├── drawing.py      # Pillow bounding box + confidence label drawing
│   │   │   └── storage.py      # PostgreSQL ROI persistence (async threaded)
│   │   └── migrations/         # Alembic migration scripts
│   └── tests/
│       ├── conftest.py         # Pytest fixtures
│       ├── test_health.py      # Server + route smoke tests
│       ├── test_detection.py   # MediaPipe detection smoke tests
│       └── test_roi_api.py     # REST API smoke tests
│
└── frontend/
    ├── Dockerfile
    ├── package.json
    ├── vite.config.js          # Vite config with WS/API proxy to backend
    ├── tailwind.config.js
    ├── index.html
    └── src/
        ├── main.jsx            # React entry point with BrowserRouter
        ├── App.jsx             # Routing (/ and /viewer), layout, WebSocket controls
        ├── index.css           # Global styles + Tailwind + dark theme
        ├── components/
        │   ├── VideoCapture.jsx    # Webcam capture, mirror, FPS control, Web Worker timer
        │   ├── VideoDisplay.jsx    # Annotated frame rendering, FPS counter, screenshot
        │   ├── ROIPanel.jsx        # ROI event table, CSV export button, auto-refresh
        │   └── ConfidenceChart.jsx # Live confidence line chart (Recharts)
        ├── hooks/
        │   └── useWebSocket.js     # Reusable WebSocket lifecycle hook (connect/disconnect/reconnect)
        └── workers/
            └── captureTimer.js     # Web Worker — un-throttled setInterval for background tabs
```

---

## 🔒 Security

- All secrets loaded from environment variables (never hardcoded)
- `.env` excluded from version control via `.gitignore`
- CORS restricted to `http://localhost:5173` only
- WebSocket frame size limit: 1 MB (frames > 1 MB are rejected)
- PostgreSQL only accessible within the Docker network (not exposed to host)
- `/api/roi` query param `limit` capped at 100

---

## 🛠️ Tech Stack

| Layer            | Technology                                             |
| ---------------- | ------------------------------------------------------ |
| Frontend         | React 18 + Vite 6 + Tailwind CSS 3                     |
| Routing          | React Router DOM 7                                     |
| Charts           | Recharts 3                                             |
| Backend          | Flask 3 + Flask-Sock (WebSockets) + Flask-CORS         |
| Face Detection   | MediaPipe 0.10 (`FaceDetection`, `model_selection=0`)  |
| Bounding Box     | Pillow (`ImageDraw` + `ImageFont`)                     |
| Database         | PostgreSQL 15 + SQLAlchemy 2 + Flask-Migrate (Alembic) |
| Containerisation | Docker + Docker Compose                                |
| DB Admin         | pgAdmin 4                                              |
| Testing          | pytest + pytest-flask                                  |

---

## 🤖 AI Usage Disclosure

This project was scaffolded with the assistance of **Antigravity**. Specifically, AI was used for:

- Generating the initial project structure and boilerplate code
- Writing the Flask app factory, route handlers, and service modules
- Creating the React components and WebSocket hook
- Writing Docker Compose configuration and Dockerfiles
- Generating the architecture diagram
- Writing this README

All generated code was reviewed and is provided as-is for the purposes of this project.

---

## 📄 License

MIT
