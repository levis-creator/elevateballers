# Documentation

This folder contains all project documentation organized by topic.

## 📚 Documentation Index

### 🚀 Deployment & Operations

- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - How the site is hosted, deployed, monitored and backed up (cPanel + GitHub Actions + Cloudflare + Sentry)

### 🔧 Configuration & Setup

- **[ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md)** - Environment variables documentation
- **[NGROK_SETUP.md](./NGROK_SETUP.md)** - Guide for setting up ngrok tunnel

### 🔐 Permissions (RBAC)

- **[permissions/](./permissions/)** - Role-based access control: setup, seeding and usage guides

### 🗺️ Planning & Design

- **[planning/](./planning/)** - Redesign prompts and the scaling/registration to-do list
- **[design-mockups/](./design-mockups/)** - Standalone HTML design mockups

### 🔄 Migration & Updates

- **[MIGRATION_INSTRUCTIONS.md](./MIGRATION_INSTRUCTIONS.md)** - Database migration instructions
- **[STEP_BY_STEP_MIGRATION.md](./STEP_BY_STEP_MIGRATION.md)** - Step-by-step migration guide

### 🐛 Troubleshooting & Fixes

- **[FIX_INVALID_DATES.md](./FIX_INVALID_DATES.md)** - Guide for fixing invalid dates in database
- **[ADMIN_PORTAL_FIX.md](./ADMIN_PORTAL_FIX.md)** - Fixes for admin portal issues
- **[BUILD_ISSUES_FIX.md](./BUILD_ISSUES_FIX.md)** - Solutions for build issues
- **[FIX_BUILD_ISSUES.md](./FIX_BUILD_ISSUES.md)** - Additional build issue fixes
- **[PRODUCTION_VS_DEV_FIX.md](./PRODUCTION_VS_DEV_FIX.md)** - Fixes for production vs development differences
- **[WHY_LOCAL_DIFFERENT.md](./WHY_LOCAL_DIFFERENT.md)** - Explanation of local vs production differences

### 🏠 Homepage

- **[HOMEPAGE_REVIEW.md](./HOMEPAGE_REVIEW.md)** - Homepage review and analysis
- **[HOMEPAGE_REVIEW_SUMMARY.md](./HOMEPAGE_REVIEW_SUMMARY.md)** - Summary of homepage review
- **[HOMEPAGE_COMPARISON_CHECKLIST.md](./HOMEPAGE_COMPARISON_CHECKLIST.md)** - Checklist for comparing homepage versions
- **[HOMEPAGE_DIFFERENCES_FIX.md](./HOMEPAGE_DIFFERENCES_FIX.md)** - Fixes for homepage differences
- **[QUICK_HOMEPAGE_FIX.md](./QUICK_HOMEPAGE_FIX.md)** - Quick fixes for homepage issues

### 🧪 Testing

- **[QUICK_TEST_GUIDE.md](./QUICK_TEST_GUIDE.md)** - Quick testing guide
- **[TESTING_PRODUCTION.md](./TESTING_PRODUCTION.md)** - Guide for testing in production

### 📝 Development

- **[COMMIT_INSTRUCTIONS.md](./COMMIT_INSTRUCTIONS.md)** - Instructions for committing changes
- **[REFACTORING_SUMMARY.md](./REFACTORING_SUMMARY.md)** - Summary of project refactoring
- **[SHADCN_MIGRATION_SUMMARY.md](./SHADCN_MIGRATION_SUMMARY.md)** - Summary of shadcn migration

## 📖 Quick Links

- **Main README**: [../README.md](../README.md) - Project overview and getting started
- **Feature Documentation**: See `src/features/*/README.md` for feature-specific documentation
- **Prisma Seed**: See `prisma/SEED_README.md` for database seeding instructions

## 🔍 Finding Documentation

- **Deployment questions?** → Read [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Having build issues?** → Check Troubleshooting & Fixes section
- **Setting up environment?** → Check Configuration & Setup section
- **Need to migrate?** → Check Migration & Updates section
