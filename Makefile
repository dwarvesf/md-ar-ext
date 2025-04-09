# Makefile for Markdown Arweave Uploader

# Detect OS
ifeq ($(OS),Windows_NT)
	DETECTED_OS := Windows
else
	DETECTED_OS := $(shell uname -s)
endif

# Tool management
NODE := node
NPM := npm
VSCE := npx vsce

# Directory structure
RELEASE_DIR := releases
DIST_DIR := dist

# Colors
YELLOW := \033[1;33m
GREEN := \033[1;32m
RED := \033[1;31m
BLUE := \033[1;34m
RESET := \033[0m

# Targets
.PHONY: all setup setup-first deps clean clean-all dev build package publish check \
        env-setup env-create env-check release-patch release-minor release-major \
        ensure-release-dir help

all: setup build

# Setup commands
setup: deps node_modules env-check_silent
	@echo "$(BLUE)Checking if environment is properly set up...$(RESET)"
	@if [ ! -f .env ]; then \
		echo "$(YELLOW)No .env file found. Creating from template...$(RESET)"; \
		$(MAKE) env-create; \
		echo "$(YELLOW)Please edit the .env file with your settings!$(RESET)"; \
	fi
	@echo "$(GREEN)✓ Setup complete$(RESET)"
	@echo "$(YELLOW)Run 'make env-setup' if you need to configure environment variables$(RESET)"

# Check environment without verbose output (for use in other targets)
env-check_silent:
	@$(NPM) run env:validate > /dev/null 2>&1 || echo "$(YELLOW)⚠ Environment validation failed. Run 'make env-setup' to fix.$(RESET)"

# First-time setup for new developers
setup-first:
	@echo "$(BLUE)Running first-time setup...$(RESET)"
	@$(NPM) run setup

node_modules: package.json
	@echo "$(BLUE)Installing dependencies...$(RESET)"
	@$(NPM) install
	@echo "$(GREEN)✓ Dependencies installed$(RESET)"

# Install ImageMagick if needed
deps:
	@echo "$(BLUE)Checking system dependencies...$(RESET)"
	@if ! command -v node > /dev/null; then \
		echo "$(RED)✗ Node.js is not installed!$(RESET)"; \
		echo "$(YELLOW)Please install Node.js from https://nodejs.org/$(RESET)"; \
		exit 1; \
	else \
		echo "$(GREEN)✓ Node.js is installed$(RESET)"; \
	fi
	@if ! command -v npm > /dev/null; then \
		echo "$(RED)✗ npm is not installed!$(RESET)"; \
		echo "$(YELLOW)Please install npm (it usually comes with Node.js)$(RESET)"; \
		exit 1; \
	else \
		echo "$(GREEN)✓ npm is installed$(RESET)"; \
	fi
ifeq ($(DETECTED_OS),Darwin)
	@echo "$(BLUE)Checking ImageMagick on macOS...$(RESET)"
	@if ! command -v magick > /dev/null && ! command -v convert > /dev/null; then \
		echo "$(YELLOW)Installing ImageMagick via Homebrew...$(RESET)"; \
		brew install imagemagick || echo "$(RED)Failed to install ImageMagick. Please install manually.$(RESET)"; \
	else \
		echo "$(GREEN)✓ ImageMagick is already installed$(RESET)"; \
	fi
else ifeq ($(DETECTED_OS),Linux)
	@echo "$(BLUE)Checking ImageMagick on Linux...$(RESET)"
	@if ! command -v magick > /dev/null && ! command -v convert > /dev/null; then \
		echo "$(YELLOW)Installing ImageMagick...$(RESET)"; \
		if command -v apt-get > /dev/null; then \
			sudo apt-get update && sudo apt-get install -y imagemagick || echo "$(RED)Failed to install ImageMagick. Please install manually.$(RESET)"; \
		elif command -v yum > /dev/null; then \
			sudo yum install -y ImageMagick || echo "$(RED)Failed to install ImageMagick. Please install manually.$(RESET)"; \
		else \
			echo "$(RED)Please install ImageMagick manually$(RESET)"; \
		fi \
	else \
		echo "$(GREEN)✓ ImageMagick is already installed$(RESET)"; \
	fi
else
	@echo "$(YELLOW)Please install ImageMagick manually:$(RESET)"
	@echo "Download from: https://imagemagick.org/script/download.php"
endif
	@echo "$(GREEN)✓ System dependency checks completed$(RESET)"

# Environment setup
env-setup:
	@echo "$(BLUE)Setting up environment variables...$(RESET)"
	@$(NPM) run env:setup

env-create:
	@echo "$(BLUE)Creating .env file from template...$(RESET)"
	@$(NPM) run env:create

env-check:
	@echo "$(BLUE)Validating environment variables...$(RESET)"
	@$(NPM) run env:validate

# Development commands
dev:
	@echo "$(BLUE)Starting development server...$(RESET)"
	@$(NPM) run webpack-watch

# Build commands
build:
	@echo "$(BLUE)Building extension...$(RESET)"
	@$(NPM) run webpack-prod
	@echo "$(GREEN)✓ Build completed$(RESET)"

test:
	@echo "$(BLUE)Running tests...$(RESET)"
	@$(NPM) test

lint:
	@echo "$(BLUE)Linting code...$(RESET)"
	@$(NPM) run lint

# Package and publish
package: ensure-release-dir
	@echo "$(BLUE)Packaging extension...$(RESET)"
	@$(NPM) run package -- --out $(RELEASE_DIR)
	@echo "$(GREEN)✓ Package created in $(RELEASE_DIR) directory$(RESET)"

# Ensure release directory exists
ensure-release-dir:
	@mkdir -p $(RELEASE_DIR)

publish: env-check ensure-release-dir
	@echo "$(BLUE)Publishing extension...$(RESET)"
	@$(NPM) run publish -- --packagePath $(RELEASE_DIR)/*.vsix

# Release commands
release-patch: ensure-release-dir
	@echo "$(BLUE)Creating patch release...$(RESET)"
	@$(NPM) run release:patch -- --out $(RELEASE_DIR)

release-minor: ensure-release-dir
	@echo "$(BLUE)Creating minor release...$(RESET)"
	@$(NPM) run release:minor -- --out $(RELEASE_DIR)

release-major: ensure-release-dir
	@echo "$(BLUE)Creating major release...$(RESET)"
	@$(NPM) run release:major -- --out $(RELEASE_DIR)

# Clean commands
clean:
	@echo "$(BLUE)Cleaning build artifacts...$(RESET)"
	@$(NPM) run clean
	@echo "$(GREEN)✓ Clean completed$(RESET)"

clean-all: clean
	@echo "$(BLUE)Removing node_modules and release directory...$(RESET)"
	@rm -rf node_modules $(RELEASE_DIR)
	@echo "$(GREEN)✓ All cleaned$(RESET)"

# Help
help:
	@echo "$(YELLOW)Markdown Arweave Uploader$(RESET) build commands:"
	@echo ""
	@echo "$(BLUE)Setup:$(RESET)"
	@echo "  $(GREEN)make setup-first$(RESET) - Run first-time setup (recommended for new developers)"
	@echo "  $(GREEN)make setup$(RESET)      - Install dependencies"
	@echo "  $(GREEN)make deps$(RESET)       - Install system dependencies (ImageMagick)"
	@echo "  $(GREEN)make env-setup$(RESET)  - Interactive .env setup"
	@echo "  $(GREEN)make env-create$(RESET) - Create .env from template"
	@echo "  $(GREEN)make env-check$(RESET)  - Validate environment variables"
	@echo ""
	@echo "$(BLUE)Development:$(RESET)"
	@echo "  $(GREEN)make dev$(RESET)        - Start development server with watch mode"
	@echo "  $(GREEN)make build$(RESET)      - Build the extension"
	@echo "  $(GREEN)make test$(RESET)       - Run tests"
	@echo "  $(GREEN)make lint$(RESET)       - Run linter"
	@echo ""
	@echo "$(BLUE)Release:$(RESET)"
	@echo "  $(GREEN)make package$(RESET)      - Create VSIX package in $(RELEASE_DIR) directory"
	@echo "  $(GREEN)make publish$(RESET)      - Publish to VS Code Marketplace"
	@echo "  $(GREEN)make release-patch$(RESET) - Create patch release (0.0.X) in $(RELEASE_DIR) directory"
	@echo "  $(GREEN)make release-minor$(RESET) - Create minor release (0.X.0) in $(RELEASE_DIR) directory"
	@echo "  $(GREEN)make release-major$(RESET) - Create major release (X.0.0) in $(RELEASE_DIR) directory"
	@echo ""
	@echo "$(BLUE)Clean:$(RESET)"
	@echo "  $(GREEN)make clean$(RESET)      - Clean build artifacts"
	@echo "  $(GREEN)make clean-all$(RESET)  - Clean everything including node_modules and $(RELEASE_DIR)"
	@echo ""

# Default target
.DEFAULT_GOAL := help 