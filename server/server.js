const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { PDFParse } = require("pdf-parse");
const mammoth = require("mammoth");
const { GoogleGenAI } = require("@google/genai");

require("dotenv").config();

const connectDB = require("./config/db");
const Resume = require("./models/Resume");

const app = express();


// ========================================
// MIDDLEWARE
// ========================================

app.use(cors());
app.use(express.json());


// ========================================
// FILE UPLOAD
// ========================================

const upload = multer({
    storage: multer.memoryStorage(),

    limits: {
        fileSize: 5 * 1024 * 1024
    }
});


// ========================================
// GEMINI
// ========================================

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});


// ========================================
// HOME ROUTE
// ========================================

app.get("/", (req, res) => {

    res.json({
        message: "Smart Resume Screener Backend is Running!",
        ai: "Gemini",
        database: "MongoDB"
    });

});


// ========================================
// EXTRACT TEXT FROM RESUME
// ========================================

async function extractResumeText(file) {

    const fileName = file.originalname.toLowerCase();


    // -----------------------------
    // PDF
    // -----------------------------

    if (fileName.endsWith(".pdf")) {

        const parser = new PDFParse({
            data: file.buffer
        });

        const result = await parser.getText();

        await parser.destroy();

        return result.text;
    }


    // -----------------------------
    // DOCX
    // -----------------------------

    if (fileName.endsWith(".docx")) {

        const result = await mammoth.extractRawText({
            buffer: file.buffer
        });

        return result.value;
    }


    throw new Error(
        "Unsupported file type. Please upload a PDF or DOCX file."
    );
}


// ========================================
// RESUME EXTRACTION PROMPT
// ========================================

function createResumeExtractionPrompt(resumeText) {

    return `
You are an expert resume parsing system.

Your task is to extract structured information
from the resume below.

IMPORTANT RULES:

1. Extract ONLY information present in the resume.
2. Do NOT invent or assume information.
3. If information is missing, use an empty string
   or empty array.
4. Return ONLY valid JSON.
5. Do not use markdown.
6. Do not add explanations outside the JSON.

Return exactly this structure:

{
  "candidate": {
    "name": "",
    "email": "",
    "phone": ""
  },

  "education": [
    {
      "degree": "",
      "institution": "",
      "year": ""
    }
  ],

  "experience": [
    {
      "company": "",
      "role": "",
      "duration": "",
      "description": ""
    }
  ],

  "skills": [],

  "projects": [
    {
      "name": "",
      "description": "",
      "technologies": []
    }
  ],

  "certifications": []
}

RESUME:

${resumeText}
`;
}


// ========================================
// UPLOAD + EXTRACT + SAVE RESUME
// ========================================

app.post(
    "/api/screen-resume",
    upload.single("resume"),
    async (req, res) => {

        try {

            // -----------------------------
            // Check file
            // -----------------------------

            if (!req.file) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Please upload a PDF or DOCX resume."

                });

            }


            console.log("--------------------------------");
            console.log("Resume received:");
            console.log(req.file.originalname);
            console.log("--------------------------------");


            // -----------------------------
            // Extract text
            // -----------------------------

            const resumeText =
                await extractResumeText(req.file);


            console.log(
                "Extracted characters:",
                resumeText.length
            );


            if (!resumeText.trim()) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Could not extract text from this resume."

                });

            }


            // -----------------------------
            // Create prompt
            // -----------------------------

            const prompt =
                createResumeExtractionPrompt(
                    resumeText
                );


            console.log(
                "Sending resume to Gemini..."
            );


            // -----------------------------
            // Gemini
            // -----------------------------

            const response =
                await ai.models.generateContent({

                    model: "gemini-3.6-flash",

                    contents: prompt

                });


            let text = response.text;


            console.log(
                "Gemini response received."
            );


            // -----------------------------
            // Clean response
            // -----------------------------

            text = text
                .replace(/```json/gi, "")
                .replace(/```/g, "")
                .trim();


            // -----------------------------
            // Convert to JSON
            // -----------------------------

            const structuredResume =
                JSON.parse(text);


            console.log(
                "Resume successfully structured."
            );


            // -----------------------------
            // Save to MongoDB
            // -----------------------------

            const savedResume =
                await Resume.create({

                    candidate:
                        structuredResume.candidate,

                    education:
                        structuredResume.education,

                    experience:
                        structuredResume.experience,

                    skills:
                        structuredResume.skills,

                    projects:
                        structuredResume.projects,

                    certifications:
                        structuredResume.certifications,

                    originalFileName:
                        req.file.originalname,

                    resumeText:
                        resumeText

                });


            console.log(
                "Resume saved to MongoDB."
            );


            // -----------------------------
            // Send result
            // -----------------------------

            res.json({

                success: true,

                message:
                    "Resume successfully processed.",

                resumeId:
                    savedResume._id,

                resume:
                    structuredResume

            });


        } catch (error) {

            console.error(
                "Resume processing error:"
            );

            console.error(error);


            res.status(500).json({

                success: false,

                message:
                    "Failed to process resume.",

                error:
                    error.message

            });

        }

    }
);


// ========================================
// START SERVER
// ========================================

// ========================================
// JOB MATCHING PROMPT
// ========================================

function createJobMatchingPrompt(resume, jobDescription) {

    return `
You are an expert technical recruiter and AI resume screening system.

Compare the candidate profile with the job description.

Evaluate the candidate based on:

1. Technical skills
2. Required skills
3. Relevant experience
4. Projects
5. Education
6. Overall relevance

IMPORTANT RULES:

- Evaluate semantic similarity, not only exact keyword matches.
- Do not invent candidate experience.
- Only use information present in the candidate profile.
- A missing skill should only be marked missing if it is relevant to the job.
- Give an honest and explainable score.
- Return ONLY valid JSON.
- Do not use markdown.
- Do not add explanations outside the JSON.

Use a score from 1 to 10.

Shortlist rules:

8.0 - 10.0  -> shortlisted = true
6.0 - 7.9   -> shortlisted = false
Below 6.0   -> shortlisted = false

Return exactly this structure:

{
  "matchScore": 0,

  "matchedSkills": [],

  "missingSkills": [],

  "relevantExperience": [],

  "relevantProjects": [],

  "strengths": [],

  "weaknesses": [],

  "justification": "",

  "shortlisted": false
}

CANDIDATE PROFILE:

${JSON.stringify(resume, null, 2)}


JOB DESCRIPTION:

${jobDescription}
`;
}


// ========================================
// JOB MATCHING API
// ========================================

app.post(
    "/api/match-resume",
    async (req, res) => {

        try {

            const {
                resumeId,
                jobDescription
            } = req.body;


            // -----------------------------
            // Validate input
            // -----------------------------

            if (!resumeId) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Resume ID is required."

                });

            }


            if (
                !jobDescription ||
                !jobDescription.trim()
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Job description is required."

                });

            }


            // -----------------------------
            // Find resume
            // -----------------------------

            const resume =
                await Resume.findById(
                    resumeId
                );


            if (!resume) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Resume not found."

                });

            }


            console.log("--------------------------------");
            console.log("Starting job matching...");
            console.log("--------------------------------");


            // -----------------------------
            // Create matching prompt
            // -----------------------------

            const prompt =
                createJobMatchingPrompt(
                    {
                        candidate:
                            resume.candidate,

                        education:
                            resume.education,

                        experience:
                            resume.experience,

                        skills:
                            resume.skills,

                        projects:
                            resume.projects,

                        certifications:
                            resume.certifications
                    },

                    jobDescription
                );


            // -----------------------------
            // Gemini
            // -----------------------------

            const response =
                await ai.models.generateContent({

                    model: "gemini-3.6-flash",

                    contents: prompt

                });


            let text =
                response.text;


            console.log(
                "Gemini matching response received."
            );


            // -----------------------------
            // Clean JSON
            // -----------------------------

            text = text
                .replace(/```json/gi, "")
                .replace(/```/g, "")
                .trim();


            // -----------------------------
            // Parse JSON
            // -----------------------------

            const matchResult =
                JSON.parse(text);


            // -----------------------------
            // Save matching result
            // -----------------------------

            resume.jobDescription =
                jobDescription;


            resume.matchResult =
                matchResult;


            await resume.save();


            console.log(
                "Matching result saved to MongoDB."
            );


            // -----------------------------
            // Send response
            // -----------------------------

            res.json({

                success: true,

                resumeId:
                    resume._id,

                matchResult:
                    matchResult

            });


        } catch (error) {

            console.error(
                "Job matching error:"
            );

            console.error(error);


            res.status(500).json({

                success: false,

                message:
                    "Failed to match resume with job description.",

                error:
                    error.message

            });

        }

    }
);
const PORT =
    process.env.PORT || 5000;


const startServer = async () => {

    try {

        await connectDB();


        app.listen(PORT, () => {

            console.log("--------------------------------");
            console.log("SMART RESUME SCREENER");
            console.log("--------------------------------");

            console.log(
                `Server running on port ${PORT}`
            );

            console.log(
                "AI Engine: Gemini"
            );

            console.log(
                "Resume formats: PDF, DOCX"
            );

            console.log(
                "Database: MongoDB"
            );

            console.log("--------------------------------");

        });

    } catch (error) {

        console.error(
            "Server startup failed:"
        );

        console.error(error.message);

    }

};


startServer();