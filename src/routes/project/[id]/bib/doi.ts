export interface DoiResponse {
	indexed: Indexed;
	'reference-count': number;
	publisher: string;
	issue: string;
	license: License[];
	'content-domain': ContentDomain;
	'published-print': PublishedPrint;
	DOI: string;
	type: string;
	created: Created;
	page: string;
	source: string;
	'is-referenced-by-count': number;
	title: string;
	prefix: string;
	volume: string;
	author: Author[];
	member: string;
	reference: Reference[];
	'container-title': string;
	'original-title': any[];
	language: string;
	link: Link[];
	deposited: Deposited;
	score: number;
	resource: Resource;
	subtitle: any[];
	'short-title': any[];
	issued: Issued;
	'references-count': number;
	'journal-issue': JournalIssue;
	'alternative-id': string[];
	URL: string;
	relation: Relation;
	ISSN: string[];
	subject: any[];
	'container-title-short': string;
	published: Published;
}

export interface Indexed {
	'date-parts': number[][];
	'date-time': string;
	timestamp: number;
}

export interface License {
	start: Start;
	'content-version': string;
	'delay-in-days': number;
	URL: string;
}

export interface Start {
	'date-parts': number[][];
	'date-time': string;
	timestamp: number;
}

export interface ContentDomain {
	domain: any[];
	'crossmark-restriction': boolean;
}

export interface PublishedPrint {
	'date-parts': number[][];
}

export interface Created {
	'date-parts': number[][];
	'date-time': string;
	timestamp: number;
}

export interface Author {
	given: string;
	family: string;
	sequence: string;
	affiliation: any[];
}

export interface Reference {
	key: string;
	'volume-title'?: string;
	author?: string;
	year: string;
	unstructured: string;
	'first-page'?: string;
	volume?: string;
	'journal-title'?: string;
}

export interface Link {
	URL: string;
	'content-type': string;
	'content-version': string;
	'intended-application': string;
}

export interface Deposited {
	'date-parts': number[][];
	'date-time': string;
	timestamp: number;
}

export interface Resource {
	primary: Primary;
}

export interface Primary {
	URL: string;
}

export interface Issued {
	'date-parts': number[][];
}

export interface JournalIssue {
	issue: string;
	'published-print': PublishedPrint2;
}

export interface PublishedPrint2 {
	'date-parts': number[][];
}

export interface Relation {}

export interface Published {
	'date-parts': number[][];
}

function isDoiResponse(data: any): data is DoiResponse {
	return (
		data &&
		typeof data === 'object' &&
		'DOI' in data &&
		'title' in data &&
		'author' in data &&
		Array.isArray(data.author) &&
		'issued' in data &&
		'indexed' in data
	);
}

export async function requestDoiInfo(doi: string): Promise<DoiResponse | undefined> {
	const formattedDoi = formatDoi(doi);
	if (!formattedDoi || !isDoi(formattedDoi)) {
		throw new Error('Invalid DOI format');
	}

	const requestOptions = {
		method: 'GET',
		headers: {
			// Use the standard 'application/citeproc+json' which is equivalent
			// and more widely recognized than the 'vnd.' prefix version.
			Accept: 'application/citeproc+json'
		}
	};

	try {
		const req = await fetch('https://doi.org/' + formattedDoi, requestOptions);

		if (!req.ok) {
			// Handle HTTP errors (like 404 Not Found)
			// error(req.status, { message: `Failed to fetch DOI info: ${req.statusText}` });
			throw new Error(`Failed to fetch DOI info: ${req.status} ${req.statusText}`);
		}

		const data = await req.json();

		// Check Content-Type header as well for robustness
		const contentType = req.headers.get('Content-Type');
		if (
			!contentType ||
			!(contentType.includes('application/citeproc+json') || contentType.includes('application/vnd.citationstyles.csl+json'))
		) {
			console.warn(`Received unexpected Content-Type: ${contentType}. Attempting to parse anyway.`);
		}

		if (isDoiResponse(data)) {
			return data;
		} else {
			console.error('Received data does not match expected DoiResponse structure:', data);
			// error(500, { message: 'Received invalid data structure from DOI resolver' });
			throw new Error('Received invalid data structure from DOI resolver');
		}
	} catch (fetchError: any) {
		console.error('Error during DOI fetch:', fetchError);
		// error(500, { message: `Network or parsing error: ${fetchError.message}` });
		throw new Error(`Network or parsing error: ${fetchError.message}`);
	}
}

export function isDoi(doi: string) {
	const doiRegex = /^(10\.\d{4,9}\/[-._;()/:A-Z0-9]+)$/i;
	return doiRegex.test(doi);
}

export function formatDoi(doi: string) {
	if (doi.startsWith('10.')) {
		return doi;
	}
	if (doi.startsWith('doi:')) {
		return doi.slice(4);
	}
	if (doi.startsWith('http')) {
		// example https://doi.org/10.1038/308721a0 should be 10.1038/308721a0
		const url = new URL(doi);
		if (url.hostname === 'doi.org') {
			return url.pathname.slice(1);
		}
	}
}

/**
 *
 * Maps CSL JSON item types to BibTeX entry types.
 * @param cslType - The type string from CSL JSON (e.g., 'journal-article').
 * @returns The corresponding BibTeX type (e.g., 'article'). Defaults to 'misc'.
 */
function mapCslTypeToBibtex(cslType: string): string {
	const typeMap: { [key: string]: string } = {
		'article-journal': 'article', // Common variation
		'journal-article': 'article',
		book: 'book',
		chapter: 'inbook', // Or 'incollection' depending on context/preference
		'paper-conference': 'inproceedings',
		report: 'techreport',
		thesis: 'phdthesis', // Or 'mastersthesis' - CSL doesn't always distinguish well
		manuscript: 'unpublished'
		// Add more mappings as needed
	};
	return typeMap[cslType?.toLowerCase()] || 'misc'; // Default to 'misc'
}

/**
 * Formats an array of authors into a BibTeX author string.
 * @param authors - Array of author objects from CSL JSON.
 * @returns BibTeX formatted author string (e.g., "Lastname, Firstname and Doe, Jane").
 */
function formatBibtexAuthors(authors: Author[] | undefined): string | undefined {
	if (!authors || authors.length === 0) {
		return undefined;
	}
	return authors
		.map((author) => {
			// Handle cases where given name might be missing
			if (author.family && author.given) {
				return `${author.family}, ${author.given}`;
			} else if (author.family) {
				return author.family; // Only family name
			} else if (author.given) {
				return author.given; // Unlikely, but handle only given name
			}
			return ''; // Skip if no name parts found
		})
		.filter(Boolean) // Remove empty entries
		.join(' and ');
}

/**
 * Generates a simple BibTeX citation key.
 * @param authors - Array of author objects.
 * @param year - The publication year.
 * @param title - The item title.
 * @returns A citation key string (e.g., "LastName2023FirstWord").
 */
function generateCitationKey(authors: Author[] | undefined, year: string | number | undefined, title: string | undefined): string {
	const firstAuthorLastName = authors?.[0]?.family?.split(' ')?.[0] || 'Unknown';
	const yearStr = year || 'NoYear';
	const firstTitleWord = title?.split(' ')?.[0] || 'NoTitle';

	// Basic sanitization: remove non-alphanumeric characters
	const sanitize = (str: string) => str.replace(/[^a-zA-Z0-9]/g, '');

	return `${sanitize(firstAuthorLastName)}${yearStr}${sanitize(firstTitleWord)}`;
}

/**
 * Converts a month number (1-12) to a BibTeX month abbreviation.
 * @param monthNumber - The month number (1-indexed).
 * @returns BibTeX month string (e.g., 'jan', 'feb') or undefined.
 */
function formatBibtexMonth(monthNumber?: number): string | undefined {
	if (monthNumber === undefined || monthNumber < 1 || monthNumber > 12) {
		return undefined;
	}
	const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
	return months[monthNumber - 1];
}

/**
 * Creates a BibTeX citation string from a DoiResponse object.
 * @param data - The DoiResponse object obtained from requestDoiInfo.
 * @returns A string containing the BibTeX citation.
 */
export function createBibtex(data: DoiResponse): string {
	const bibtexType = mapCslTypeToBibtex(data.type);

	const year = data.issued?.['date-parts']?.[0]?.[0];
	const monthNum = data.issued?.['date-parts']?.[0]?.[1];
	const month = formatBibtexMonth(monthNum);

	const citationKey = generateCitationKey(data.author, year, data.title);

	const fields: { [key: string]: string | number | undefined } = {};

	// Core fields
	fields.title = data.title;
	fields.author = formatBibtexAuthors(data.author);
	fields.year = year;
	fields.doi = data.DOI;
	fields.url = data.URL; // Often the same as doi.org/DOI, but can differ

	// Type-specific fields
	if (bibtexType === 'article') {
		fields.journal = data['container-title'];
		fields.volume = data.volume;
		fields.number = data.issue || data['journal-issue']?.issue; // Use 'number' for issue in BibTeX
		fields.pages = data.page;
		fields.issn = data.ISSN?.join(', '); // Join if multiple ISSNs exist
	} else if (bibtexType === 'book') {
		fields.publisher = data.publisher;
		fields.isbn = data['alternative-id']?.find((id) => id.startsWith('ISBN:'))?.slice(5); // Example extraction
	} else if (bibtexType === 'inbook' || bibtexType === 'incollection') {
		fields.booktitle = data['container-title'];
		fields.publisher = data.publisher;
		fields.pages = data.page;
		// Might need 'chapter' field if available in CSL, often part of 'title' though
	} else if (bibtexType === 'inproceedings') {
		fields.booktitle = data['container-title'];
		fields.pages = data.page;
		fields.publisher = data.publisher; // Sometimes available
	} else if (bibtexType === 'techreport') {
		fields.institution = data.publisher; // Often the publisher is the institution
		fields.number = data.issue; // Report number might be in 'issue'
	}
	// Add other types as needed

	// Optional fields
	if (month) {
		fields.month = month;
	}

	// Build the BibTeX string
	let bibtexString = `@${bibtexType}{${citationKey},\n`;
	for (const key in fields) {
		const value = fields[key];
		// Only add fields that have a non-empty value
		if (value !== undefined && value !== null && value !== '') {
			// Basic value wrapping in braces. More robust escaping might be needed
			// for complex values containing special BibTeX characters.
			bibtexString += `  ${key} = {${value}},\n`;
		}
	}

	// Remove the last comma and newline, add closing brace
	if (bibtexString.endsWith(',\n')) {
		bibtexString = bibtexString.slice(0, -2) + '\n';
	}
	bibtexString += `}`;

	return bibtexString;
}
