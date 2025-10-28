const OpenAI = require('openai');
const fs = require('fs').promises;
const path = require('path');
const pdf = require('pdf-parse');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const rulesEngine = require('./rulesEngine');

/**
 * Extract data from a document using OpenAI's GPT-4 Vision API
 * @param {string} filePath - Path to the PDF file
 * @param {string} documentType - Type of document (e.g., 'drivers-license', 'bank-statement')
 * @returns {Promise<Object>} Extracted data
 */
async function extractDocumentData(filePath, documentType) {
  try {
    console.log(`📄 Extracting data from ${documentType} at ${filePath}`);

    // Get the extraction rules for this document type
    const rules = await rulesEngine.getRules();
    const docTypeConfig = rules.documentTypes.find(dt => dt.id === documentType);

    if (!docTypeConfig) {
      throw new Error(`Unknown document type: ${documentType}`);
    }

    // Read the PDF file
    const dataBuffer = await fs.readFile(filePath);
    const pdfData = await pdf(dataBuffer);
    const pdfText = pdfData.text;

    // Build the extraction prompt based on rules
    const extractionPrompt = buildExtractionPrompt(docTypeConfig, pdfText);

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a mortgage document processing expert. Extract structured data from documents accurately and return it in JSON format. If a field cannot be found, use null."
        },
        {
          role: "user",
          content: extractionPrompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.1
    });

    const extractedData = JSON.parse(response.choices[0].message.content);

    console.log(`✅ Successfully extracted data from ${documentType}`);

    return {
      documentType,
      extractedAt: new Date().toISOString(),
      confidence: calculateConfidence(extractedData, docTypeConfig),
      data: extractedData
    };

  } catch (error) {
    console.error(`❌ Error extracting document data:`, error);
    throw error;
  }
}

/**
 * Build extraction prompt from document type configuration
 * @param {Object} docTypeConfig - Document type configuration from rules
 * @param {string} documentText - Extracted text from PDF
 * @returns {string} Prompt for OpenAI
 */
function buildExtractionPrompt(docTypeConfig, documentText) {
  const fields = docTypeConfig.extractionRules.fields;

  let prompt = `Extract the following information from this ${docTypeConfig.name} document:\n\n`;
  prompt += `DOCUMENT TEXT:\n${documentText}\n\n`;
  prompt += `FIELDS TO EXTRACT:\n`;

  fields.forEach(field => {
    prompt += `- ${field.name} (${field.dataType}): ${field.description}${field.required ? ' [REQUIRED]' : ''}\n`;
  });

  prompt += `\n${docTypeConfig.aiPrompt}\n\n`;
  prompt += `Return the data in JSON format with the following structure:\n{\n`;

  fields.forEach((field, index) => {
    const comma = index < fields.length - 1 ? ',' : '';
    prompt += `  "${field.name}": <extracted_value>${comma}\n`;
  });

  prompt += `}\n\n`;
  prompt += `IMPORTANT:\n`;
  prompt += `- Use null for any fields that cannot be found\n`;
  prompt += `- For date fields, use YYYY-MM-DD format\n`;
  prompt += `- For currency fields, use numeric values without $ or commas\n`;
  prompt += `- For boolean fields, use true or false\n`;
  prompt += `- Be precise and accurate\n`;

  return prompt;
}

/**
 * Calculate confidence score for extracted data
 * @param {Object} extractedData - Extracted data
 * @param {Object} docTypeConfig - Document type configuration
 * @returns {number} Confidence score (0-100)
 */
function calculateConfidence(extractedData, docTypeConfig) {
  const requiredFields = docTypeConfig.extractionRules.fields.filter(f => f.required);
  const totalRequired = requiredFields.length;
  let foundRequired = 0;

  requiredFields.forEach(field => {
    if (extractedData[field.name] !== null && extractedData[field.name] !== undefined) {
      foundRequired++;
    }
  });

  return Math.round((foundRequired / totalRequired) * 100);
}

/**
 * Extract data from multiple documents in batch
 * @param {Array} documents - Array of {filePath, documentType}
 * @returns {Promise<Array>} Array of extracted data
 */
async function extractMultipleDocuments(documents) {
  const results = [];

  for (const doc of documents) {
    try {
      const result = await extractDocumentData(doc.filePath, doc.documentType);
      results.push({
        success: true,
        ...result
      });
    } catch (error) {
      results.push({
        success: false,
        documentType: doc.documentType,
        filePath: doc.filePath,
        error: error.message
      });
    }
  }

  return results;
}

module.exports = {
  extractDocumentData,
  extractMultipleDocuments
};
