# Contributing to Scope Creep Insurance

Thank you for considering contributing to Scope Creep Insurance! This document provides guidelines for contributing to the project.

## How to Contribute

### Reporting Bugs

If you find a bug, please create an issue with:
- Clear description of the bug
- Steps to reproduce
- Expected behavior
- Actual behavior
- Environment details (Node version, network, etc.)

### Suggesting Features

We welcome feature suggestions! Please create an issue with:
- Clear description of the feature
- Use case and benefits
- Any implementation ideas (optional)

### Code Contributions

1. **Fork the repository**
   ```bash
   git clone https://github.com/jmenichole/Scope-Creep.git
   ```

2. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes**
   - Follow the existing code style
   - Add tests for new functionality
   - Update documentation as needed

4. **Test your changes**
   ```bash
   npm run compile
   npm test
   ```

5. **Commit your changes**
   ```bash
   git commit -m "Add feature: description"
   ```

6. **Push and create a Pull Request**
   ```bash
   git push origin feature/your-feature-name
   ```

## Development Guidelines

### Code Style

- Use consistent indentation (2 spaces)
- Follow Solidity best practices
- Add comments for complex logic
- Use descriptive variable and function names

### Smart Contract Changes

When modifying smart contracts:
- Ensure backward compatibility when possible
- Add comprehensive tests
- Consider gas optimization
- Document all public functions
- Follow security best practices

### Testing

- Write tests for all new features
- Ensure all tests pass before submitting PR
- Aim for high test coverage
- Test edge cases and error conditions

### Documentation

- Update README.md if adding user-facing features
- Update DOCUMENTATION.md for technical changes
- Add inline comments for complex code
- Include JSDoc comments for functions

## Security

If you discover a security vulnerability:
1. **DO NOT** create a public issue
2. Email the maintainers directly
3. Provide detailed information about the vulnerability
4. Wait for response before public disclosure

## Pull Request Process

1. Ensure your code passes all tests
2. Update documentation as needed
3. Link related issues in PR description
4. Wait for review from maintainers
5. Address review feedback
6. Once approved, your PR will be merged

## Code of Conduct

### Our Standards

- Be respectful and inclusive
- Welcome newcomers
- Accept constructive criticism
- Focus on what's best for the project
- Show empathy towards others

### Unacceptable Behavior

- Harassment or discrimination
- Trolling or insulting comments
- Personal or political attacks
- Publishing others' private information
- Other unprofessional conduct

## Questions?

Feel free to:
- Open an issue for questions
- Join community discussions
- Reach out to maintainers

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

Thank you for contributing to Scope Creep Insurance! 🎉
