# DocTex

This is a simple platform to simplify the creation of high-quality documents in LaTeX, without ever having to write a single line of LaTeX code. It is designed to be as simple as possible, while still providing a wide range of features. It is perfect for students, researchers, and professionals who need to create documents quickly and easily. Just write your content in a Google Docs, the rest is done for you.


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
- [ ] Remove dependence on the soft deprecated hybrid mode of the [markdown tex library](https://ftp.snt.utwente.nl/pub/software/tex/macros/generic/markdown/markdown.pdf).
- [ ] Protect updating custom templates from unauthorized users
- [ ] Improve Support for Bibliographies
- [ ] Document special markdown features supported by the markdown tex library [*(citations, linkAttributes, pipeTables, relativeReferences, tableAttributes, tableCaptions)*](https://ftp.snt.utwente.nl/pub/software/tex/macros/generic/markdown/markdown.pdf)
- [ ] Add support for Tables
- [ ] Add an option to input content directly, without using Google Docs
- [ ] Handle not having full access to the Google Drive API
- [ ] Improve design and user experience
- [ ] Add support to split chapters into separate files
- [ ] Document how to create custom templates as a power user
- [ ] Add support for webhooks to trigger document generation
- [ ] Auto update build status
- [ ] Separate the builder process from the server
- [ ] Document Minio Blob Storage setup
- [ ] Add support for git repositories
- [ ] Add a demo mode
- [ ] Document how to setup OAuth for Google Drive API in Google Cloud Console
- [ ] Provide a prebuilt docker image
