import axios from '../config/axios';
import type {
  Template,
  PDFOptions,
  GeneratedPDF,
} from '../stores/generateStore';

/**
 * Service for generating resume PDFs from optimized content
 */
export const generateService = {
  /**
   * List all available PDF templates
   * @returns List of templates
   */
  async listTemplates(): Promise<Template[]> {
    const response = await axios.get<Template[]>('/templates');
    return response.data;
  },

  /**
   * Get details of a specific PDF template
   * @param templateId - The ID of the template
   * @returns Template details
   */
  async getTemplate(templateId: string): Promise<Template> {
    const response = await axios.get<Template>(`/templates/${templateId}`);
    return response.data;
  },

  /**
   * Generate a preview of the resume PDF
   * @param optimizationId - The ID of the optimization record
   * @param templateId - The ID of the template to use
   * @param options - PDF generation options (colors, fonts, etc.)
   * @returns URL to the generated preview blob
   */
  async previewPDF(
    optimizationId: string,
    templateId: string,
    options: PDFOptions
  ): Promise<string> {
    const response = await axios.post(
      '/generate/preview',
      {
        optimizationId,
        templateId,
        options,
      },
      {
        responseType: 'blob',
      }
    );
    return URL.createObjectURL(response.data);
  },

  /**
   * Generate the final resume PDF and save it
   * @param optimizationId - The ID of the optimization record
   * @param templateId - The ID of the template to use
   * @param options - PDF generation options
   * @returns Details of the generated PDF record
   */
  async generatePDF(
    optimizationId: string,
    templateId: string,
    options: PDFOptions
  ): Promise<GeneratedPDF> {
    const response = await axios.post<GeneratedPDF>('/generate/pdf', {
      optimizationId,
      templateId,
      options,
    });
    return response.data;
  },

  /**
   * Generate PDF from Markdown content
   * @param markdown - The markdown content to convert to PDF
   * @param options - PDF generation options (fontSize, margin)
   * @returns Details of the generated PDF with download URL
   */
  async generatePDFFromMarkdown(
    markdown: string,
    options?: {
      fontSize?: number;
      margin?: { top: number; bottom: number; left: number; right: number };
    }
  ): Promise<{
    fileId: string;
    filePath: string;
    expiresAt: string;
    downloadUrl: string;
  }> {
    const response = await axios.post('/generate/pdf/from-markdown', {
      markdown,
      options,
    });
    return response.data;
  },

  /**
   * Download a generated PDF file
   * @param fileUrl - The URL of the PDF file
   * @param filename - The name to save the file as
   */
  async downloadPDF(fileUrl: string, filename: string): Promise<void> {
    const response = await axios.get(fileUrl, {
      responseType: 'blob',
    });
    const url = URL.createObjectURL(response.data);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },
};
