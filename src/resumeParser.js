/**
 * Resume Parser Module
 * Extracts structured content from user's PDF resume
 */

const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');

// Pre-parsed resume content (extracted from Keshav-Resume.pdf)
const RESUME_CONTENT = {
    name: "Keshav Kotteswaran",
    contact: {
        email: "kotteswaran.k@northeastern.edu",
        phone: "302-897-6913",
        linkedin: "www.linkedin.com/in/keshav-kotteswaran/"
    },
    education: [
        {
            degree: "M.S. in Bioengineering",
            school: "Northeastern University",
            location: "Boston, MA",
            gpa: "3.76/4.00",
            date: "December 2025",
            details: "Concentration in Biomedical Devices and Bioimaging · Nanomedicine Graduate Certificate"
        },
        {
            degree: "B.S. in Bioengineering",
            school: "Northeastern University",
            location: "Boston, MA",
            gpa: "3.56/4.00",
            date: "May 2024",
            details: "Concentration in Biomedical Devices and Bioimaging · Minor in Business Administration"
        }
    ],
    experience: [
        {
            title: "Project Manager",
            company: "Epic Systems",
            location: "Madison, WI",
            dates: "September 2024 - August 2025",
            bullets: [
                "Led the full-cycle regulatory implementation of biomedical device integration for Operating Rooms and Cath Labs, ensuring data integrity and strict adherence to HIPAA.",
                "Executed comprehensive validation testing for HL7 messaging protocols, achieving 100% data reliability for critical patient monitoring systems, directly supporting quality assurance objectives.",
                "Utilized statistical modeling to identify critical workflow bottlenecks, driving a 15% improvement in First Case On-Time Starts and standardizing new workflow designs for operational SOPs.",
                "Demoed client-facing product presentations to clinical stakeholders, facilitating consensus on design decisions and ensuring user acceptance aligned with regulatory standards."
            ]
        },
        {
            title: "Systems Engineering Design Verification Co-op",
            company: "Insulet Corporation",
            location: "Acton, MA",
            dates: "July 2023 - December 2023",
            bullets: [
                "Executed Design Verification and rigorous QA review system requirements of the Omnipod 5, tracing every test case back to essential quality standards including ISO 14971 risk controls and IEC 62304 software lifecycle standards.",
                "Spearheaded end-to-end Systems Integration Testing, specifically validating critical device-to-cloud telemetry and verifying the integrity of insulin delivery logs transmitted to the secure cloud backend, ensuring strict HIPAA compliance.",
                "Architected a Test Capacity Optimization framework that focused on high-risk features, resulting in a 30% reduction in regression testing cycle time while maintaining full regulatory coverage and audit readiness.",
                "Maintained detailed technical documentation (DHF records) and demonstrated proficiency in regulated environment controls, supporting internal quality management objectives."
            ]
        },
        {
            title: "Analytical Development Co-op",
            company: "Acorda Therapeutics",
            location: "Waltham, MA",
            dates: "July 2022 - December 2022",
            bullets: [
                "Ensured compliance by strictly following cGMP and GDP guidelines for all laboratory testing, including ACI-8 analysis on novel drug formulations in accordance with ISO 10993 biocompatibility standards.",
                "Optimized analytical assay throughput by transitioning testing methodologies from HPLC to UPLC, achieving a 9x reduction in run time while rigorously maintaining ICH Q2(R1) validation standards.",
                "Validated critical quality attributes (CQAs) of Spray-Dried Dispersions to ensure particle size distributions consistently met target requirements, achieving less than 5% standard deviation for optimal therapeutic effect.",
                "Drafted and reviewed internal Standard Operating Procedures (SOPs) detailing new testing methodologies and equipment operation, ensuring all documentation was accurate and controlled."
            ]
        }
    ],
    projects: [
        {
            title: "Capstone: Modifying NIH 3T3 Cells",
            organization: "Northeastern University",
            location: "Boston, MA",
            dates: "May 2023 - April 2024",
            bullets: [
                "Targeted wound healing efficiency by engineering NIH 3T3 fibroblasts to overexpress PDGFR-beta, utilizing a Lipofectamine LTX transfection protocol to drive cellular response.",
                "Designed a fluorescence-based chemotaxis assay (Boyden Chamber) seeded with 50,000 cells per well, creating a standard curve to rigorously quantify migration limits against wild-type controls.",
                "Validated a 25% increase in invasion velocity toward serum chemoattractants in the modified phenotype using EVOS microscopy, demonstrating the potential for accelerated tissue repair applications."
            ]
        }
    ],
    skills: {
        regulatory: [
            "FDA 21 CFR Part 11/820",
            "ISO 13485 (Medical Devices)",
            "IEC 62304",
            "cGMP/GDP",
            "IQ/OQ/PQ Validation",
            "HIPAA",
            "Agile",
            "Waterfall",
            "Root Cause Analysis (Fishbone/5 Whys)",
            "Risk Management (ISO 14971)"
        ],
        software: [
            "Epic (OpTime/Anesthesia)",
            "Visio",
            "AWS (Lambda, S3)",
            "Python",
            "SQL",
            "Tableau",
            "MATLAB",
            "SolidWorks"
        ]
    }
};

/**
 * Get the parsed resume data
 */
function getResumeData() {
    return RESUME_CONTENT;
}

/**
 * Get formatted resume text for Claude context
 */
function getResumeText() {
    const resume = RESUME_CONTENT;
    let text = `# ${resume.name}\n`;
    text += `${resume.contact.email} | ${resume.contact.phone} | ${resume.contact.linkedin}\n\n`;
    
    text += `## Education\n`;
    for (const edu of resume.education) {
        text += `**${edu.degree}** | ${edu.school} | ${edu.location} | GPA: ${edu.gpa} | ${edu.date}\n`;
        text += `${edu.details}\n\n`;
    }
    
    text += `## Experience\n`;
    for (const exp of resume.experience) {
        text += `**${exp.title}** | ${exp.company} | ${exp.location} | ${exp.dates}\n`;
        for (const bullet of exp.bullets) {
            text += `- ${bullet}\n`;
        }
        text += `\n`;
    }
    
    text += `## Projects\n`;
    for (const proj of resume.projects) {
        text += `**${proj.title}** | ${proj.organization} | ${proj.location} | ${proj.dates}\n`;
        for (const bullet of proj.bullets) {
            text += `- ${bullet}\n`;
        }
        text += `\n`;
    }
    
    text += `## Skills\n`;
    text += `**Regulatory:** ${resume.skills.regulatory.join(', ')}\n`;
    text += `**Software:** ${resume.skills.software.join(', ')}\n`;
    
    return text;
}

/**
 * Parse a PDF resume file (for future uploads)
 */
async function parseResumePDF(filePath) {
    try {
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdfParse(dataBuffer);
        return data.text;
    } catch (error) {
        console.error('Error parsing PDF:', error);
        throw error;
    }
}

module.exports = {
    getResumeData,
    getResumeText,
    parseResumePDF,
    RESUME_CONTENT
};
