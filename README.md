# 📚 AskVerse — Enterprise Document-Centric Hybrid RAG Workstation

**AskVerse** is a premium, enterprise-grade Document Intelligence and Q&A Assistant. Designed for engineering manuals, Standard Operating Procedures (SOPs), maintenance records, and complex textbooks, AskVerse transforms massive documents into instant, fact-grounded answers.

It features a modern dual-engine hybrid architecture combining a high-performance **Next.js (React + TypeScript)** frontend, a responsive **FastAPI (Python)** backend running in WSL, and a hybrid RAG pipeline (semantic vector search via **SentenceTransformers** + keyword search) to query and cite documents in real-time.

---

## 🚀 Key Features

### 1. Document-Centric Workspace Isolation 📄
* **Independent Chat Histories**: Each uploaded PDF creates a distinct workspace in the sidebar. Chat sessions are strictly scoped per document and never mix.
* **Collapsible Sidebar Tree**: Sidebar history items are collapsible. Selecting a document expands its list of previous questions and automatically collapses other workspaces.
* **Direct Q&A Deep-Linking**: Clicking a previous question in the sidebar automatically focuses its parent PDF, loads the conversation feed, and redirects to the native browser PDF viewer at the exact cited page.

### 2. Native PDF Viewer & Cited Page Redirect 🎯
* **No Split Screen clutter**: Replaces crowded split panes with clean, native, high-performance browser PDF viewers launched in separate tabs.
* **Direct Hash-Page Redirection**: Click on cited page buttons (e.g. `Page 441`) to immediately open the native viewer centered exactly on that page.
* **Title Deep-Link**: Click the PDF name in the header or past questions in the sidebar to open the document at its first page or last-queried page.

### 3. Failsafe Dual-Engine Hybrid Mode ⚙️
* **Gemini 3.5 Cloud Engine**: Connects to the state-of-the-art **Gemini 3.5 Flash** API for high-speed, rich context reasoning.
* **Local Workstation Engine**: Runs 100% locally on your machine for complete offline security. Queries local LLMs (e.g., `qwen2.5:1.5b`, `llama3`) running via **Ollama**.

### 4. Advanced Hybrid Semantic Retrieval & Diagram Extraction 🔍
* **Semantic Embeddings**: Indexes PDF pages using `SentenceTransformer('all-MiniLM-L6-v2')` to compute 384-dimensional cosine similarity embeddings, stored in a local SQLite vector table.
* **Keyword Fallback**: Automatically falls back to high-performance keyword indexing if local models have network restrictions.
* **Image & Diagram Extraction**: Automatically extracts visual charts, figures, and diagrams from cited pages using `fitz` (PyMuPDF) and displays them inline inside the chat feed with click-to-zoom support.

### 5. Multi-Turn Conversational Memory 🧠
* **Coreference Resolution**: Automatically expands retrieval queries by merging pronouns (e.g., "it", "this") with previous question contexts, ensuring seamless follow-up inquiries.
* **Refusal & Commentary Cleanup**: Strict system-level prompt constraints and post-processing filters prevent model hallucinations, warnings, and meta-commentary from cluttering responses.

### 6. Mathematical LaTeX Typesetting (KaTeX) 🧮
* **Inline Variables**: Renders inline variables (e.g., \(x\)) seamlessly within normal text paragraphs.
* **Centered Equation Boxes**: Renders complex display formulas (e.g., `\[ ... \]`) in a beautifully styled, dedicated block container using high-performance CDN-loaded **KaTeX**.

### 7. Accessibility Integrations (STT & TTS) 🎙️
* **Speech-to-Text Dictation**: Built-in voice dictation allows real-time transcription right inside the chat bar. Features a pulsing visual radar indicator.
* **Read Aloud Assist**: Text-to-Speech capabilities read answers aloud, automatically sanitizing LaTeX syntax and markdown symbols for natural speech.

---

## 🛠️ Technology Stack

### Frontend (Client-Side)
* **Next.js 14 / React / TypeScript**: Modern component-driven architecture.
* **Tailwind CSS & Vanilla CSS**: Premium HSL-based styling, glassmorphism cards, and interactive theme overrides.
* **KaTeX**: Blazing-fast LaTeX rendering.
* **Web Speech API**: Powers dictation and read-aloud TTS.

### Backend (Server-Side)
* **FastAPI (Python)**: High-speed, asynchronous API endpoints, SSE event streaming, and session management.
* **PyMuPDF (fitz)**: Renders pages, extracts images, and scans bounding box coordinates.
* **SentenceTransformers**: Natively computes local document embeddings.
* **SQLite3**: Embeds relational schemas, chat history, and vector embeddings locally.

---

## 📁 Project Structure

```text
pdf-chatbot/
│
├── chatbot.db              # Local SQLite Database (ignored in git)
├── app.py                  # FastAPI Backend router & dual-engine controller
├── requirements.txt        # Python backend library dependencies
├── .env                    # Credentials configuration
├── DEPLOY_SCENARIO_A.md    # Local server deployment playbook
│
├── extracted_images/       # Directory containing extracted PDF diagrams
│
├── frontend/               # Next.js Client Application
│   ├── app/
│   │   ├── page.tsx        # Next.js home layout router
│   │   └── globals.css     # Global CSS variables, custom themes, and KaTeX styles
│   ├── components/
│   │   └── ChatInterface.tsx # Unified client logic (speech APIs, workspace, LaTeX parser)
│   ├── package.json        # Node.js dependencies
│   └── next.config.mjs     # Next.js configuration rules
```

---

## 🚀 Installation & Setup

### 1. Backend Setup (WSL / Linux Environment Recommended)
Navigate to the root directory inside your WSL terminal:
```bash
# Clone the repository
cd /mnt/c/Users/dell/OneDrive/Desktop/pdf-chatbot

# Create a native Linux virtual environment (bypasses NTFS disk lag)
python3 -m venv ~/pdf_chatbot_venv

# Activate it
source ~/pdf_chatbot_venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

Start the backend FastAPI server:
```bash
python app.py
```
* Backend starts at **http://localhost:8080**

### 2. Frontend Setup
Open a separate terminal window on Windows:
```bash
# Navigate to the frontend directory
cd C:\Users\dell\OneDrive\Desktop\pdf-chatbot\frontend

# Install node dependencies
npm install

# Start the Next.js development server
npm run dev
```
* Open your browser and navigate to **http://localhost:3000** to use AskVerse!
