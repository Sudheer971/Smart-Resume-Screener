const mongoose = require("mongoose");

const ResumeSchema = new mongoose.Schema(
  {
    candidate: {
      name: {
        type: String,
        default: ""
      },

      email: {
        type: String,
        default: ""
      },

      phone: {
        type: String,
        default: ""
      }
    },

    education: [
      {
        degree: {
          type: String,
          default: ""
        },

        institution: {
          type: String,
          default: ""
        },

        year: {
          type: String,
          default: ""
        }
      }
    ],

    experience: [
      {
        company: {
          type: String,
          default: ""
        },

        role: {
          type: String,
          default: ""
        },

        duration: {
          type: String,
          default: ""
        },

        description: {
          type: String,
          default: ""
        }
      }
    ],

    skills: [
      {
        type: String
      }
    ],

    projects: [
      {
        name: {
          type: String,
          default: ""
        },

        description: {
          type: String,
          default: ""
        },

        technologies: [
          {
            type: String
          }
        ]
      }
    ],

    certifications: [
      {
        type: String
      }
    ],

    originalFileName: {
      type: String,
      default: ""
    },

    resumeText: {
      type: String,
      default: ""
    },

    jobDescription: {
      type: String,
      default: ""
    },

    matchResult: {
      matchScore: {
        type: Number,
        default: 0
      },

      matchedSkills: [
        {
          type: String
        }
      ],

      missingSkills: [
        {
          type: String
        }
      ],

      strengths: [
        {
          type: String
        }
      ],

      weaknesses: [
        {
          type: String
        }
      ],

      relevantExperience: [
        {
          type: String
        }
      ],

      relevantProjects: [
        {
          type: String
        }
      ],

      justification: {
        type: String,
        default: ""
      },

      shortlisted: {
        type: Boolean,
        default: false
      }
    }
  },

  {
    timestamps: true
  }
);

module.exports = mongoose.model(
  "Resume",
  ResumeSchema
);