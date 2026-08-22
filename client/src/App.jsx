import { useState, useEffect } from "react";
import "./App.css";

function App() {

  const [file, setFile] = useState(null);
  const [jobDescription, setJobDescription] = useState("");

  const [resume, setResume] = useState(null);
  const [resumeId, setResumeId] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("theme") === "dark"
  );
const [matchResult, setMatchResult] = useState(null);


  // ========================================
  // THEME
  // ========================================

  useEffect(() => {

    if (darkMode) {

      document.body.classList.add("dark-mode");

      localStorage.setItem("theme", "dark");

    } else {

      document.body.classList.remove("dark-mode");

      localStorage.setItem("theme", "light");

    }

  }, [darkMode]);


  // ========================================
  // FILE SELECTION
  // ========================================

  const handleFileChange = (event) => {

    const selectedFile = event.target.files[0];

    if (!selectedFile) {
      return;
    }


    const allowedExtensions = [
      ".pdf",
      ".docx"
    ];

    const fileName =
      selectedFile.name.toLowerCase();

    const isValid =
      allowedExtensions.some(
        extension => fileName.endsWith(extension)
      );


    if (!isValid) {

      setError(
        "Please upload a PDF or DOCX resume."
      );

      setFile(null);

      return;
    }


    if (selectedFile.size > 5 * 1024 * 1024) {

      setError(
        "File size must be less than 5 MB."
      );

      setFile(null);

      return;
    }


    setFile(selectedFile);

    setResume(null);
    setResumeId(null);
    setError("");

  };


  // ========================================
  // PROCESS RESUME
  // ========================================

  const processResume = async () => {

    if (!file) {

      setError(
        "Please upload your resume first."
      );

      return;
    }


    setLoading(true);
    setError("");
    setResume(null);


    try {

      const formData = new FormData();

      formData.append(
        "resume",
        file
      );


      const response = await fetch(
        "http://localhost:5000/api/screen-resume",
        {
          method: "POST",
          body: formData
        }
      );


      const data =
        await response.json();


      if (!response.ok) {

        throw new Error(
          data.message ||
          "Failed to process resume."
        );

      }


      setResume(
        data.resume
      );

      setResumeId(
        data.resumeId
      );


    } catch (error) {

      console.error(error);

      setError(
        error.message ||
        "Unable to process resume."
      );

    } finally {

      setLoading(false);

    }

  };


  // ========================================
  // SCREEN RESUME
  // ========================================



const screenResume = async () => {

  console.log("Screen Candidate clicked.");

  console.log("Resume ID:", resumeId);

  console.log(
    "Job description length:",
    jobDescription.length
  );


  if (!resumeId) {

    setError(
      "Please extract the resume first."
    );

    return;
  }


  if (!jobDescription.trim()) {

    setError(
      "Please enter the job description."
    );

    return;
  }


  setLoading(true);
  setError("");


  try {

    console.log(
      "Sending resume to matching API..."
    );


    const response = await fetch(
      "http://localhost:5000/api/match-resume",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          resumeId: resumeId,
          jobDescription: jobDescription
        })
      }
    );


    console.log(
      "Matching response status:",
      response.status
    );


    const data =
      await response.json();


    console.log(
      "Matching response:",
      data
    );


    if (!response.ok) {

      throw new Error(
        data.message ||
        "Failed to match resume."
      );

    }


    setMatchResult(
      data.matchResult
    );


  } catch (error) {

    console.error(
      "Matching error:",
      error
    );

    setError(
      error.message ||
      "Unable to match resume."
    );

  } finally {

    setLoading(false);

  }

};
  // ========================================
  // RETURN UI
  // ========================================

  return (

    <div className="app">


      {/* ====================================
          HEADER
      ==================================== */}

      <header className="header">

        <div className="logo">

          <span>AI</span>

          Smart Resume Screener

        </div>


        <div className="header-actions">

          <button
            className="theme-toggle"
            onClick={() =>
              setDarkMode(!darkMode)
            }
            type="button"
          >

            {darkMode
              ? "☀ Light"
              : "🌙 Dark"
            }

          </button>


          <div className="header-badge">

            Powered by Gemini

          </div>

        </div>

      </header>



      {/* ====================================
          MAIN
      ==================================== */}

      <main className="main">


        {/* HERO */}

        <section className="hero">

          <p className="small-title">

            AI-POWERED RECRUITMENT

          </p>


          <h1>

            Find the right
            <span> candidate faster.</span>

          </h1>


          <p className="description">

            Upload a resume and provide a job
            description. Our AI extracts candidate
            information and evaluates how well the
            candidate fits the role.

          </p>

        </section>



        {/* ====================================
            INPUT GRID
        ==================================== */}

        <section className="screening-grid">


          {/* ==================================
              RESUME CARD
          ================================== */}

          <div className="card input-card">


            <div className="card-icon">

              📄

            </div>


            <div className="card-header">

              <h2>

                Candidate Resume

              </h2>

              <p>

                Upload PDF or DOCX • Maximum 5 MB

              </p>

            </div>


            <label className="upload-box">


              <input
                type="file"
                accept=".pdf,.docx"
                onChange={handleFileChange}
              />


              <div className="upload-icon">

                ↑

              </div>


              <h3>

                {file
                  ? file.name
                  : "Choose your resume"
                }

              </h3>


              <p>

                Click to browse your computer

              </p>


            </label>


            {file && (

              <div className="selected-file">

                <div>

                  <strong>
                    Resume selected
                  </strong>

                  <p>
                    {file.name}
                  </p>

                </div>


                <span>

                  {(file.size / 1024).toFixed(1)}
                  {" KB"}

                </span>

              </div>

            )}


            <button
              className="secondary-button"
              onClick={processResume}
              disabled={
                loading ||
                !file
              }
            >

              {loading
                ? "Extracting Resume..."
                : "Extract Resume"
              }

            </button>

          </div>



          {/* ==================================
              JOB DESCRIPTION CARD
          ================================== */}

          <div className="card input-card">


            <div className="card-icon">

              💼

            </div>


            <div className="card-header">

              <h2>

                Job Description

              </h2>

              <p>

                Paste the job requirements below

              </p>

            </div>


            <textarea
              className="job-description"
              placeholder={
                "Example:\n\n" +
                "We are looking for a Software Engineer " +
                "with strong Java, SQL and Spring Boot " +
                "skills. The candidate should have " +
                "experience building REST APIs and working " +
                "with databases..."
              }
              value={jobDescription}
              onChange={(event) =>
                setJobDescription(
                  event.target.value
                )
              }
            />


            <div className="character-count">

              {jobDescription.length}
              {" characters"}

            </div>


            <button
              className="screen-button"
              onClick={screenResume}
              disabled={
                loading ||
                !resumeId ||
                !jobDescription.trim()
              }
            >

              🎯 Screen Candidate

            </button>

          </div>

        </section>



        {/* ====================================
            ERROR
        ==================================== */}

        {error && (

          <div className="error">

            {error}

          </div>

        )}



        {/* ====================================
            EXTRACTED RESUME
        ==================================== */}

        {resume && (

          <section className="results">


            <div className="results-title">

              <p className="small-title">

                RESUME PROCESSED

              </p>


              <h2>

                Candidate Profile

              </h2>


              <p className="result-description">

                Information extracted from the
                uploaded resume using Gemini AI.

              </p>

            </div>



            {/* CANDIDATE */}

            <div className="result-card candidate-card">

              <h3>

                👤 Candidate Information

              </h3>


              <div className="candidate-info-grid">


                <div>

                  <span>Name</span>

                  <strong>

                    {resume.candidate?.name ||
                      "Not provided"}

                  </strong>

                </div>


                <div>

                  <span>Email</span>

                  <strong>

                    {resume.candidate?.email ||
                      "Not provided"}

                  </strong>

                </div>


                <div>

                  <span>Phone</span>

                  <strong>

                    {resume.candidate?.phone ||
                      "Not provided"}

                  </strong>

                </div>

              </div>

            </div>



            {/* SKILLS + EDUCATION */}

            <div className="result-grid">


              {/* SKILLS */}

              <div className="result-card">

                <h3>

                  🛠 Technical Skills

                </h3>


                <div className="tags">

                  {resume.skills &&
                  resume.skills.length > 0 ? (

                    resume.skills.map(
                      (skill, index) => (

                        <span key={index}>

                          {skill}

                        </span>

                      )
                    )

                  ) : (

                    <p>
                      No skills detected.
                    </p>

                  )}

                </div>

              </div>



              {/* EDUCATION */}

              <div className="result-card">

                <h3>

                  🎓 Education

                </h3>


                {resume.education &&
                resume.education.length > 0 ? (

                  resume.education.map(
                    (education, index) => (

                      <div
                        className="education-item"
                        key={index}
                      >

                        <strong>

                          {education.degree ||
                            "Degree not specified"}

                        </strong>


                        <p>

                          {education.institution ||
                            "Institution not specified"}

                        </p>


                        {education.year && (

                          <span>

                            {education.year}

                          </span>

                        )}

                      </div>

                    )
                  )

                ) : (

                  <p>
                    No education information detected.
                  </p>

                )}

              </div>

            </div>



            {/* EXPERIENCE */}

            <div className="result-card">

              <h3>

                💼 Experience

              </h3>


              {resume.experience &&
              resume.experience.length > 0 ? (

                resume.experience.map(
                  (experience, index) => (

                    <div
                      className="experience-item"
                      key={index}
                    >

                      <div>

                        <strong>

                          {experience.role ||
                            "Role not specified"}

                        </strong>

                        <span>

                          {experience.company ||
                            "Company not specified"}

                        </span>

                      </div>


                      {experience.duration && (

                        <small>

                          {experience.duration}

                        </small>

                      )}


                      <p>

                        {experience.description ||
                          "No description available."}

                      </p>

                    </div>

                  )
                )

              ) : (

                <div className="empty-state">

                  No professional experience
                  detected in the resume.

                </div>

              )}

            </div>



            {/* PROJECTS */}

            <div className="result-card">

              <h3>

                🚀 Projects

              </h3>


              {resume.projects &&
              resume.projects.length > 0 ? (

                <div className="projects-list">

                  {resume.projects.map(
                    (project, index) => (

                      <div
                        className="project-item"
                        key={index}
                      >

                        <strong>

                          {project.name ||
                            "Project"}

                        </strong>


                        <p>

                          {project.description ||
                            "No description available."}

                        </p>


                        {project.technologies &&
                        project.technologies.length > 0 && (

                          <div className="tags">

                            {project.technologies.map(
                              (technology, techIndex) => (

                                <span
                                  key={techIndex}
                                >

                                  {technology}

                                </span>

                              )
                            )}

                          </div>

                        )}

                      </div>

                    )
                  )}

                </div>

              ) : (

                <div className="empty-state">

                  No projects detected.

                </div>

              )}

            </div>



            {/* CERTIFICATIONS */}

            {resume.certifications &&
            resume.certifications.length > 0 && (

              <div className="result-card">

                <h3>

                  🏆 Certifications

                </h3>


                <div className="tags">

                  {resume.certifications.map(
                    (certification, index) => (

                      <span key={index}>

                        {certification}

                      </span>

                    )
                  )}

                </div>

              </div>

            )}


          </section>

        )}
        {matchResult && (

          <section className="match-results">

            <div className="results-title">

              <p className="small-title">
                AI SCREENING RESULT
              </p>

              <h2>
                Candidate Match Analysis
              </h2>

              <p className="result-description">
                Gemini compared the candidate's resume
                with the provided job description.
              </p>

            </div>


            {/* SCORE */}

            <div className="match-summary">

              <div className="score-card">

                <div className="score-label">
                  MATCH SCORE
                </div>

                <div className="score">
                  {matchResult.matchScore}
                  <span>/10</span>
                </div>

              </div>


              <div
                className={
                  matchResult.shortlisted
                    ? "decision-card shortlisted"
                    : "decision-card not-shortlisted"
                }
              >

                <div className="decision-icon">

                  {matchResult.shortlisted
                    ? "✓"
                    : "!"
                  }

                </div>

                <div>

                  <div className="decision-label">
                    RECRUITER DECISION
                  </div>

                  <strong>

                    {matchResult.shortlisted
                      ? "SHORTLISTED"
                      : "NOT SHORTLISTED"
                    }

                  </strong>

                </div>

              </div>

            </div>


            {/* SKILLS */}

            <div className="match-grid">


              {/* MATCHED */}

              <div className="match-card">

                <h3>
                  ✅ Matched Skills
                </h3>

                <div className="tags">

                  {matchResult.matchedSkills &&
                  matchResult.matchedSkills.length > 0 ? (

                    matchResult.matchedSkills.map(
                      (skill, index) => (

                        <span
                          className="matched-tag"
                          key={index}
                        >
                          {skill}
                        </span>

                      )
                    )

                  ) : (

                    <p>
                      No matching skills identified.
                    </p>

                  )}

                </div>

              </div>


              {/* MISSING */}

              <div className="match-card">

                <h3>
                  ❌ Missing Skills
                </h3>

                <div className="tags">

                  {matchResult.missingSkills &&
                  matchResult.missingSkills.length > 0 ? (

                    matchResult.missingSkills.map(
                      (skill, index) => (

                        <span
                          className="missing-tag"
                          key={index}
                        >
                          {skill}
                        </span>

                      )
                    )

                  ) : (

                    <p>
                      No significant missing skills.
                    </p>

                  )}

                </div>

              </div>

            </div>


            {/* STRENGTHS / WEAKNESSES */}

            <div className="match-grid">


              <div className="match-card">

                <h3>
                  💪 Candidate Strengths
                </h3>

                {matchResult.strengths &&
                matchResult.strengths.length > 0 ? (

                  <ul className="analysis-list">

                    {matchResult.strengths.map(
                      (item, index) => (

                        <li key={index}>
                          {item}
                        </li>

                      )
                    )}

                  </ul>

                ) : (

                  <p>
                    No specific strengths identified.
                  </p>

                )}

              </div>


              <div className="match-card">

                <h3>
                  ⚠️ Areas to Improve
                </h3>

                {matchResult.weaknesses &&
                matchResult.weaknesses.length > 0 ? (

                  <ul className="analysis-list">

                    {matchResult.weaknesses.map(
                      (item, index) => (

                        <li key={index}>
                          {item}
                        </li>

                      )
                    )}

                  </ul>

                ) : (

                  <p>
                    No major weaknesses identified.
                  </p>

                )}

              </div>

            </div>


            {/* EXPERIENCE / PROJECTS */}

            <div className="match-grid">


              <div className="match-card">

                <h3>
                  💼 Relevant Experience
                </h3>

                {matchResult.relevantExperience &&
                matchResult.relevantExperience.length > 0 ? (

                  <ul className="analysis-list">

                    {matchResult.relevantExperience.map(
                      (item, index) => (

                        <li key={index}>
                          {item}
                        </li>

                      )
                    )}

                  </ul>

                ) : (

                  <p>
                    No directly relevant experience identified.
                  </p>

                )}

              </div>


              <div className="match-card">

                <h3>
                  🚀 Relevant Projects
                </h3>

                {matchResult.relevantProjects &&
                matchResult.relevantProjects.length > 0 ? (

                  <ul className="analysis-list">

                    {matchResult.relevantProjects.map(
                      (item, index) => (

                        <li key={index}>
                          {item}
                        </li>

                      )
                    )}

                  </ul>

                ) : (

                  <p>
                    No directly relevant projects identified.
                  </p>

                )}

              </div>

            </div>


            {/* AI JUSTIFICATION */}

            <div className="justification-card">

              <div className="justification-icon">
                🤖
              </div>

              <div>

                <h3>
                  AI Recruiter Justification
                </h3>

                <p>
                  {matchResult.justification}
                </p>

              </div>

            </div>

          </section>

        )}

      </main>



      {/* ====================================
          FOOTER
      ==================================== */}

      <footer>

        Smart Resume Screener
        {" • "}
        AI-powered recruitment intelligence

      </footer>

    </div>

  );

}

export default App;