#!/bin/bash

# Environment Configuration Setup Script
# This script helps set up environment configuration for the MeetFlow app

set -e

echo "🚀 MeetFlow Environment Configuration Setup"
echo "============================================="

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "✅ Created .env file. Please update it with your configuration."
else
    echo "⚠️  .env file already exists. Skipping creation."
fi

# Function to setup environment
setup_environment() {
    local env=$1
    echo ""
    echo "🔧 Setting up $env environment..."
    
    # Check if environment file exists
    if [ -f ".env.$env" ]; then
        echo "📋 Copying $env environment configuration..."
        cp ".env.$env" ".env"
        echo "✅ $env environment configured successfully!"
    else
        echo "❌ Environment file .env.$env not found!"
        return 1
    fi
}

# Main setup logic
case "${1:-development}" in
    "development"|"dev")
        setup_environment "development"
        ;;
    "production"|"prod")
        setup_environment "production"
        echo ""
        echo "⚠️  IMPORTANT: Production environment configured!"
        echo "   Make sure to:"
        echo "   - Update API URLs to production endpoints"
        echo "   - Configure proper FCM project ID"
        echo "   - Set up external service keys (Sentry, Google Maps, etc.)"
        ;;
    "staging")
        setup_environment "staging"
        ;;
    "help"|"-h"|"--help")
        echo ""
        echo "Usage: ./setup-env.sh [environment]"
        echo ""
        echo "Available environments:"
        echo "  development, dev    - Setup development environment (default)"
        echo "  staging             - Setup staging environment"
        echo "  production, prod    - Setup production environment"
        echo "  help                - Show this help message"
        echo ""
        echo "Examples:"
        echo "  ./setup-env.sh              # Setup development"
        echo "  ./setup-env.sh production   # Setup production"
        echo ""
        exit 0
        ;;
    *)
        echo "❌ Unknown environment: $1"
        echo "   Run './setup-env.sh help' for available options."
        exit 1
        ;;
esac

echo ""
echo "🎉 Environment setup complete!"
echo ""
echo "📚 Next steps:"
echo "   1. Review and update .env file with your specific values"
echo "   2. Run 'npm start' to start the development server"
echo "   3. Test your configuration with 'npm run validate-env'"
echo ""
echo "🔗 Useful commands:"
echo "   npm run validate-env    - Validate environment configuration"
echo "   npm run env:dev         - Switch to development environment"
echo "   npm run env:prod        - Switch to production environment"