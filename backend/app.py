import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from resume_parser import extract_resume_text
from analyzer import analyze_resume
from ai_feedback import generate_ai_feedback

load_dotenv()
app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")}})
app.config["MAX_CONTENT_LENGTH"] = 5 * 1024 * 1024  # 5 MB

@app.get("/api/health")
def health():
    return jsonify({"status": "ok", "message": "AI Resume Analyzer backend is running"})

@app.post("/api/analyze")
def analyze():
    if "resume" not in request.files:
        return jsonify({"error": "Please upload a PDF or DOCX resume."}), 400
    file = request.files["resume"]
    job_description = request.form.get("job_description", "").strip()

    if not file.filename:
        return jsonify({"error": "Choose a resume file first."}), 400
    if not job_description:
        return jsonify({"error": "Paste a job description to compare against."}), 400
    if len(job_description) > 20000:
        return jsonify({"error": "The job description is too long (maximum 20,000 characters)."}), 400

    try:
        resume_text = extract_resume_text(file)
        if len(resume_text.strip()) < 40:
            return jsonify({"error": "Very little text was extracted. If this is a scanned PDF, use an OCR-readable PDF or DOCX."}), 400
        result = analyze_resume(resume_text, job_description)
        result["resume_text_preview"] = resume_text[:1200]
        result["ai_feedback"] = generate_ai_feedback(resume_text, job_description, result)
        return jsonify(result)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    except Exception:
        app.logger.exception("Resume analysis failed")
        return jsonify({"error": "Analysis failed unexpectedly. Check the backend terminal for details."}), 500

@app.errorhandler(413)
def too_large(_error):
    return jsonify({"error": "File is too large. Maximum upload size is 5 MB."}), 413

if __name__ == "__main__":
    app.run(debug=os.getenv("FLASK_DEBUG", "true").lower() == "true", port=5000)
