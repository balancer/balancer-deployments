# Contributing to Balancer Deployments

Thank you for your interest in contributing to Balancer Deployments! This repository contains the deployment artifacts and scripts for Balancer Protocol smart contracts.

## Getting Started

### Prerequisites

- Node.js (v18+)
- Yarn
- Git

### Setup

```bash
# Clone the repository
git clone https://github.com/balancer/balancer-deployments.git
cd balancer-deployments

# Install dependencies
yarn install
```

## Repository Structure

- `v2/` - Balancer V2 deployments
- `v3/` - Balancer V3 deployments
- `src/` - Shared deployment infrastructure
- Each task directory contains:
  - `readme.md` - Task description and useful files
  - `input.ts` - Deployment parameters
  - `index.ts` - Deployment script
  - `output/` - Deployed contract addresses per network
  - `artifact/` - Contract ABIs and bytecode
  - `build-info/` - Compilation information

## How to Contribute

### Reporting Issues

- Use GitHub Issues to report bugs or suggest improvements
- For security vulnerabilities, please see [SECURITY.md](./SECURITY.md)

### Submitting Changes

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Make your changes
4. Ensure all tests pass
5. Submit a Pull Request

### Adding New Deployments

For adding new deployment tasks, please refer to [DEPLOYING.md](./DEPLOYING.md) for detailed instructions on:

- Creating task directories
- Generating build info
- Writing deployment scripts
- Verifying deployments

## Code Style

- Follow existing code patterns in the repository
- Use TypeScript for all scripts
- Include appropriate documentation in readme files

## Questions

If you have questions about contributing, please:

- Check existing documentation
- Open a GitHub Discussion
- Reach out on [Discord](https://discord.balancer.fi)

## License

By contributing, you agree that your contributions will be licensed under the GPL-3.0 License.
