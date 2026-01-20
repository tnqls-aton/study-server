<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="200" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://coveralls.io/github/nestjs/nest?branch=master" target="_blank"><img src="https://coveralls.io/repos/github/nestjs/nest/badge.svg?branch=master#9" alt="Coverage" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Installation

```bash
$ npm install
```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://kamilmysliwiec.com)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](LICENSE).

# study-project

## AI Code Assistant

This project uses Gemini CLI to automatically assist with code improvements, bug fixes, and documentation enhancements.

### How to Use

1. **Create an issue** with one of these labels:
   - `ai-code-review`: Request code review and improvements
   - `ai-bug-fix`: Report a bug and request an AI-generated fix
   - `ai-docs`: Request documentation improvements

2. **The AI assistant will automatically**:
   - Analyze your request and the codebase
   - Generate appropriate code changes
   - Create a pull request for review

3. **Review and merge** the PR if the changes look good

### Example Issues

#### Code Review
```
Title: Improve error handling in chat module
Label: ai-code-review
Body: Review the error handling patterns in src/module/chat/ and suggest improvements
```

#### Bug Fix
```
Title: Fix WebSocket connection leak
Label: ai-bug-fix
Body: WebSocket connections are not properly closed when users disconnect from chat rooms
```

#### Documentation
```
Title: Add JSDoc comments to user service
Label: ai-docs
Body: Add comprehensive JSDoc comments to all methods in src/module/user/service/user.service.ts
```

### Setup for Repository Admins

To enable the AI Code Assistant in your repository:

1. **Get a Gemini API Key**:
   - Visit [Google AI Studio](https://aistudio.google.com/apikey)
   - Sign in with your Google account
   - Generate a new API key

2. **Add the API key to GitHub Secrets**:
   - Go to your repository Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `GEMINI_API_KEY`
   - Value: Your API key from step 1

3. **The workflow is now active** and will trigger when issues with the appropriate labels are created

### Features

- **Free to use**: Gemini API provides 60 requests/minute and 1,000 requests/day at no cost
- **Context-aware**: Uses Gemini 2.5 Pro with 1M token context window
- **Safe**: All changes are submitted as pull requests for review
- **Flexible**: Supports code review, bug fixes, and documentation improvements

### Limitations

- AI-generated code should always be reviewed before merging
- Complex refactoring may require multiple iterations
- The AI assistant works best with clear, specific issue descriptions
