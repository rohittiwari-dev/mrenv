# Contributing to mrenv

First off, thank you for considering contributing to mrenv! It's people like you that make the open source community such a great place to learn, inspire, and create. Here are the guidelines we'd like you to follow:

-   [Code of Conduct](#code-of-conduct)
-   [Question or Problem?](#question-or-problem)
-   [Issues and Bugs](#issues-and-bugs)
-   [Feature Requests](#feature-requests)
-   [Submission Guidelines](#submission-guidelines)
-   [Development Setup](#development-setup)
-   [Coding Rules](#coding-rules)
-   [Commit Message Guidelines](#commit-message-guidelines)

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## Question or Problem?

If you have questions about how to use mrenv, please start a new discussion in the GitHub Discussions tab rather than opening an issue.

## Issues and Bugs

If you find a bug in the source code, you can help us by [submitting an issue](#submission-guidelines) to our GitHub Repository. Even better, you can [submit a Pull Request](#pull-requests) with a fix.

## Feature Requests

You can request a new feature by [submitting an issue](#submission-guidelines) to our GitHub Repository. If you would like to implement a new feature, please submit an issue with a proposal for your work first, to be sure that we can use it.

## Submission Guidelines

### Submitting an Issue

Before you submit an issue, please search the issue tracker, maybe an issue for your problem already exists and the discussion might inform you of workarounds readily available.

We want to fix all the issues as soon as possible, but before fixing a bug we need to reproduce and confirm it. In order to reproduce bugs, we will systematically ask you to provide minimal reproduction scenarios. Having a live, reproducible scenario gives us a wealth of important information without going back and forth with you.

### Submitting a Pull Request (PR)

Before you submit your Pull Request (PR) consider the following guidelines:

1. Search GitHub for an open or closed PR that relates to your submission. You don't want to duplicate effort.

2. Fork the repository.

3. Make your changes in a new git branch:

    ```bash
    git checkout -b my-fix-branch main
    ```

4. Create your changes, including appropriate test cases.

5. Run the test suite, as described in the [Development Setup](#development-setup) section.

6. Commit your changes using a descriptive commit message that follows our [commit message conventions](#commit-message-guidelines).

7. Push your branch to GitHub:

    ```bash
    git push origin my-fix-branch
    ```

8. In GitHub, send a pull request to `main`.

## Development Setup

1. Clone the repository:

    ```bash
    git clone https://github.com/your-username/mrenv.git
    cd mrenv
    ```

2. Install dependencies:

    ```bash
    npm install
    ```

3. Build the project:

    ```bash
    npm run build
    ```

4. Test your changes locally:

    ```bash
    npm run dev
    ```

## Coding Rules

To ensure consistency throughout the source code, keep these rules in mind as you are working:

-   All features or bug fixes **must be tested** by one or more specs (unit-tests).
-   All public API methods **must be documented**.
-   We follow [Prettier](https://prettier.io/) for code formatting and use ESLint for linting.

## Commit Message Guidelines

We have very precise rules over how our git commit messages can be formatted. This leads to **more readable messages** that are easy to follow when looking through the project history.

### Commit Message Format

Each commit message consists of a **header**, a **body** and a **footer**. The header has a special format that includes a **type**, a **scope** and a **subject**:

```
<type>(<scope>): <subject>
<BLANK LINE>
<body>
<BLANK LINE>
<footer>
```

The **header** is mandatory and the **scope** of the header is optional.

### Type

Must be one of the following:

-   **feat**: A new feature
-   **fix**: A bug fix
-   **docs**: Documentation only changes
-   **style**: Changes that do not affect the meaning of the code (white-space, formatting, etc)
-   **refactor**: A code change that neither fixes a bug nor adds a feature
-   **perf**: A code change that improves performance
-   **test**: Adding missing tests or correcting existing tests
-   **chore**: Changes to the build process or auxiliary tools

Thank you for contributing!
