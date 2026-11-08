# 🏸 RallyVision Pro — Professional BWF Court Telemetry & Performance Platform

RallyVision Pro is an enterprise-grade sports kinematics and match telemetry platform engineered for professional badminton players, national coaches, academies, and tournament institutions. It transforms video footage into spatial intelligence through high-precision computer vision, metric homography calibration, player tracking, kinematic stroke classification, and rally segmentation.

---

## 📑 Table of Contents
1. [Overview](#1-project-overview)
2. [Core Capabilities & Features](#2-core-capabilities--features)
3. [Technology Stack](#3-technology-stack)
4. [Architecture & System Flow](#4-architecture--system-flow)
5. [Installation & Setup](#5-installation--setup)
6. [Running the Application](#6-running-the-application)
7. [Running Tests & Quality Assurance](#7-running-tests--quality-assurance)
8. [Mobile PWA Installation](#8-mobile-pwa-installation)
9. [Docker & Production Deployment](#9-docker--production-deployment)
10. [Scientific Integrity & Known Limitations](#10-scientific-integrity--known-limitations)

---

## 1. Project Overview
Conventional sports video review relies on subjective manual tagging or decorative dashboards with fabricated stats. **RallyVision Pro** replaces speculation with empirical spatial calculations:
- **13.4m × 6.1m BWF Metric Mapping:** Uses 4-point homography transformations to calculate true ground distances in meters and physical speeds in km/h.
- **Player Footwork Dynamics:** Tracks continuous court positioning, calculates base reset recovery rates to the central T-mark, and monitors 6-zone court occupancy.
- **Rally Segmentation:** Classifies active points vs. rest intervals to calculate true work-to-rest ratios.
- **Shot Detection & Trajectory:** Classifies shots (Clear, Smash, Drop, Drive, Net Shot, Lift, Defensive) using pose reach and trajectory direction vectors.
- **Actionable Kinematic Recommendations:** Grounded coaching action plans directly tied to measured match metrics.
- **Publication-Grade PDF Reports:** Direct vector PDF generation with KPI tables, heatmaps, and tactical action plans.

---

## 2. Core Capabilities & Features

### A. Authentication, Two-Step Verification & Privacy
- Secure user registration and login with bcrypt password hashing, PyJWT tokens, and optional 6-digit Two-Step Verification (2FA).
- User profile configuration (dominant hand, court position specialization, play level, height, weight).
- Role-based authorization (`PLAYER`, `COACH`, `ADMINISTRATOR`) with strict multi-tenant data isolation.
- Complete GDPR / CCPA data export and one-click account purge.

### B. Video Upload & Storage Management
- Uploads MP4, MOV, MKV, WebM up to 250MB with real-time percentage upload progress.
- Direct mobile camera capture support (`capture="environment"`).
- Automated video metadata extraction (FPS, frame count, resolution, codec) and keyframe thumbnail generation via OpenCV.

### C. Court Detection & Interactive Calibration
- Automated Hough transform line detection for badminton court boundaries.
- Interactive, touch-friendly 4-corner drag-and-drop calibration canvas.
- Real-time 3x3 Homography Matrix ($H$) calculation mapping image pixels $(x, y)$ to court metric coordinates $(X_m, Y_m)$.

### D. Computer Vision Pipeline (15 Stages)
1. Video Ingestion & Stream Verification
2. Codec & Container Validation
3. Frame Extraction & Telemetry
4. Court Boundary Hough Line Detection
5. Homography Perspective Calibration
6. Foreground Motion Segmentation & Blob Clustering
7. Player Tracking & ID Persistence
8. Foot Contact Ground Anchor Projection
9. Shuttlecock Trajectory & Direction Inflection Detection
10. Shot Event Classification (Smash, Drop, Clear, Drive, Net, Lift, Defensive)
11. Active Rally vs Pause Interval Segmentation
12. Metric Distance & Velocity Integration
13. Match-Level Aggregation & 6-Zone Heatmap Synthesis
14. Data-Grounded Kinematic Coaching Recommendations
15. PDF Report Assembly & Vector Generation

### E. Analytics Dashboard & Replay Visualizer
- Synchronized HTML5 video player with frame-by-frame scrubbing ($\pm 0.1s$) and speed control ($0.5x - 1.25x$).
- Top-down 2D tactical court replay with animated player paths and colored shot event dots.
- 6-Zone tactical court heatmap with normalized heat gradient.
- Side-by-side match comparison with metric deltas.

---

## 3. Technology Stack

### Backend
- **Python 3.13**
- **FastAPI**: Asynchronous high-performance REST API
- **SQLAlchemy 2.0**: Relational ORM supporting SQLite (zero-setup out-of-the-box) and PostgreSQL
- **OpenCV (`cv2`) & NumPy**: Image processing, perspective transformation, contours, optical flow
- **ReportLab**: High-fidelity vector PDF generation
- **Pydantic v2**: Strict schema validation
- **PyJWT & Bcrypt**: Secure authentication & session tokens

### Frontend
- **React 19 & TypeScript**
- **Vite 8**: Ultra-fast build tool
- **Tailwind CSS v4**: Dark navy sports-tech design system
- **Recharts**: Responsive velocity and shot frequency charts
- **Lucide React**: Clean sports iconography
- **HTML5 Canvas & SVG**: Interactive 4-corner perspective calibration & tactical 2D court replay

---

## 4. Architecture & System Flow

```
                                  +---------------------------------------+
                                  |         Mobile PWA / Web Client       |
                                  | (React 19 + TypeScript + Tailwind v4) |
                                  +-------------------+-------------------+
                                                      |
                                          REST APIs / JSON / JWT
                                                      |
                                                      v
                                  +---------------------------------------+
                                  |            FastAPI Backend            |
                                  |    (Endpoints, Auth, CORS, Static)    |
                                  +-------------------+-------------------+
                                                      |
                         +----------------------------+----------------------------+
                         |                                                         |
                         v                                                         v
         +-------------------------------+                         +-------------------------------+
         |     Relational Database       |                         |    Async CV Processing Job    |
         |  (SQLite / PostgreSQL ORM)    |                         |  - OpenCV Frame Extraction    |
         |  - Users & Profiles           |                         |  - Homography Perspective H   |
         |  - Matches & Videos           |                         |  - Player & Shuttle Tracking  |
         |  - Trajectories & Shots       |                         |  - Rally Segmentation         |
         |  - Analytics & Recommendations|                         |  - ReportLab PDF Generation   |
         +-------------------------------+                         +-------------------------------+
```

---

## 5. Installation & Setup

### Prerequisites
- Python 3.11+ (Python 3.13 tested)
- Node.js 18+ (Node 20 tested) and npm

### Backend Installation
```bash
# Navigate to project directory
cd c:/Badminton

# Install backend dependencies
python -m pip install -r backend/requirements.txt
```

### Frontend Installation
```bash
# Navigate to frontend directory
cd c:/Badminton/frontend

# Install frontend dependencies
npm install
```

---

## 6. Running the Application

### 1. Launch the Backend API Server
```bash
# From project root (c:/Badminton)
python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```
- API Base: `http://localhost:8000/api`
- Interactive Swagger Documentation: `http://localhost:8000/docs`
- Health check: `http://localhost:8000/api/health`

### 2. Launch the Frontend Development Server
```bash
# From frontend folder (c:/Badminton/frontend)
npm run dev
```
- Open browser at: `http://localhost:5173`

---

## 7. Running Tests & Quality Assurance

A comprehensive test suite validates authentication, CRUD operations, court perspective geometry, shot classification algorithms, rally segmentation, and PDF generation:

```bash
# Run backend test suite
python -m pytest backend/tests -v
```

All 7 core test modules pass:
- `test_auth_and_user_flow`: User registration, profile updates, JWT verification
- `test_matches_crud_flow`: Match creation, retrieval, and deletion
- `test_court_homography_and_zones`: 4-point perspective matrix ($H$) & 6-zone classification
- `test_shot_classifier_logic`: Smash, Drop, Clear, and Net shot geometric heuristics
- `test_rally_analyzer`: Rally segmentation & pause interval splitting
- `test_movement_analyzer`: Metric distance integration, velocity smoothing, base recovery
- `test_pdf_report_generation`: Vector PDF report building with KPI tables and action plans

---

## 8. Mobile PWA Installation

RallyVision Pro is configured as an installable Progressive Web App:
- **Android / Chrome:** Open the URL, tap the browser menu (⋮), and tap **"Install App"** or **"Add to Home screen"**.
- **iOS / Safari:** Tap the **Share** button, scroll down, and tap **"Add to Home Screen"**.
- **Direct Camera Recording:** Mobile users can record match footage directly through the device camera using the dedicated **Record with Camera** button on the Upload screen.

---

## 9. Docker & Production Deployment

### Quick Docker Compose Startup
```bash
# Build and run backend and frontend containers
docker-compose up --build -d
```
- Access application at: `http://localhost:5173`

---

## 10. Scientific Integrity & Known Limitations

1. **Camera Angle & Shutter Speed:** High-frame-rate ($60+$ FPS) video with high shutter speed minimizes motion blur for high-speed smash speed estimation. On standard 30 FPS video, shuttlecock speed estimation is marked with low confidence bounds or flagged as estimated.
2. **Ground Contact Grounding:** Player positions are anchored to the bottom-center of the player bounding box (feet contact point) to accurately project coordinates through Homography matrix $H$.
3. **No Fabricated Statistics:** Empty states are displayed when no matches exist; metric calculations are strictly grounded in measured video telemetry.

