import React, { useRef, useState } from "react";
import {
  FileText, Sparkles, UploadCloud, CheckCircle2, AlertCircle, Target,
  Gauge, WandSparkles, Download, RotateCcw, LoaderCircle, ShieldCheck,
  BriefcaseBusiness, ArrowRight, X
} from "lucide-react";

const API_URL = "http://127.0.0.1:5000/api/analyze";

function Pill({ children, kind = "neutral" }) {
  return <span className={`pill ${kind}`}>{children}</span>;
}

function ScoreRing({ score }) {
  const radius = 47;
  const circumference = 2 * Math.PI * radius;
  return (
    <div className="score-ring">
      <svg viewBox="0 0 120 120" aria-label={`Score ${score} out of 100`}>
        <circle cx="60" cy="60" r={radius} className="ring-bg" />
        <circle cx="60" cy="60" r={radius} className="ring-value"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - score / 100)} />
      </svg>
      <div className="ring-label"><strong>{score}</strong><span>out of 100</span></div>
    </div>
  );
}

function App() {
  const fileInput = useRef(null);
  const [file, setFile] = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);

  function acceptFile(candidate) {
    setError("");
    if (!candidate) return;
    const extension = candidate.name.split(".").pop().toLowerCase();
    if (!["pdf", "docx"].includes(extension)) {
      setError("Please choose a PDF or DOCX file.");
      return;
    }
    if (candidate.size > 5 * 1024 * 1024) {
      setError("File size must be 5 MB or less.");
      return;
    }
    setFile(candidate);
    setResult(null);
  }

  async function handleAnalyze(event) {
    event.preventDefault();
    setError("");
    setResult(null);
    if (!file) return setError("Upload your resume first.");
    if (jobDescription.trim().length < 30) return setError("Paste a job description with at least 30 characters.");
    const formData = new FormData();
    formData.append("resume", file);
    formData.append("job_description", jobDescription);
    setLoading(true);
    try {
      const response = await fetch(API_URL, { method: "POST", body: formData });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not analyze this resume.");
      setResult(data);
      setTimeout(() => document.getElementById("results")?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
    } catch (err) {
      setError(`${err.message}. Make sure the Flask backend is running on port 5000.`);
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setFile(null); setResult(null); setError(""); setJobDescription("");
    if (fileInput.current) fileInput.current.value = "";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function downloadReport() {
    if (!result) return;
    const report = {
      generated_at: new Date().toISOString(),
      score: result.score,
      score_breakdown: result.score_breakdown,
      matched_skills: result.matched_skills,
      missing_skills: result.missing_skills,
      recommendations: result.recommendations,
      disclaimer: result.disclaimer
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = "resume-analysis-report.json"; link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#" aria-label="ClearCV home">
          <span className="brand-mark"><Sparkles size={19} /></span>
          <span>clear<span className="brand-accent">CV</span></span>
        </a>
        <nav><a href="#how-it-works">How it works</a><a href="#analyzer">Analyzer</a></nav>
        <div className="topbar-tag"><ShieldCheck size={15} /> Private by design</div>
      </header>

      <main>
        <section className="hero">
          <div className="eyebrow"><Sparkles size={15} /> SMARTER CAREER TOOLS</div>
          <h1>Your next opportunity<br /><span>starts with your resume.</span></h1>
          <p className="hero-copy">Get a clear, practical view of how your resume aligns with a job. Find relevant skills, uncover gaps, and improve your application with confidence.</p>
          <div className="hero-points">
            <span><CheckCircle2 size={16} /> Resume insights</span>
            <span><CheckCircle2 size={16} /> Job match analysis</span>
            <span><CheckCircle2 size={16} /> Actionable feedback</span>
          </div>
        </section>

        <section className="workspace" id="analyzer">
          <div className="section-heading">
            <div><Pill kind="blue">RESUME WORKSPACE</Pill><h2>Analyze your resume</h2><p>Upload your file and add the job description you're targeting.</p></div>
            <div className="step-indicator"><span className="step-active">1</span><i></i><span className={result ? "step-active" : ""}>2</span><i></i><span className={result ? "step-active" : ""}>3</span></div>
          </div>

          <form className="input-grid" onSubmit={handleAnalyze}>
            <div className="panel upload-panel">
              <div className="panel-title"><span className="icon-box"><FileText size={19} /></span><div><h3>Your resume</h3><p>PDF or Word document</p></div></div>
              <input ref={fileInput} className="hidden-input" type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={e => acceptFile(e.target.files?.[0])} />
              <div className={`dropzone ${dragging ? "dragging" : ""} ${file ? "has-file" : ""}`}
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={e => { e.preventDefault(); setDragging(false); acceptFile(e.dataTransfer.files?.[0]); }}>
                {file ? <>
                  <span className="file-icon"><FileText size={26} /></span>
                  <strong className="filename">{file.name}</strong>
                  <span className="muted">{(file.size / 1024).toFixed(0)} KB · Ready to analyze</span>
                  <button type="button" className="text-button" onClick={() => { setFile(null); if (fileInput.current) fileInput.current.value = ""; }}>Remove file <X size={13} /></button>
                </> : <>
                  <span className="upload-icon"><UploadCloud size={28} /></span>
                  <strong>Drop your resume here</strong>
                  <span className="muted">or browse files from your computer</span>
                  <button type="button" className="secondary-button" onClick={() => fileInput.current?.click()}>Choose file</button>
                  <span className="tiny-note">PDF or DOCX · Maximum 5 MB</span>
                </>}
              </div>
              <div className="privacy-note"><ShieldCheck size={16} /><span>File is processed by your local backend and is not saved by this app.</span></div>
            </div>

            <div className="panel job-panel">
              <div className="panel-title"><span className="icon-box purple"><BriefcaseBusiness size={19} /></span><div><h3>Target job description</h3><p>Paste the role details below</p></div></div>
              <label htmlFor="job-description" className="field-label">JOB DESCRIPTION</label>
              <textarea id="job-description" value={jobDescription} onChange={e => setJobDescription(e.target.value)} placeholder={"Paste the job description here...\n\nExample: We are looking for a Python developer with experience in Flask, REST APIs, SQL, Git, and problem solving..."} maxLength={20000} />
              <div className="textarea-footer"><span>Include skills and responsibilities for a more useful comparison.</span><span>{jobDescription.length}/20,000</span></div>
              <button className="primary-button analyze-button" type="submit" disabled={loading}>
                {loading ? <><LoaderCircle className="spin" size={18} /> Analyzing resume...</> : <>Analyze my resume <ArrowRight size={17} /></>}
              </button>
            </div>
          </form>

          {error && <div className="error-banner" role="alert"><AlertCircle size={18} /><span>{error}</span><button onClick={() => setError("")} aria-label="Dismiss error"><X size={16} /></button></div>}
        </section>

        {result && <section className="results-section" id="results">
          <div className="results-header"><div><Pill kind="green">ANALYSIS COMPLETE</Pill><h2>Your resume insights</h2><p>Use these signals to improve alignment with this specific job description.</p></div><div className="results-actions"><button className="secondary-button" onClick={resetForm}><RotateCcw size={15} /> New analysis</button><button className="primary-button small" onClick={downloadReport}><Download size={15} /> Download report</button></div></div>
          <div className="results-grid">
            <div className="panel score-panel"><div className="panel-heading-row"><h3>Resume-to-job fit</h3><Gauge size={19} className="soft-icon" /></div><ScoreRing score={result.score} /><p className="score-caption">{result.score >= 75 ? "Strong alignment signals" : result.score >= 50 ? "Some relevant alignment" : "Room to improve alignment"}</p><p className="muted centered">A heuristic score, not a hiring prediction.</p><div className="score-metrics">
              <div><span>Skill coverage</span><strong>{result.skill_coverage}%</strong></div>
              <div><span>Text relevance</span><strong>{result.relevance_score}%</strong></div>
              <div><span>Structure checks</span><strong>{result.structure_score}%</strong></div>
            </div></div>
            <div className="panel breakdown-panel"><div className="panel-heading-row"><h3>Score breakdown</h3><span className="muted small-text">Transparent rubric</span></div>
              {result.score_breakdown.map(item => <div className="breakdown-item" key={item.name}><div className="breakdown-top"><span>{item.name}</span><strong>{item.score}%</strong></div><div className="progress-track"><div className="progress-fill" style={{ width: `${item.score}%` }} /></div><div className="breakdown-detail">{item.detail}</div></div>)}
              <div className="rubric-note"><AlertCircle size={15} /><span>Skill coverage, text similarity, and basic section checks are estimates, not an official ATS calculation.</span></div>
            </div>
          </div>

          <div className="skills-grid">
            <div className="panel skills-panel"><div className="panel-heading-row"><h3><CheckCircle2 size={18} className="green-icon" /> Matched skills</h3><Pill kind="green">{result.matched_skills.length} found</Pill></div><p className="muted">Skills detected in both the resume and job description.</p><div className="skill-tags">{result.matched_skills.length ? result.matched_skills.map(s => <Pill kind="green" key={s}>{s}</Pill>) : <span className="empty-state">No shared skills detected yet.</span>}</div></div>
            <div className="panel skills-panel"><div className="panel-heading-row"><h3><Target size={18} className="orange-icon" /> Skills to review</h3><Pill kind="orange">{result.missing_skills.length} not detected</Pill></div><p className="muted">These job-description skills were not found in the resume text.</p><div className="skill-tags">{result.missing_skills.length ? result.missing_skills.map(s => <Pill kind="orange" key={s}>{s}</Pill>) : <span className="empty-state">All detected job skills were found in the resume.</span>}</div></div>
          </div>

          <div className="panel recommendations-panel"><div className="panel-heading-row"><h3><WandSparkles size={19} className="purple-icon" /> Recommended next steps</h3><Pill kind="blue">{result.recommendations.length} suggestions</Pill></div><div className="recommendation-list">{result.recommendations.map((item, i) => <div className="recommendation" key={i}><span className="recommendation-number">{String(i + 1).padStart(2, "0")}</span><p>{item}</p></div>)}</div>
            <div className="ai-box"><span className="ai-box-icon"><Sparkles size={18} /></span><div><strong>AI writing feedback</strong><p>{result.ai_feedback?.enabled ? result.ai_feedback.summary : result.ai_feedback?.message || "Optional AI feedback is unavailable. Your NLP analysis is complete."}</p>
              {result.ai_feedback?.enabled && result.ai_feedback.suggestions?.length > 0 && <ul>{result.ai_feedback.suggestions.map((s, i) => <li key={i}>{s}</li>)}</ul>}
              {result.ai_feedback?.enabled && result.ai_feedback.rewritten_bullet_examples?.length > 0 && <><strong>Example bullet improvements</strong><ul>{result.ai_feedback.rewritten_bullet_examples.map((s, i) => <li key={i}>{s}</li>)}</ul></>}
            </div></div>
          </div>

          <div className="disclaimer"><ShieldCheck size={17} /><p>{result.disclaimer} Review all recommendations yourself and only include skills or achievements that are true.</p></div>
        </section>}

        <section className="how-section" id="how-it-works"><div className="eyebrow">SIMPLE BY DESIGN</div><h2>Useful insights in three steps.</h2><div className="how-grid">
          <div className="how-card"><span className="how-number">01</span><span className="how-icon"><UploadCloud size={21} /></span><h3>Upload your resume</h3><p>We extract text from your PDF or DOCX file for analysis.</p></div>
          <div className="how-card"><span className="how-number">02</span><span className="how-icon"><Target size={21} /></span><h3>Compare with the role</h3><p>NLP compares relevant terms, skills, and resume sections.</p></div>
          <div className="how-card"><span className="how-number">03</span><span className="how-icon"><Sparkles size={21} /></span><h3>Improve with a plan</h3><p>Get a transparent score and specific next steps to review.</p></div>
        </div></section>
      </main>
      <footer><a className="brand footer-brand" href="#"><span className="brand-mark"><Sparkles size={16} /></span><span>clear<span className="brand-accent">CV</span></span></a><span>Built for clearer, more confident applications.</span><span>Local demo · Your career, your story.</span></footer>
    </div>
  );
}

export default App;
