/**
 * Document Generator Module
 * Creates professional DOCX files from generated content
 */

const {
    Document,
    Paragraph,
    TextRun,
    HeadingLevel,
    AlignmentType,
    BorderStyle,
    Packer
} = require('docx');

/**
 * Generate a cover letter DOCX document
 */
async function generateCoverLetterDocx(coverLetterText, candidateName, roleTitle, companyName) {
    const today = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const paragraphs = coverLetterText.split('\n\n').filter(p => p.trim());

    const doc = new Document({
        sections: [{
            properties: {},
            children: [
                // Header with candidate name
                new Paragraph({
                    children: [
                        new TextRun({
                            text: candidateName,
                            bold: true,
                            size: 28,
                            font: 'Calibri'
                        })
                    ],
                    alignment: AlignmentType.LEFT,
                    spacing: { after: 100 }
                }),

                // Date
                new Paragraph({
                    children: [
                        new TextRun({
                            text: today,
                            size: 22,
                            font: 'Calibri'
                        })
                    ],
                    spacing: { after: 400 }
                }),

                // Greeting
                new Paragraph({
                    children: [
                        new TextRun({
                            text: 'Dear Hiring Manager,',
                            size: 22,
                            font: 'Calibri'
                        })
                    ],
                    spacing: { after: 200 }
                }),

                // Cover letter paragraphs
                ...paragraphs.map(paragraph =>
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: paragraph.trim(),
                                size: 22,
                                font: 'Calibri'
                            })
                        ],
                        spacing: { after: 200 },
                        alignment: AlignmentType.JUSTIFIED
                    })
                ),

                // Closing
                new Paragraph({
                    children: [
                        new TextRun({
                            text: 'Sincerely,',
                            size: 22,
                            font: 'Calibri'
                        })
                    ],
                    spacing: { before: 200, after: 100 }
                }),

                new Paragraph({
                    children: [
                        new TextRun({
                            text: candidateName,
                            size: 22,
                            font: 'Calibri'
                        })
                    ]
                })
            ]
        }]
    });

    return await Packer.toBuffer(doc);
}

/**
 * Generate a resume bullets DOCX document
 */
async function generateBulletsDocx(bulletsText, roleTitle, companyName) {
    // Parse bullets from text
    const bulletLines = bulletsText
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.startsWith('•') || line.startsWith('-') || line.startsWith('*'))
        .map(line => line.replace(/^[•\-*]\s*/, ''));

    const doc = new Document({
        sections: [{
            properties: {},
            children: [
                // Title
                new Paragraph({
                    children: [
                        new TextRun({
                            text: 'ATS-Optimized Resume Bullet Points',
                            bold: true,
                            size: 28,
                            font: 'Calibri'
                        })
                    ],
                    spacing: { after: 100 }
                }),

                // Subtitle
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `Tailored for: ${roleTitle || 'Target Role'}${companyName ? ' at ' + companyName : ''}`,
                            italics: true,
                            size: 22,
                            font: 'Calibri',
                            color: '666666'
                        })
                    ],
                    spacing: { after: 300 }
                }),

                // Bullets
                ...bulletLines.map(bullet =>
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: '• ' + bullet,
                                size: 22,
                                font: 'Calibri'
                            })
                        ],
                        spacing: { after: 120 }
                    })
                ),

                // Instructions
                new Paragraph({
                    children: [
                        new TextRun({
                            text: '\n\nInstructions: ',
                            bold: true,
                            size: 20,
                            font: 'Calibri'
                        }),
                        new TextRun({
                            text: 'Replace or supplement your existing resume bullet points with these tailored versions. Prioritize bullets that most closely match the job requirements.',
                            size: 20,
                            font: 'Calibri',
                            color: '666666'
                        })
                    ],
                    spacing: { before: 400 }
                })
            ]
        }]
    });

    return await Packer.toBuffer(doc);
}

module.exports = {
    generateCoverLetterDocx,
    generateBulletsDocx
};
