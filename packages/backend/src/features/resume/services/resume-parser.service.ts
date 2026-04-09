/**
 * Resume Parser Service
 * Extracts text from resume files and converts to Markdown.
 *
 * PDF:  pdf-parse (v2.x) — text, tables, hyperlinks extraction
 * DOCX: mammoth → HTML → turndown → Markdown (preserves tables, lists, headings)
 * TXT/MD: passthrough
 */

import { Injectable, Logger } from '@nestjs/common';
import * as mammoth from 'mammoth';
import { PDFParse } from 'pdf-parse';
import TurndownService from 'turndown';

export interface ResumeParseResult {
  markdown: string;
  rawText: string;
  fileType: string;
  pageCount?: number;
  isScanned?: boolean;
}

@Injectable()
export class ResumeParserService {
  private readonly logger = new Logger(ResumeParserService.name);
  private readonly turndown: TurndownService;

  constructor() {
    this.turndown = new TurndownService({
      headingStyle: 'atx',
      bulletListMarker: '-',
      codeBlockStyle: 'fenced',
    });

    // Preserve table structure
    this.turndown.addRule('table', {
      filter: ['table'],
      replacement(_content: string, node: any) {
        const rows = node.querySelectorAll('tr');
        if (!rows.length) return '';

        const lines: string[] = [];
        const colCount = rows[0].querySelectorAll('td, th').length;

        for (let i = 0; i < rows.length; i++) {
          const cells = rows[i].querySelectorAll('td, th');
          const line = Array.from(cells)
            .map((cell: any) => cell.textContent.trim())
            .join(' | ');
          lines.push(`| ${line} |`);

          // Add header separator after first row
          if (i === 0) {
            lines.push('| ' + Array(colCount).fill('---').join(' | ') + ' |');
          }
        }

        return '\n\n' + lines.join('\n') + '\n\n';
      },
    });
  }

  /**
   * Parse a resume file buffer to Markdown
   */
  async parseFile(
    fileBuffer: Buffer,
    fileType: string,
  ): Promise<ResumeParseResult> {
    const type = fileType.toLowerCase();
    this.logger.log(`Parsing resume file (${type}, ${fileBuffer.length} bytes)`);

    let rawText = '';
    let markdown = '';
    let pageCount: number | undefined;
    let isScanned = false;

    switch (type) {
      case 'pdf':
        ({ rawText, markdown, pageCount, isScanned } = await this.parsePDF(fileBuffer));
        break;
      case 'docx':
        ({ rawText, markdown } = await this.parseDOCX(fileBuffer));
        break;
      case 'txt':
      case 'md':
      case 'markdown':
        rawText = fileBuffer.toString('utf-8');
        markdown = rawText;
        break;
      default:
        throw new Error(`Unsupported file type: ${fileType}`);
    }

    if (!rawText || rawText.trim().length === 0) {
      this.logger.warn(`Extracted text is empty for ${type} file`);
    }

    return { markdown, rawText, fileType: type, pageCount, isScanned };
  }

  /**
   * Extract raw text only (backward compatible with AIEngine.extractTextFromFile)
   */
  async extractText(fileBuffer: Buffer, fileType: string): Promise<string> {
    const result = await this.parseFile(fileBuffer, fileType);
    return result.rawText;
  }

  // ─── PDF Parsing ───────────────────────────────────────────────

  /**
   * Parse PDF using pdf-parse (v2.x)
   * Supports text, tables, and hyperlinks extraction
   */
  private async parsePDF(fileBuffer: Buffer): Promise<{
    rawText: string;
    markdown: string;
    pageCount: number;
    isScanned: boolean;
  }> {
    const pdfParser = new PDFParse({ data: new Uint8Array(fileBuffer) });
    try {
      const [textResult, tableResult] = await Promise.all([
        pdfParser.getText({
          lineEnforce: true,
          parseHyperlinks: true,
        }),
        pdfParser.getTable().catch(() => null),
      ]);

      const rawText = textResult.text || '';
      const pageCount = textResult.total || 1;

      // Build Markdown from text and tables
      let markdown = '';

      if (tableResult && tableResult.mergedTables?.length > 0) {
        markdown = this.buildMarkdownWithTables(textResult, tableResult.mergedTables);
      } else {
        markdown = this.rawTextToMarkdown(rawText);
      }

      const avgCharsPerPage = rawText.length / pageCount;
      const isScanned = avgCharsPerPage < 50 && pageCount > 0;

      if (isScanned) {
        this.logger.warn(
          `PDF may be scanned/image-based (avg ${avgCharsPerPage.toFixed(0)} chars/page). Text extraction may be incomplete.`,
        );
      }

      return { rawText, markdown, pageCount, isScanned };
    } catch (error) {
      this.logger.error('Error parsing PDF with pdf-parse:', error);
      throw new Error('Failed to parse PDF file');
    } finally {
      await pdfParser.destroy().catch(() => {});
    }
  }

  /**
   * Convert raw extracted PDF text to basic Markdown structure.
   * Uses heuristic rules: short lines with no punctuation → heading,
   * lines starting with bullet markers → list items.
   */
  private rawTextToMarkdown(text: string): string {
    const lines = text.split(/\n/);
    const mdLines: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) {
        mdLines.push('');
        continue;
      }

      // Detect bullet list items
      if (/^[•●▪–—]\s/.test(trimmed)) {
        mdLines.push(`- ${trimmed.replace(/^[•●▪–—]\s*/, '')}`);
        continue;
      }

      // Detect numbered list items
      if (/^\d+[.)]\s/.test(trimmed)) {
        mdLines.push(trimmed);
        continue;
      }

      // Heuristic: short line (≤60 chars) without trailing punctuation → likely a heading
      if (trimmed.length <= 60 && !/[.,;:!?\-—]$/.test(trimmed)) {
        // Check if it looks like a section heading (title-case or all-caps)
        const isTitleCase = /^(?:[A-Z][a-z]+\s*){1,5}$/.test(trimmed);
        const isAllCaps = /^[A-Z\s\d]+$/.test(trimmed);
        const hasCJKHeading = /[\u4e00-\u9fff]{2,8}$/.test(trimmed);

        if (isTitleCase || isAllCaps || hasCJKHeading) {
          mdLines.push(`## ${trimmed}`);
          continue;
        }
      }

      mdLines.push(trimmed);
    }

    // Collapse multiple blank lines into one
    return mdLines.join('\n').replace(/\n{3,}/g, '\n\n');
  }

  /**
   * Build Markdown with tables appended after the full text
   * (mergedTables from pdf-parse is not page-aligned, so we append all tables at the end)
   */
  private buildMarkdownWithTables(
    textResult: { pages: Array<{ num: number; text: string }>; text: string },
    mergedTables: string[][][],
  ): string {
    const parts: string[] = [];

    // Add all page text
    for (const page of textResult.pages || []) {
      parts.push(this.rawTextToMarkdown(page.text || ''));
    }

    // Append all detected tables
    for (const table of mergedTables) {
      parts.push(this.tableToMarkdown(table));
    }

    return parts.join('\n\n---\n\n');
  }

  /**
   * Convert a 2D string array (table) to Markdown table syntax
   */
  private tableToMarkdown(table: string[][]): string {
    if (!table || table.length === 0) return '';
    const lines: string[] = [];
    const colCount = table[0]?.length || 0;

    for (let i = 0; i < table.length; i++) {
      const row = table[i];
      while (row.length < colCount) row.push('');
      const line = row.map((cell) => cell.trim().replace(/\|/g, '\\|')).join(' | ');
      lines.push(`| ${line} |`);

      if (i === 0) {
        lines.push('| ' + Array(colCount).fill('---').join(' | ') + ' |');
      }
    }

    return '\n\n' + lines.join('\n') + '\n\n';
  }

  // ─── DOCX Parsing ─────────────────────────────────────────────

  /**
   * Parse DOCX using mammoth → HTML → Turndown → Markdown
   * Preserves headings, lists, tables, and bold/italic formatting
   */
  private async parseDOCX(fileBuffer: Buffer): Promise<{
    rawText: string;
    markdown: string;
  }> {
    try {
      // Get HTML (preserves structure) and raw text (for search/indexing)
      const [htmlResult, textResult] = await Promise.all([
        mammoth.convertToHtml({ buffer: fileBuffer }),
        mammoth.extractRawText({ buffer: fileBuffer }),
      ]);

      if (htmlResult.messages?.length) {
        this.logger.debug(
          `Mammoth HTML conversion warnings: ${htmlResult.messages.length}`,
        );
      }

      const markdown = this.turndown.turndown(htmlResult.value);
      const rawText = textResult.value;

      return { rawText, markdown };
    } catch (error) {
      this.logger.error('Error parsing DOCX:', error);
      throw new Error('Failed to parse DOCX file');
    }
  }
}
