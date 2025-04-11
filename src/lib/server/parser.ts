// --- Settings Type ---
export type TemplateSettings = Record<string, string | boolean>;

// --- Tokenizer ---

export enum TokenType {
	LATEX_CONTENT = 'LATEX_CONTENT',
	VAR_START = 'VAR_START', // {{
	VAR_END = 'VAR_END', // }}
	BLOCK_START = 'BLOCK_START', // {%
	BLOCK_END = 'BLOCK_END', // %}
	IDENTIFIER = 'IDENTIFIER', // variable_name or condition_variable
	KEYWORD_IF = 'KEYWORD_IF', // if
	KEYWORD_ELSE = 'KEYWORD_ELSE', // else
	KEYWORD_ENDIF = 'KEYWORD_ENDIF', // endif
	EOF = 'EOF',
	UNKNOWN = 'UNKNOWN' // For errors or unexpected sequences
}

interface Token {
	type: TokenType;
	value?: string; // Content for LATEX_CONTENT, IDENTIFIER
	line: number; // For error reporting
	col: number; // For error reporting
}

export function tokenize(input: string): Token[] {
	const tokens: Token[] = [];
	let pos = 0;
	let line = 1;
	let lineStartPos = 0;

	const wordRegex = RegExp(/^(\w+)/);

	const consumeWhitespace = () => {
		while (pos < input.length && /\s/.test(input[pos])) {
			if (input[pos] === '\n') {
				line++;
				lineStartPos = pos + 1;
			}
			pos++;
		}
	};

	const getCurrentPos = () => ({ line, col: pos - lineStartPos + 1 });

	while (pos < input.length) {
		const startPosInfo = getCurrentPos();
		let content = '';

		// Try to find the next tag start
		const varStart = input.indexOf('{{', pos);
		const blockStart = input.indexOf('{%', pos);

		let nextTagPos = -1;
		let isVarTag = false;

		if (varStart !== -1 && blockStart !== -1) {
			if (varStart < blockStart) {
				nextTagPos = varStart;
				isVarTag = true;
			} else {
				nextTagPos = blockStart;
				// isVarTag = false;
			}
		} else if (varStart !== -1) {
			nextTagPos = varStart;
			isVarTag = true;
		} else if (blockStart !== -1) {
			nextTagPos = blockStart;
			//   isVarTag = false;
		}

		// 1. Consume LATEX_CONTENT until the next tag or EOF
		if (nextTagPos === -1 || nextTagPos > pos) {
			const endContentPos = nextTagPos === -1 ? input.length : nextTagPos;
			content = input.substring(pos, endContentPos);
			// Update line counts within the content
			const linesInContent = content.split('\n');
			if (linesInContent.length > 1) {
				line += linesInContent.length - 1;
				lineStartPos = pos + content.lastIndexOf('\n') + 1;
			}
			tokens.push({ type: TokenType.LATEX_CONTENT, value: content, ...startPosInfo });
			pos = endContentPos;
		}

		if (pos >= input.length) break; // Reached EOF after content

		// 2. Process the tag
		const tagStartPosInfo = getCurrentPos();
		if (isVarTag) {
			// --- Variable Tag {{ ... }} ---
			tokens.push({ type: TokenType.VAR_START, ...tagStartPosInfo });
			pos += 2; // Consume '{{'
			consumeWhitespace();
			const varNameMatch = wordRegex.exec(input.substring(pos));
			if (!varNameMatch) {
				tokens.push({ type: TokenType.UNKNOWN, value: input.substring(pos, Math.min(pos + 10, input.length)), ...getCurrentPos() });
				console.error(`Error: Expected identifier after {{ at line ${tagStartPosInfo.line}, col ${tagStartPosInfo.col}`);
				break; // Or handle error differently
			}
			const varName = varNameMatch[1];
			pos += varName.length;
			tokens.push({ type: TokenType.IDENTIFIER, value: varName, ...getCurrentPos() });
			consumeWhitespace();
			if (input.substring(pos, pos + 2) === '}}') {
				tokens.push({ type: TokenType.VAR_END, ...getCurrentPos() });
				pos += 2; // Consume '}}'
			} else {
				tokens.push({ type: TokenType.UNKNOWN, value: input.substring(pos, Math.min(pos + 10, input.length)), ...getCurrentPos() });
				console.error(`Error: Expected }} after variable name at line ${getCurrentPos().line}, col ${getCurrentPos().col}`);
				break;
			}
		} else {
			// --- Block Tag {% ... %} ---
			tokens.push({ type: TokenType.BLOCK_START, ...tagStartPosInfo });
			pos += 2; // Consume '{%'
			consumeWhitespace();
			const commandMatch = input.substring(pos).match(/^(if|else|endif)\b/); // Match keywords

			if (!commandMatch) {
				tokens.push({ type: TokenType.UNKNOWN, value: input.substring(pos, Math.min(pos + 10, input.length)), ...getCurrentPos() });
				console.error(`Error: Expected 'if', 'else', or 'endif' after {% at line ${tagStartPosInfo.line}, col ${tagStartPosInfo.col}`);
				break;
			}

			const command = commandMatch[1];
			pos += command.length;
			const commandTokenPos = getCurrentPos();

			if (command === 'if') {
				tokens.push({ type: TokenType.KEYWORD_IF, ...commandTokenPos });
				consumeWhitespace();
				const conditionVarMatch = input.substring(pos).match(/^(\w+)/);
				if (!conditionVarMatch) {
					tokens.push({ type: TokenType.UNKNOWN, value: input.substring(pos, Math.min(pos + 10, input.length)), ...getCurrentPos() });
					console.error(`Error: Expected identifier after 'if' at line ${commandTokenPos.line}, col ${commandTokenPos.col}`);
					break;
				}
				const conditionVar = conditionVarMatch[1];
				pos += conditionVar.length;
				tokens.push({ type: TokenType.IDENTIFIER, value: conditionVar, ...getCurrentPos() });
			} else if (command === 'else') {
				tokens.push({ type: TokenType.KEYWORD_ELSE, ...commandTokenPos });
			} else if (command === 'endif') {
				tokens.push({ type: TokenType.KEYWORD_ENDIF, ...commandTokenPos });
			}

			consumeWhitespace();
			if (input.substring(pos, pos + 2) === '%}') {
				tokens.push({ type: TokenType.BLOCK_END, ...getCurrentPos() });
				pos += 2; // Consume '%}'
			} else {
				tokens.push({ type: TokenType.UNKNOWN, value: input.substring(pos, Math.min(pos + 10, input.length)), ...getCurrentPos() });
				console.error(`Error: Expected %} after block command at line ${getCurrentPos().line}, col ${getCurrentPos().col}`);
				break;
			}
		}
	}

	tokens.push({ type: TokenType.EOF, ...getCurrentPos() });
	return tokens;
}

// --- Processor ---

export function processTemplate(tokens: Token[], settings: TemplateSettings): string {
	let output = '';
	let i = 0;
	const ifStack: boolean[] = []; // Tracks the evaluation of current 'if' blocks
	let skipLevel = 0; // How many levels of blocks we are currently skipping

	// Helper to check truthiness: exists and is not an empty string
	const isTruthy = (key: string): boolean => {
		return settings.hasOwnProperty(key) && settings[key] !== '';
	};

	while (tokens[i].type !== TokenType.EOF) {
		const token = tokens[i];
		const nextToken = tokens[i + 1];
		const thirdToken = tokens[i + 2];
		const fourthToken = tokens[i + 3];

		if (skipLevel > 0) {
			// We are inside a block that should be skipped
			if (token.type === TokenType.BLOCK_START && nextToken?.type === TokenType.KEYWORD_IF) {
				// Entering a nested 'if' while skipping increases skip level
				skipLevel++;
				i += 5; // Skip {% if IDENTIFIER %}
			} else if (token.type === TokenType.BLOCK_START && nextToken?.type === TokenType.KEYWORD_ELSE && skipLevel === 1) {
				// Found the 'else' for the block we *started* skipping
				// If the original 'if' was false, we stop skipping here
				if (!ifStack[ifStack.length - 1]) {
					skipLevel = 0;
				}
				i += 3; // Skip {% else %}
			} else if (token.type === TokenType.BLOCK_START && nextToken?.type === TokenType.KEYWORD_ENDIF) {
				// Exiting an 'if' block decreases skip level
				skipLevel--;
				ifStack.pop(); // Also pop from the main stack
				i += 3; // Skip {% endif %}
			} else {
				// Skip any other token
				i++;
			}
		} else {
			// We are processing normally
			switch (token.type) {
				case TokenType.LATEX_CONTENT:
					output += token.value || '';
					i++;
					break;

				case TokenType.VAR_START: // {{ IDENTIFIER }}
					if (nextToken?.type === TokenType.IDENTIFIER && thirdToken?.type === TokenType.VAR_END) {
						const varName = nextToken.value!;
						output += settings[varName] ?? ''; // Substitute with value or empty string if not found
						i += 3; // Skip {{, IDENTIFIER, }}
					} else {
						console.error(`Malformed variable tag near line ${token.line}, col ${token.col}`);
						// Output the raw tag maybe? Or throw error
						output += `{{${nextToken?.value ?? '?'}${thirdToken?.type === TokenType.VAR_END ? '}}' : '...'}`;
						i += (nextToken ? 1 : 0) + (thirdToken ? 1 : 0); // Try to skip
					}
					break;

				case TokenType.BLOCK_START: // {% KEYWORD ... %}
					if (
						nextToken?.type === TokenType.KEYWORD_IF &&
						thirdToken?.type === TokenType.IDENTIFIER &&
						fourthToken?.type === TokenType.BLOCK_END
					) {
						const conditionVar = thirdToken.value!;
						const conditionMet = isTruthy(conditionVar);
						ifStack.push(conditionMet);
						if (!conditionMet) {
							skipLevel = 1; // Start skipping if condition is false
						}
						i += 4; // Skip {% if IDENTIFIER %}
					} else if (nextToken?.type === TokenType.KEYWORD_ELSE && thirdToken?.type === TokenType.BLOCK_END) {
						if (ifStack.length === 0) {
							throw new Error(`Unexpected 'else' without matching 'if' near line ${token.line}, col ${token.col}`);
						}
						// If the corresponding 'if' was true, start skipping this 'else' block
						if (ifStack[ifStack.length - 1]) {
							skipLevel = 1;
						}
						// (If the 'if' was false, we were already skipping, and the skipLevel logic at the top handles turning it off)
						i += 3; // Skip {% else %}
					} else if (nextToken?.type === TokenType.KEYWORD_ENDIF && thirdToken?.type === TokenType.BLOCK_END) {
						if (ifStack.length === 0) {
							throw new Error(`Unexpected 'endif' without matching 'if' near line ${token.line}, col ${token.col}`);
						}
						ifStack.pop(); // Remove the last 'if' state
						// skipLevel should already be 0 if we were processing the block
						i += 3; // Skip {% endif %}
					} else {
						console.error(`Malformed block tag near line ${token.line}, col ${token.col}`);
						// Output raw tag or throw
						output += `{%${nextToken?.value ?? '?'}${thirdToken?.type === TokenType.BLOCK_END ? '%}' : '...'}`;
						i += (nextToken ? 1 : 0) + (thirdToken ? 1 : 0);
					}
					break;

				default:
					// Should not happen if tokenizer is correct, but handle defensively
					console.warn(`Unexpected token type during processing: ${token.type} near line ${token.line}, col ${token.col}`);
					i++;
					break;
			}
		}
	}

	if (ifStack.length > 0) {
		console.error(`Error: Unmatched 'if' blocks at end of file. ${ifStack.length} levels open.`);
	}
	if (skipLevel > 0) {
		console.error(`Error: Still in skip mode at end of file. Mismatched endif?`);
	}

	return output;
}

export function findBooleans(tokens: Token[], variables: string[]) {
	const booleans = new Set<string>(variables);

	for (let i = 1; i < tokens.length; i++) {
		const token = tokens[i];
		const prevToken = tokens[i - 1];

		// if a variable is not only used in a condition, remove it from the set
		if (token.type === TokenType.IDENTIFIER && prevToken?.type !== TokenType.KEYWORD_IF && token.value) {
			booleans.delete(token.value);
		}
	}

	return booleans;
}

export function findOptionalSettings(tokens: Token[], variables: string[]) {
	const optionalSettings = new Set<string>();

	for (let i = 1; i < tokens.length; i++) {
		const token = tokens[i];
		const prevToken = tokens[i - 1];

		// when we come across a variable that is used in a condition, we need to check if it is used outside of the condition
		if (token.type === TokenType.IDENTIFIER && prevToken?.type === TokenType.KEYWORD_IF && token.value) {
			const variable = token.value;

			const found = findVariableUsageOutsideIfBlocks(tokens, i, variable);
			if (!found) {
				optionalSettings.add(token.value);
			}
		}
	}

	return optionalSettings;
}

function findVariableUsageOutsideIfBlocks(tokens: Token[], i: number, variable: string) {
	let isInsideIfBlock = true;

	for (let j = i + 1; j < tokens.length; j++) {
		const t = tokens[j];
		if (t.type === TokenType.KEYWORD_ENDIF) {
			isInsideIfBlock = false;
		}

		if (t.type === TokenType.KEYWORD_IF) {
			isInsideIfBlock = true;
		}

		// if a variable is used outside of a if block, remove it from the set
		if (t.type === TokenType.IDENTIFIER && t.value === variable && !isInsideIfBlock) {
			return true;
		}
	}

	return false;
}
