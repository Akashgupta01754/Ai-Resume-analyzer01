# ClearCV — AI Resume Analyzer

A local full-stack project using React + Vite, Flask, PDF/DOCX parsing, TF-IDF similarity, skill matching, and optional OpenAI feedback.

## Requirements
- Python 3.10+
- Node.js 20+ recommended
- VS Code

## Backend setup (macOS)
Open a terminal in the project folder:

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements.txt
cp .env.example .env
python app.py
```

Backend health check: http://127.0.0.1:5000/api/health

Optional AI: edit `backend/.env` and add your own `OPENAI_API_KEY`. Never commit the key or put it in frontend code. Without a key, the NLP analyzer still works.

## Frontend setup
Open a second terminal in VS Code:

```bash
cd frontend
npm install
npm run dev
```

Open the Vite URL shown in the terminal, normally http://localhost:5173.

## How to use
1. Upload a text-readable PDF or DOCX resume (max 5 MB).
2. Paste a target job description (at least 30 characters).
3. Click Analyze my resume.
4. Review score breakdown, matched/missing skills, and recommendations.
5. Download the JSON report.

## Test the backend
With the backend running, open a new terminal and run:

```bash
curl http://127.0.0.1:5000/api/health
```

Expected JSON includes `"status": "ok"`.

## Scoring
The score is a transparent heuristic combining skill coverage, TF-IDF text relevance, and basic resume-section checks. It is not an official ATS score or a hiring prediction. Skill detection uses a small editable alias dictionary in `analyzer.py`.

## Limitations and safety
- Scanned/image-only PDFs may require OCR before text can be extracted.
- Skill extraction is keyword-based and may miss synonyms, context, or skills expressed in other ways.
- Do not use the score as a hiring decision or as a substitute for human review.
- The uploaded file is processed in memory and not saved by this application. If AI feedback is enabled, extracted resume text and job description are sent to the configured AI provider; get appropriate consent and review that provider's privacy terms.
- The Flask development server is for local development only. Do not expose it publicly as-is.
