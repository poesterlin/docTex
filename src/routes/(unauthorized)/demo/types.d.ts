// Basic interface for CSL JSON items (expand as needed)
interface CslJsonAuthor {
	family: string;
	given: string;
}

interface CslJsonDate {
	'date-parts': Array<Array<string | number>>;
}

interface CslJsonItem {
    id: string;
    type: string; // e.g., 'article-journal', 'book', 'chapter'
    title?: string;
    author?: CslJsonAuthor[];
    editor?: CslJsonAuthor[];
    issued?: CslJsonDate;
    'container-title'?: string; // Journal or book title
    volume?: string | number;
    issue?: string | number;
    page?: string;
    DOI?: string;
    URL?: string;
    publisher?: string;
    'publisher-place'?: string;
    // Add other common CSL JSON fields as needed
    [key: string]: any; // Allow other properties
  }

// Type for the citeproc sys object
interface CiteprocSys {
	retrieveLocale(lang: string): string;
	retrieveItem(id: string): CslJsonItem | undefined;
}

// Type for the result of makeBibliography
type BibliographyResult = [any, string[]]; // [metadata, formattedStrings]

declare module 'citeproc' {
	export class Engine {
		constructor(sys: CiteprocSys, styleXml: string, locale?: string, forceLang?: string);
		updateItems(ids: string[]): void;
		makeBibliography(): BibliographyResult;
		// Declare other methods if you use them, e.g.:
		// processCitationCluster(...)
	}
	// Declare other exports if needed
}

// src/types/citation-js.d.ts (or add to src/app.d.ts)

// --- Basic CSL JSON Item Structure ---
// (Define or import your CslJsonItem interface)
// This should match the expected output structure.
interface CslJsonAuthor {
  family?: string;
  given?: string;
  literal?: string; // For corporate authors etc.
  // Add other potential CSL author fields if needed
}

interface CslJsonDate {
  'date-parts'?: Array<Array<string | number>>;
  literal?: string; // For approximate dates etc.
  // Add other potential CSL date fields if needed
}



// --- citation-js Specific Types ---

/**
 * Options for the Cite constructor.
 */
interface CiteConstructorOptions {
  /** Force the input type, e.g., '@bibtex/text', '@csl/object' */
  forceType?: string;
  /** Set the maximum number of chained entries */
  maxChainLength?: number;
  /** Generate a parsing graph (for debugging) */
  generateGraph?: boolean;
  // Add other constructor options if known/needed
}

/**
 * Options for the format method.
 */
interface CiteFormatOptions {
  /** Output format type, e.g., 'string', 'html', 'object' */
  format?: 'string' | 'html' | 'object';
  /** Template/style for formatting, e.g., 'apa', 'chicago-fullnote-bibliography' */
  template?: string; // Alias for style
  /** Style for formatting, e.g., 'apa', 'chicago-fullnote-bibliography' */
  style?: string;
  /** Language/locale, e.g., 'en-US' */
  lang?: string;
  // Add other format options if known/needed
}

declare module 'citation-js' {
  
    /**
     * Represents a collection of citations.
     */
    export class Cite {
      /**
       * Create a new Cite instance.
       * @param data Input data (e.g., BibTeX string, CSL JSON object/array, DOI, URL).
       * @param options Configuration options for parsing.
       */
      constructor(data: any, options?: CiteConstructorOptions);
  
      /**
       * Format the citation data.
       *
       * @param format The desired output format name.
       *        - 'data': Outputs CSL JSON. Use options.format 'object' for JS objects/array.
       *        - 'bibtex': Outputs BibTeX string.
       *        - 'html': Outputs HTML bibliography/citation.
       *        - 'text': Outputs plain text bibliography/citation.
       *        - 'ris': Outputs RIS string.
       *        - ... and others.
       * @param options Configuration options for formatting.
       * @returns The formatted output. Type depends on format and options.
       *          Returns `CslJsonItem[]` for `format('data', { format: 'object' })`.
       *          Returns `string` for most other formats or if options.format is 'string'/'html'.
       */
      format(
        format: 'data',
        options: CiteFormatOptions & { format: 'object' },
      ): CslJsonItem[];
      format(format: string, options?: CiteFormatOptions): string;
      // Add more specific overloads if needed for other format combinations
  
      // Declare other methods of Cite if you use them, e.g.:
      // add(data: any, options?: CiteConstructorOptions): void;
      // options(options: CiteFormatOptions): void;
      // get(options?: any): any[]; // Gets the internal data representation
    }
  
    // Declare other potential exports from 'citation-js' if needed
    // export const plugins: any;
    // export const util: any;
  }
  