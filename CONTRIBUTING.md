# Contributing to AAB Bus Tracking App

First off, thank you for considering contributing to the AAB Bus Tracking App! 🎉

## 📜 Code of Conduct

This project adheres to a code of conduct that all contributors are expected to follow:

- **Be respectful** and inclusive
- **Be collaborative** and constructive
- **Be patient** with fellow contributors
- **Focus on the project**, not personal issues

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0 or yarn
- Git
- A code editor (VS Code recommended)

### Setup

1. **Fork the repository**

2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/ai-mobile-leotrimhaliti.git
   cd aab-bus
   ```

3. **Add upstream remote**
   ```bash
   git remote add upstream https://github.com/leotrimhaliti/ai-mobile-leotrimhaliti.git
   ```

4. **Install dependencies**
   ```bash
   npm install
   ```

5. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

6. **Run the app**
   ```bash
   npm run dev
   ```

---

## 🔄 Development Workflow

### 1. Create a Feature Branch

Always create a new branch for your work:

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

Branch naming conventions:
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Adding tests
- `chore/` - Maintenance tasks

### 2. Make Your Changes

- Write clean, readable code
- Follow the project's coding standards
- Add tests for new functionality
- Update documentation as needed

### 3. Test Your Changes

```bash
# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage

# Type checking
npm run typecheck

# Linting
npm run lint
```

### 4. Commit Your Changes

Follow our [commit message guidelines](#commit-messages):

```bash
git add .
git commit -m "feat: add new bus tracking feature"
```

### 5. Keep Your Branch Updated

```bash
git fetch upstream
git rebase upstream/main
```

### 6. Push to Your Fork

```bash
git push origin feature/your-feature-name
```

---

## 💻 Coding Standards

### TypeScript

- **Use TypeScript** for all new code
- **Enable strict mode** - no `any` types unless absolutely necessary
- **Define interfaces** for all data structures
- **Use proper types** for function parameters and return values

```typescript
// ✅ Good
interface User {
  id: string;
  name: string;
  email: string;
}

function getUser(id: string): Promise<User> {
  // implementation
}

// ❌ Bad
function getUser(id: any): any {
  // implementation
}
```

### React Components

- **Use functional components** with hooks
- **Use TypeScript** for props
- **Memoize expensive components** with `React.memo`
- **Extract custom hooks** for reusable logic

```typescript
// ✅ Good
interface ProfileProps {
  userId: string;
  onLogout: () => void;
}

export const Profile: React.FC<ProfileProps> = ({ userId, onLogout }) => {
  // implementation
};

// ❌ Bad
export const Profile = (props: any) => {
  // implementation
};
```

### File Naming

- **Components:** PascalCase (e.g., `BusTracker.tsx`)
- **Hooks:** camelCase with `use` prefix (e.g., `useBusLocations.ts`)
- **Utilities:** camelCase (e.g., `validation.ts`)
- **Types:** PascalCase (e.g., `BusLocation.ts`)

### Code Style

- **Indentation:** 2 spaces
- **Quotes:** Single quotes for strings
- **Semicolons:** Required
- **Line length:** Maximum 100 characters
- **Trailing commas:** Always use in multi-line objects/arrays

```typescript
// ✅ Good
const config = {
  apiUrl: 'https://api.example.com',
  timeout: 5000,
  retries: 3,
};

// ❌ Bad
const config = {
  apiUrl: "https://api.example.com",
  timeout: 5000,
  retries: 3
}
```

---

## 🧪 Testing Guidelines

### Writing Tests

- **Write tests** for all new features
- **Maintain coverage** above 80%
- **Use descriptive test names** that explain what is being tested
- **Follow AAA pattern:** Arrange, Act, Assert

```typescript
describe('validateEmail', () => {
  it('should accept valid email addresses', () => {
    // Arrange
    const email = 'test@example.com';
    
    // Act
    const result = validateEmail(email);
    
    // Assert
    expect(result.valid).toBe(true);
  });

  it('should reject invalid email addresses', () => {
    const email = 'invalid-email';
    const result = validateEmail(email);
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });
});
```

### Test Categories

1. **Unit Tests** - Individual functions and utilities
2. **Component Tests** - React components
3. **Hook Tests** - Custom hooks
4. **Integration Tests** - Multiple components working together

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- validation.test.ts

# Run tests in watch mode
npm test -- --watch

# Generate coverage report
npm test -- --coverage
```

---

## 📝 Commit Messages

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat:** New feature
- **fix:** Bug fix
- **docs:** Documentation changes
- **style:** Code style changes (formatting, etc.)
- **refactor:** Code refactoring
- **test:** Adding or updating tests
- **chore:** Maintenance tasks

### Examples

```bash
# Feature
feat(auth): add biometric authentication

# Bug fix
fix(map): resolve marker clustering issue

# Documentation
docs(readme): update installation instructions

# Refactor
refactor(hooks): simplify useBusLocations logic

# Test
test(validation): add edge case tests for email validation
```

---

## 🔀 Pull Request Process

### Before Submitting

1. ✅ All tests pass
2. ✅ Code is properly formatted and linted
3. ✅ TypeScript compiles without errors
4. ✅ Documentation is updated
5. ✅ Commit messages follow conventions

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How has this been tested?

## Checklist
- [ ] Tests pass
- [ ] TypeScript compiles
- [ ] Documentation updated
- [ ] Self-review completed
```

### Review Process

1. **Submit PR** with clear description
2. **Wait for review** from maintainers
3. **Address feedback** promptly
4. **Get approval** from at least one maintainer
5. **Merge** will be done by maintainers

---

## 📂 Project Structure

```
aab-bus/
├── app/                 # Screens (Expo Router)
├── components/          # Reusable components
├── contexts/            # React contexts
├── hooks/               # Custom hooks
├── lib/                 # Utility libraries
├── types/               # TypeScript types
├── __tests__/           # Test files
└── constants/           # App constants
```

### Adding New Files

- **Components:** Add to `components/` or `components/ui/`
- **Hooks:** Add to `hooks/`
- **Utils:** Add to `lib/`
- **Types:** Add to `types/`
- **Tests:** Mirror structure in `__tests__/`

---

## 🐛 Reporting Bugs

### Before Reporting

- Check existing issues
- Verify it's not a known issue
- Try to reproduce consistently

### Bug Report Template

```markdown
**Description:**
Clear description of the bug

**Steps to Reproduce:**
1. Go to...
2. Click on...
3. See error

**Expected Behavior:**
What should happen

**Actual Behavior:**
What actually happens

**Environment:**
- OS: [e.g., iOS 17, Android 14]
- App Version: [e.g., 1.0.0]
- Device: [e.g., iPhone 15]

**Screenshots:**
If applicable
```

---

## 💡 Feature Requests

We welcome feature suggestions! Please:

1. Check if it's already requested
2. Provide clear use case
3. Explain expected behavior
4. Consider implementation complexity

---

## 🎓 Resources

- [React Native Docs](https://reactnative.dev/docs/getting-started)
- [Expo Documentation](https://docs.expo.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Library](https://testing-library.com/docs/react-native-testing-library/intro/)

---

## 📞 Getting Help

- 💬 Ask in GitHub Discussions
- 📧 Email: support@aab-edu.net
- 🐛 Open an issue for bugs

---

## ✨ Recognition

Contributors will be recognized in:
- README acknowledgments
- Release notes
- Project documentation

Thank you for contributing! 🙏

---

<div align="center">

**Happy Coding! 💻**

[Back to README](README.md)

</div>
