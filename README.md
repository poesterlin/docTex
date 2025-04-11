# DocTex

This is a simple platform to simplify the creation of high-quality documents in LaTeX, without ever having to write a single line of LaTeX code. It is designed to be as simple as possible, while still providing a wide range of features. It is perfect for students, researchers, and professionals who need to create documents quickly and easily. Just write your content in a Google Doc, the rest is done for you.


## Features

- **Simple**: Write your content in Google Docs, and let DocTex do the rest.
- **Self-hosted**: You have full control over your documents, and can host them on your own server.
- **Customizable**: You can customize the appearance of your documents, by changing settings or using custom styling templates.


## Getting Started

To get started with DocTex, you need to have docker installed on your machine. You can install docker by following the instructions on the [official website](https://docs.docker.com/get-docker/).

Copy the `.env.example` file to `.env` and fill in the required values.

To start the server, run the following command:
```bash
docker compose up -d
```

The server will be available at `http://localhost:5173`.


## Contributing

If you would like to contribute to DocTex, please fork the repository and submit a pull request. We welcome contributions of all kinds, including bug fixes, new features, and documentation improvements.

**Open Tasks**:
- [x] Remove dependence on the soft deprecated hybrid mode of the [markdown tex library](https://ftp.snt.utwente.nl/pub/software/tex/macros/generic/markdown/markdown.pdf).
- [x] Protect updating custom templates from unauthorized users
- [x] Improve Support for Bibliographies
- [ ] Document special markdown features supported by the markdown tex library [*(citations, linkAttributes, pipeTables, relativeReferences, tableAttributes, tableCaptions)*](https://ftp.snt.utwente.nl/pub/software/tex/macros/generic/markdown/markdown.pdf)
- [x] Add support for Tables
- [x] Add an option to input content directly, without using Google Docs
- [ ] Handle not having full access to the Google Drive API
- [ ] Allow user to abort the document generation process
- [x] Improve design and user experience
- [ ] Add support to split chapters into separate files
- [x] Document how to create custom templates as a power user
- [ ] Add support for webhooks to trigger document generation
- [x] Auto update build status
- [x] Share output files by authorized link
- [ ] Separate the builder process from the server
- [ ] Document Minio Blob Storage setup
- [ ] Add support for git repositories
- [ ] Add a demo mode
- [ ] Document how to setup OAuth for Google Drive API in Google Cloud Console
- [ ] Provide a prebuilt docker image


## LaTeX Templating Syntax Documentation

### Introduction

This document describes a simple templating syntax designed to automate the generation of LaTeX documents. It allows you to embed variables and conditional logic directly within a .tex template file. A separate processing step is required to evaluate these templates, substitute variables, resolve conditions, and produce a final, compilable .tex file.

The syntax deliberately uses delimiters (`{{ ... }}` and `{% ... %}`) common in other templating languages to provide a familiar experience.

### Syntax Overview
There are two primary types of template tags:

Variable Substitution: `{{ variable_name }}` - Used to insert the value of a variable into the document.
Control Flow / Directives: `{% command parameters %}` - Used for logic like conditional blocks or custom actions.

### 1. Markdown Content

**Purpose:** To include raw Markdown content in the LaTeX document.

#### Syntax:
```latex
...
% === Chapters ===

#INCLUDE_CHAPTERS

% === End Chapters ===
...
```

#### Details:
- Every Style Template needs to have a `#INCLUDE_CHAPTERS` tag somewhere in the LaTeX document.
- The `#INCLUDE_CHAPTERS` tag is a placeholder for where the Markdown content will be inserted.
- The content between the `#INCLUDE_CHAPTERS` tags will be replaced with the actual Markdown content.
- The Markdown content can include headers, lists, tables, and other Markdown features.

### 2. Variable Substitution
**Purpose:** To insert dynamic content into the LaTeX document.

#### Syntax: `{{ variable_name }}`

#### Details:

The variable_name should typically consist of alphanumeric characters and underscores (_). Conventionally, use lowercase names with underscores as separators (e.g., document_title, author_name).
Whitespace around the variable name inside the braces is usually ignored (e.g., `{{ my_variable }}` is the same as `{{my_variable}}`).
The processing engine will replace the entire `{{ variable_name }}` tag with the string value provided for that variable.
If a variable is not defined during processing, the engine might raise an error or substitute an empty string, depending on its configuration.

#### Example:

```latex
% --- Template ---
\documentclass[{{ papersize }}]{article}
\title{ {{ document_title }} }
\author{ {{ author_name }} }
\begin{document}
\maketitle
Hello, {{ user_name }}!
\end{document}

% --- Variables Provided ---
% papersize = "a4paper"
% document_title = "My Automated Report"
% author_name = "Jane Doe"
% user_name = "World"

% --- Resulting .tex File ---
\documentclass[a4paper]{article}
\title{ My Automated Report }
\author{ Jane Doe }
\begin{document}
\maketitle
Hello, World!
\end{document}
```

### 3. Control Flow: Conditional Blocks (if/else/endif)
**Purpose:** To conditionally include or exclude sections of the LaTeX template based on the value of a variable.

#### Syntax:

```latex
{% if condition_variable %}
  ... LaTeX content to include if condition_variable is "true" ...
{% else %}
  ... Optional LaTeX content to include if condition_variable is "false" ...
{% endif %}
```
#### Details:

`{% if condition_variable %}`: Marks the beginning of a conditional block. The condition_variable is evaluated for "truthiness". Common rules for truthiness (though implementation-dependent) are:
Boolean true.
Non-empty strings.
Non-zero numbers.
Non-empty lists/objects.
Boolean false, None/null, empty strings/lists, and zero are typically considered "false".
`{% else %}`: (Optional) Marks the beginning of the section to include if the if condition evaluates to false.
`{% endif %}`: Marks the end of the conditional block. It is required for every `{% if ... %}`.
Whitespace within the `{% ... %}` tags around the command (if, else, endif) and the variable name is typically ignored.

#### Example:

```latex
% --- Template ---
\documentclass{article}
\author{ {{ author_name }} }
{% if show_affiliation %}
  \affil{ {{ affiliation }} }
{% else %}
  % No affiliation shown
{% endif %}
\begin{document}
\maketitle
Document content.
\end{document}

% --- Variables Provided (Scenario 1) ---
% author_name = "Jane Doe"
% show_affiliation = true
% affiliation = "University of Example"

% --- Resulting .tex (Scenario 1) ---
\documentclass{article}
\author{ Jane Doe }
  \affil{ University of Example }
\begin{document}
\maketitle
Document content.
\end{document}

% --- Variables Provided (Scenario 2) ---
% author_name = "John Smith"
% show_affiliation = false
% affiliation = "Some Company" % (Value ignored)

% --- Resulting .tex (Scenario 2) ---
\documentclass{article}
\author{ John Smith }
  % No affiliation shown
\begin{document}
\maketitle
Document content.
\end{document}
```
