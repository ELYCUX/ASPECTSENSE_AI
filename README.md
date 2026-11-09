# AspectSense AI
> **An Intelligent Aspect-Based E-Commerce Product Feedback Analysis and Summarization System**

[![React](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB?logo=react)](https://reactjs.org/)
[![Flask](https://img.shields.io/badge/Backend-Python%20Flask-000000?logo=flask)](https://flask.palletsprojects.com/)
[![PostgreSQL](https://img.shields.io/badge/Database-Supabase%20PostgreSQL-3ECF8E?logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/UI-Tailwind%20CSS-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![HuggingFace](https://img.shields.io/badge/NLP-RoBERTa%20%2B%20SpaCy-FFD21E?logo=huggingface)](https://huggingface.co/)

AspectSense AI is an enterprise-grade product review intelligence platform that automatically extracts product aspects (e.g., *battery life*, *camera quality*, *build durability*), computes aspect-level sentiments using fine-tuned RoBERTa models and SpaCy NLP pipelines, generates AI-driven executive summaries, calculates Product Health & Business Priority Scores, and provides a dual-portal architecture with Role-Based Access Control (RBAC).

---

## 🌟 Key Features

### 1. Dual-Portal Architecture with Role-Based Access Control (RBAC)
- **Admin Portal (`/admin/*`)**:
  - System-wide KPI dashboard (total users, active/suspended accounts, product counts, review metrics, AI job queues).
  - Complete **User Management** (view, search, filter by role/status, pagination, edit profile, role promotion, account suspension, safe account deletion).
  - Content moderation (global product inventory & review management).
  - Amazon URL import monitoring and background AI job tracking.
  - Searchable **Audit Trail & Activity Logs** capturing all admin actions.
  - System settings control (rate limits, review limits, maintenance mode).
- **User Portal (`/dashboard`)**:
  - Product catalog and health score analytics.
  - Aspect sentiment distributions and rating trends.
  - Competitor product comparison matrix.
  - Exportable business reports (styled PDF via ReportLab & Excel via openpyxl).

### 2. Amazon Product & Review Link Import
- Direct URL ingestion for Amazon products across 15+ international Amazon marketplaces (`amazon.com`, `amazon.in`, `amazon.co.uk`, etc.).
- Automated ASIN extraction and Rainforest API integration.
- Interactive product and customer review preview with multi-select import capabilities.

### 3. Aspect-Based Sentiment Analysis (ABSA) Pipeline
- **Preprocessing:** Text normalization, HTML/URL cleaning, emoji expansion, and sentence segmentation.
- **Aspect Extraction:** Domain-aware SpaCy PhraseMatcher with rule-based fallback detecting 17+ e-commerce product aspects.
- **Sentiment Detection:** RoBERTa transformer model (`gauneg/roberta-base-absa-ate-sentiment`) with context and negation-aware sentiment scoring.
- **AI Executive Summaries:** Multi-provider LangChain summarizer (OpenAI / Google Gemini) with data-driven extractive fallback.

### 4. Metrics & Decision Intelligence
- **Product Health Score:** Weighted composite score based on average rating, review volume, and sentiment polarity.
- **Business Priority Matrix:** Categorizes products into *Urgent Attention*, *High Opportunity*, *Maintain*, and *Monitor*.
- **Review Quality Scoring:** Detects review completeness and flags spam or duplicate entries.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, React Router v6, Lucide React, Chart.js / Recharts, Framer Motion, Axios |
| **Backend** | Python 3.11+, Flask, Flask-CORS, Flask-Caching, PyJWT, bcrypt, pg8000 |
| **Database** | Supabase PostgreSQL (Managed cloud PostgreSQL pooler) |
| **NLP & AI** | SpaCy (`en_core_web_sm`), Hugging Face Transformers (`RoBERTa`), PyTorch, LangChain |
| **External APIs** | Rainforest API (Amazon Product Data & Customer Reviews) |
| **Reporting** | ReportLab (PDF generation), openpyxl (Excel spreadsheets), Pandas, NumPy |

---

## 📁 Project Structure

```text
aspectsense-ai/
├── backend/
│   ├── ai/                     # NLP & ABSA pipeline (model loader, preprocessing, aspect extraction, RoBERTa sentiment)
│   ├── config/                 # Database connection & connection pooler (pg8000)
│   ├── controllers/            # Controller logic
│   ├── db/                     # Baseline SQL schema & initial seeds
│   ├── middleware/             # Auth middleware (@token_required, @admin_required)
│   ├── migrations/             # Incremental SQL migrations (RBAC, ownership, audit logs)
│   ├── models/                 # UserModel, ProductModel, ReviewModel
│   ├── routes/                 # Blueprint APIs (auth, admin, products, reviews, amazon, analysis, reports)
│   ├── services/               # Rainforest API service, metrics calculation
│   ├── app.py                  # Flask application entrypoint
│   ├── requirements.txt        # Python backend dependencies
│   └── .env.example            # Environment variables template
├── frontend/
│   ├── src/
│   │   ├── admin/              # Dedicated Admin Portal (Layout, Dashboard, User Management, Logs, Settings)
│   │   ├── components/         # Shared UI components, layout (Sidebar, Navbar), charts
│   │   ├── pages/              # User Portal pages (Dashboard, Amazon Import, AI Insights, Products, Reviews, Compare)
│   │   ├── services/           # Axios API services
│   │   ├── App.jsx             # React Router configuration & <AdminRoute> guards
│   │   └── main.jsx            # Application root
│   ├── package.json            # Frontend dependencies & scripts
│   ├── tailwind.config.js      # Tailwind CSS configuration
│   └── vite.config.js          # Vite build config
├── .gitignore                  # Git ignore rules for Python, Node, and secrets
└── README.md                   # Project documentation
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18.0.0 or higher) & **npm**
- **Python** (v3.10 or v3.11 recommended) & **pip**
- **Git**
- Supabase PostgreSQL account (or local PostgreSQL instance)

---

### Step 1: Clone the Repository
```bash
git clone https://github.com/YOUR_USERNAME/aspectsense-ai.git
cd aspectsense-ai
```

---

### Step 2: Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create a Python virtual environment
python -m venv venv

# Activate virtual environment
# Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# macOS / Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Download the SpaCy English language model
python -m spacy download en_core_web_sm

# Configure environment variables
cp .env.example .env
# Edit .env and enter your Supabase DB credentials and JWT secret
```

#### Run Database Migrations
```bash
python run_migrations.py
```

#### Start Flask Backend Server
```bash
python app.py
```
*Backend API starts at `http://127.0.0.1:5000`*

---

### Step 3: Frontend Setup
Open a new terminal window:
```bash
# Navigate to frontend directory
cd frontend

# Install npm packages
npm install

# Start Vite development server
npm run dev
```
*Frontend runs at `http://localhost:5173`*

---

## 🔐 Default Credentials

| Portal | Email | Password | Role | Redirect Target |
|---|---|---|---|---|
| **Admin Portal** | `admin@aspectai.com` | `password123` | `admin` | `/admin/dashboard` |
| **User Portal** | `demo@aspectai.com` | `password123` | `user` | `/dashboard` |

> 💡 *Admins have full privileges to manage users, toggle account statuses, assign roles, view system audit logs, and configure system settings.*

---

## 🛡️ Security & Privacy
- **Zero Secret Exposure:** Credentials, database passwords, and API keys are stored strictly in server-side `.env` files and never committed to source control or exposed to React client bundles.
- **Server-Side Authorization:** Role validation occurs dynamically at the database level on every request via Flask `@token_required` and `@admin_required` decorators.
- **Suspension Enforcement:** Suspended users are immediately denied access with HTTP 403 Forbidden.

---

## 📄 License
This project is licensed under the MIT License.
