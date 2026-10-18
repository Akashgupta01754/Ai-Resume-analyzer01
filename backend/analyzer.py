import re
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# Extend this dictionary for the job families you want to support.
SKILL_ALIASES = {
    "python": ["python", "python3"],
    "java": ["java"],
    "javascript": ["javascript", "js"],
    "typescript": ["typescript"],
    "c++": ["c++", "cpp"],
    "sql": ["sql", "mysql", "postgresql", "postgres"],
    "react": ["react", "react.js", "reactjs"],
    "node.js": ["node.js", "nodejs"],
    "flask": ["flask"],
    "django": ["django"],
    "machine learning": ["machine learning", "ml"],
    "deep learning": ["deep learning"],
    "natural language processing": ["natural language processing", "nlp"],
    "scikit-learn": ["scikit-learn", "sklearn"],
    "pandas": ["pandas"],
    "numpy": ["numpy"],
    "tensorflow": ["tensorflow"],
    "pytorch": ["pytorch"],
    "data analysis": ["data analysis", "data analytics"],
    "data visualization": ["data visualization", "power bi", "tableau"],
    "excel": ["excel", "spreadsheets"],
    "statistics": ["statistics", "statistical analysis"],
    "rest api": ["rest api", "restful api", "api development"],
    "git": ["git", "github", "gitlab"],
    "docker": ["docker"],
    "aws": ["aws", "amazon web services"],
    "azure": ["azure", "microsoft azure"],
    "linux": ["linux"],
    "html": ["html", "html5"],
    "css": ["css", "css3"],
    "communication": ["communication", "communicate"],
    "leadership": ["leadership", "team lead"],
    "problem solving": ["problem solving", "analytical thinking"],
    "agile": ["agile", "scrum"],
}

def _normalize(text):
    return re.sub(r"\s+", " ", text.lower())

def _contains_term(text, term):
    # Match whole words where possible, including punctuation in skills such as C++.
    pattern = r"(?<![a-z0-9])" + re.escape(term.lower()) + r"(?![a-z0-9])"
    return re.search(pattern, text.lower()) is not None

def find_skills(text):
    normalized = _normalize(text)
    found = []
    for canonical, aliases in SKILL_ALIASES.items():
        if any(_contains_term(normalized, alias) for alias in aliases):
            found.append(canonical)
    return sorted(found)

def _similarity(resume_text, job_description):
    try:
        matrix = TfidfVectorizer(stop_words="english", ngram_range=(1, 2), max_features=8000).fit_transform(
            [resume_text, job_description]
        )
        return round(float(cosine_similarity(matrix[0:1], matrix[1:2])[0][0]) * 100)
    except ValueError:
        return 0

def _section_score(text):
    low = text.lower()
    checks = {
        "Contact details": any(x in low for x in ["@", "linkedin", "phone", "mobile"]),
        "Education": any(x in low for x in ["education", "university", "college", "degree", "b.tech", "bachelor"]),
        "Experience or projects": any(x in low for x in ["experience", "projects", "internship", "worked on", "developed"]),
        "Skills section": "skill" in low or "technologies" in low,
    }
    score = round(sum(checks.values()) / len(checks) * 100)
    return score, [{"criterion": name, "found": found} for name, found in checks.items()]

def analyze_resume(resume_text, job_description):
    resume_skills = find_skills(resume_text)
    job_skills = find_skills(job_description)
    matched = sorted(set(resume_skills) & set(job_skills))
    missing = sorted(set(job_skills) - set(resume_skills))
    skill_coverage = round(len(matched) / len(job_skills) * 100) if job_skills else 0
    relevance = _similarity(resume_text, job_description)
    structure, structure_checks = _section_score(resume_text)

    # Transparent project rubric. These are heuristic indicators, not a real ATS score.
    if job_skills:
        score = round(0.45 * skill_coverage + 0.35 * relevance + 0.20 * structure)
    else:
        score = round(0.65 * relevance + 0.35 * structure)

    recommendations = []
    if missing:
        recommendations.append("Review the job's required skills not detected in your resume: " + ", ".join(missing[:10]) + ". Add them only where they truthfully reflect your abilities.")
    if relevance < 35:
        recommendations.append("Tailor the summary and project bullets to the role. Use relevant wording from the job description only when it accurately describes your experience.")
    if not any(x["criterion"] == "Experience or projects" and x["found"] for x in structure_checks):
        recommendations.append("Add a Projects or Experience section with your contribution, tools used, and measurable outcome where available.")
    if not any(x["criterion"] == "Education" and x["found"] for x in structure_checks):
        recommendations.append("Add an Education section with your degree, institution, and expected or completed graduation date.")
    if not any(x["criterion"] == "Contact details" and x["found"] for x in structure_checks):
        recommendations.append("Check that your resume includes professional contact details.")
    if not recommendations:
        recommendations.append("Your resume contains several relevant signals. Improve project bullets with specific actions, technologies, and outcomes where accurate.")

    return {
        "score": score,
        "score_label": "Heuristic resume-to-job fit",
        "score_breakdown": [
            {"name": "Required skill coverage", "score": skill_coverage, "weight": 45 if job_skills else 0, "detail": f"{len(matched)} of {len(job_skills)} detected job skills found"},
            {"name": "Text relevance", "score": relevance, "weight": 35 if job_skills else 65, "detail": "TF-IDF cosine similarity"},
            {"name": "Resume structure", "score": structure, "weight": 20 if job_skills else 35, "detail": "Checks for common resume sections"},
        ],
        "skill_coverage": skill_coverage,
        "relevance_score": relevance,
        "structure_score": structure,
        "resume_skills": resume_skills,
        "job_skills": job_skills,
        "matched_skills": matched,
        "missing_skills": missing,
        "structure_checks": structure_checks,
        "recommendations": recommendations,
        "disclaimer": "This is an educational heuristic, not an official ATS score or a prediction of hiring outcomes. Skill detection is keyword-based and may miss synonyms or skills expressed differently."
    }
