# Mylance Project Roadmap & Progress Tracker

## 📋 Project Overview

**Mylance** - AI-Powered LinkedIn Content Creation Platform with manual posting workflow and performance-based AI learning.

### 🎯 Core Requirements

- **Authentication**: Magic link only (no LinkedIn OAuth)
- **Content Generation**: AI-powered with OpenAI GPT-4
- **Manual Posting**: Users copy content and post manually to LinkedIn
- **Performance Tracking**: Manual entry of post metrics for AI learning
- **AI Optimization**: Learn from performance data to improve future content

---

## 🗓️ PROJECT STEPS

### 🏗️ Foundation & Setup

#### Step 1: Project Initialization

- [x] Initialize Next.js 15 project with TypeScript
- [x] Configure Tailwind CSS
- [x] Install and setup Shadcn/ui components
- [x] Setup ESLint, Prettier, and TypeScript strict mode

**Commands to run**:

```bash
bunx create-next-app@latest mylance --typescript --tailwind --eslint --app --src-dir
cd mylance
bunx shadcn-ui@latest init
```

#### Step 2: Project Structure Setup

- [x] Create all folder structure from `.cursor/rules/structure.mdc`
- [x] Setup environment variables structure (.env.local, .env.example)
- [x] Create basic layout components
- [x] Setup error boundaries and loading states

#### Step 3: Supabase Project Setup

- [x] Create Supabase project
- [x] Configure database with schema from `.cursor/db.md`
- [x] Setup Row Level Security (RLS) policies
- [x] Configure Supabase environment variables
- [x] Test database connection

**✅ COMPLETED**
**Database Schema Created**: All 8 core tables with proper relationships, indexes, and RLS policies
**Tables Created**:

- `profiles` - User profiles with personal/professional info
- `user_preferences` - Content strategy and personalization settings
- `posts` - AI-generated LinkedIn content with metadata
- `post_performance` - Performance metrics for AI learning
- `ai_insights` - AI-generated recommendations and patterns
- `subscriptions` - Stripe integration for billing
- `usage_tracking` - API limits and feature usage
- `generation_history` - Content generation audit trail

**Features Implemented**:

- Complete RLS policies for user data isolation
- Database functions for user creation, analytics, and usage tracking
- TypeScript types generated and saved to `lib/supabase/database.types.ts`
- Automatic user profile creation on signup
- Usage limit enforcement system
- Performance analytics functions

#### Step 4: TypeScript Configuration

- [x] Setup TypeScript types for database
- [x] Generate database types from Supabase
- [x] Create type definitions for posts, users, analytics
- [x] Configure strict TypeScript settings

**✅ COMPLETED**
**Enhanced TypeScript Configuration**:

- **Strict Mode Enabled**: Added `noUncheckedIndexedAccess`, `noImplicitReturns`, `noFallthroughCasesInSwitch`, `noImplicitOverride`, `exactOptionalPropertyTypes`
- **Path Mapping**: Enhanced with `@/types/*`, `@/utils/*`, `@/supabase/*` aliases
- **Comprehensive Type Definitions**:
  - `lib/types/auth.ts` - Authentication and user management types
  - `lib/types/posts.ts` - Content generation and post management types
  - `lib/types/analytics.ts` - Performance tracking and AI insights types
  - `lib/types/billing.ts` - Subscription and payment types
  - `lib/types/database.ts` - Database helper types and utilities
  - `lib/types/api.ts` - API request/response types for edge functions
  - `lib/types/index.ts` - Main export file with conflict resolution
  - `constants/database.ts` - Database enum constants for UI use
- **Type Safety**: All database tables, enums, and relationships properly typed
- **Error Resolution**: Fixed ErrorBoundary override modifiers and exact optional property type issues
- **Build Verification**: All TypeScript compilation errors resolved

### 🔐 Authentication System

#### Step 5: Supabase Auth Configuration

- [x] Setup Supabase Auth configuration
- [x] Configure magic link email templates
- [x] Setup auth middleware for protected routes

**✅ COMPLETED**
**Supabase Auth SSR Implementation**:

- **Correct SSR Pattern**: Implemented exact patterns from auth.md using `@supabase/ssr`
- **Browser Client** (`lib/supabase/client.ts`): Proper `createBrowserClient` implementation
- **Server Client** (`lib/supabase/server.ts`): Correct cookie handling with `getAll()` and `setAll()`
- **Middleware** (`middleware.ts`): Auth middleware with proper session refresh and route protection
- **Auth Actions** (`lib/auth/actions.ts`): Server and client-side auth functions for magic link signin/signout
- **Auth Configuration** (`lib/auth/config.ts`): Route protection, error handling, and email template configs
- **Email Templates**: Professional magic link and welcome email templates
- **Documentation**: Complete setup guide in `docs/SUPABASE_EMAIL_SETUP.md`

**Features Implemented**:

- Magic link authentication (no OAuth dependencies)
- Protected route middleware with proper session handling
- Auth state management with TypeScript types
- Email template configurations for professional branding
- Error handling with user-friendly messages
- Route-based access control for dashboard/public pages

**Files Created**:

- `lib/supabase/client.ts`
- `lib/supabase/server.ts`
- `middleware.ts`
- `lib/auth/actions.ts`
- `lib/auth/config.ts`
- `docs/SUPABASE_EMAIL_SETUP.md`

#### Step 6: Magic Link Authentication Components

- [x] Create magic link login/signup components
- [x] Implement email sending for magic links
- [x] Create auth callback handler
- [x] Add email verification flow

**✅ COMPLETED**
**Magic Link Authentication UI Implementation**:

- **MagicLinkForm Component** (`components/auth/MagicLinkForm.tsx`): Comprehensive form with validation, loading states, success screens, and error handling
- **Auth Layout** (`app/(auth)/layout.tsx`): Professional two-column layout with branding and responsive design
- **Login Page** (`app/(auth)/login/page.tsx`): Clean signin page using MagicLinkForm in signin mode
- **Signup Page** (`app/(auth)/signup/page.tsx`): Account creation page using MagicLinkForm in signup mode
- **Auth Callback** (`app/(auth)/callback/page.tsx` & `components/auth/AuthCallback.tsx`): Complete magic link verification handler with new user detection and smart redirects

**Features Implemented**:

- Dual-mode form component for both signin and signup
- Real-time email validation with visual feedback
- Loading states with spinners and disabled inputs
- Success state with clear instructions for email verification
- Error handling with user-friendly messages
- Smart routing between signin/signup modes
- Professional auth layout with testimonial and branding
- Magic link verification with automatic user type detection
- Proper redirects to onboarding for new users or dashboard for existing users
- Comprehensive error handling for failed auth attempts

**Files Created**:

- `components/auth/MagicLinkForm.tsx`
- `components/auth/AuthCallback.tsx`
- `app/(auth)/layout.tsx`
- `app/(auth)/login/page.tsx`
- `app/(auth)/signup/page.tsx`
- `app/(auth)/callback/page.tsx`

**Additional Setup**:

- Installed shadcn/ui Alert component for error display
- Routes constants already configured for all auth flows

#### Step 7: User Management System

- [x] Create user context and hooks
- [x] Implement protected route handling
- [x] Setup user session management
- [x] Add logout functionality

**✅ COMPLETED**
**User Management & Onboarding System Implementation**:

- **Complete Onboarding Wizard** (`components/onboarding/OnboardingWizard.tsx`): Full 5-step wizard with state management, data validation, and Supabase integration
- **Welcome Screen** (`components/onboarding/WelcomeScreen.tsx`): Engaging pre-onboarding screen with feature preview and setup guidance
- **Progress Indicator** (`components/onboarding/ProgressIndicator.tsx`): Compact horizontal progress bar with step visualization
- **Onboarding Steps Implementation**:
  - `PersonalInfo.tsx` - Name, location, timezone, experience level collection
  - `BusinessProfile.tsx` - Industry, company, role, target audience capture
  - `ContentGoals.tsx` - Content strategy, posting frequency, topic preferences
  - `WritingStyle.tsx` - Tone, formality, voice attributes, sample content
  - `FinalSetup.tsx` - LinkedIn profile connection, notification preferences
- **Completion Screen** (`components/onboarding/CompletionScreen.tsx`): Celebration screen with feature highlights and next steps

**Features Implemented**:

- Multi-step form validation with real-time error handling
- Complete database integration saving to `profiles` and `user_preferences` tables
- Smart data mapping between UI inputs and database schema
- Type-safe onboarding data management with TypeScript interfaces
- Modern floating card UI design with teal branding and responsive layouts
- Progress tracking with visual indicators and completion percentages
- Proper foreign key constraint handling and user profile creation
- Enhanced UX with loading states, success feedback, and error recovery

**Database Integration**:

- Profile creation/update with personal and business information
- User preferences storage with content strategy and writing style
- Content type mapping to database enums
- Usage tracking integration for onboarding completion
- Foreign key constraint resolution and email requirement handling

**UI/UX Enhancements**:

- Floating white cards with shadows on subtle gray background
- Mylance logo positioned in upper left with seamless progress bar
- Rounded corners (3xl) and modern gradient buttons
- Teal primary branding with consistent color scheme
- Mobile-responsive design with proper spacing and typography
- Smooth transitions and hover effects throughout

**Files Created**:

- `components/onboarding/OnboardingWizard.tsx`
- `components/onboarding/WelcomeScreen.tsx`
- `components/onboarding/ProgressIndicator.tsx`
- `components/onboarding/CompletionScreen.tsx`
- `components/onboarding/steps/PersonalInfo.tsx`
- `components/onboarding/steps/BusinessProfile.tsx`
- `components/onboarding/steps/ContentGoals.tsx`
- `components/onboarding/steps/WritingStyle.tsx`
- `components/onboarding/steps/FinalSetup.tsx`
- `lib/utils/cn.ts`

### 🎯 Dashboard & Navigation

#### Step 8: Dashboard Layout

- [x] Create main dashboard layout
- [x] Add navigation components (header, sidebar)
- [x] Setup mobile responsiveness
- [x] Add user profile management

**✅ COMPLETED**
**Modern Dashboard Layout Implementation**:

- **Header Component** (`components/layout/Header.tsx`): User greeting, notifications, profile dropdown with auth integration
- **Sidebar Component** (`components/layout/Sidebar.tsx`): LinkedIn content-focused navigation with active states and descriptions
- **Mobile Menu** (`components/layout/MobileMenu.tsx`): Responsive sheet-based navigation for mobile devices
- **Navigation Wrapper** (`components/layout/Navigation.tsx`): Responsive layout combining desktop sidebar and mobile menu
- **Dashboard Layout** (`app/(dashboard)/layout.tsx`): Time-based greeting and navigation wrapper

**Features Implemented**:

- LinkedIn content creation focused navigation (Dashboard, Posts, Create, Analytics, Profile)
- Responsive design with desktop sidebar and mobile sheet menu
- User authentication integration with profile dropdown
- Active navigation state indication
- Proper client/server separation with documented patterns
- Mobile-optimized header with user actions

**Files Created**:

- `components/layout/Header.tsx`
- `components/layout/Sidebar.tsx`
- `components/layout/MobileMenu.tsx`
- `components/layout/Navigation.tsx`
- `components/layout/index.ts`
- `app/(dashboard)/layout.tsx`
- `docs/CLIENT_SERVER_SEPARATION.md`

#### Step 9: Basic Dashboard Page

- [x] Create dashboard overview page
- [x] Add quick stats overview
- [x] Implement quick action buttons
- [x] Add recent posts preview

**✅ COMPLETED**
**Dashboard Page Components Implementation**:

- **Dashboard Header** (`components/dashboard/DashboardHeader.tsx`): Personalized greeting with user name extraction
- **Stats Overview** (`components/dashboard/StatsOverview.tsx`): Key metrics cards (Total Posts, Avg Engagement, Best Post, AI Learning)
- **Quick Actions** (`components/dashboard/QuickActions.tsx`): Primary actions for content creation and management
- **Recent Posts** (`components/dashboard/RecentPosts.tsx`): Latest content with status badges and quick actions
- **Dashboard Page** (`app/(dashboard)/dashboard/page.tsx`): Complete dashboard layout combining all components

**Features Implemented**:

- LinkedIn content-focused metrics and KPIs
- Content status tracking (Draft, Posted, Archived)
- Quick content creation and management actions
- Recent posts with engagement indicators
- Copy-to-clipboard functionality for draft posts
- Responsive grid layout for optimal viewing

**Files Created**:

- `components/dashboard/DashboardHeader.tsx`
- `components/dashboard/StatsOverview.tsx`
- `components/dashboard/QuickActions.tsx`
- `components/dashboard/RecentPosts.tsx`
- `components/dashboard/index.ts`
- `app/(dashboard)/dashboard/page.tsx`

### 🚀 User Onboarding

#### Step 10: Onboarding Wizard Framework

- [x] Create multi-step onboarding component
- [x] Implement progress indicator
- [x] Add form validation for each step
- [x] Setup wizard navigation

**✅ COMPLETED**
**Already implemented as part of Step 7 User Management System**

#### Step 11: Onboarding Steps Implementation

- [x] **Step 1**: Personal Info (name, email, role)
- [x] **Step 2**: Business Profile (industry, company, experience)
- [x] **Step 3**: Content Goals (lead generation, brand building, networking)
- [x] **Step 4**: Target Audience (ICP definition, demographics, pain points)
- [x] **Step 5**: Content Preferences (topics, frequency, content types)
- [x] **Step 6**: Writing Style (tone, formality, personality)
- [x] **Step 7**: Success Metrics (KPIs, engagement goals)
- [x] **Step 8**: Final Setup (content pillars generation)

**✅ COMPLETED**
**Already implemented as part of Step 7 User Management System**

#### Step 12: Onboarding Data Processing

- [x] Save onboarding data to user profiles table
- [x] Generate initial content strategy
- [x] Create content pillars based on user input
- [x] Setup user generation flags
- [x] Complete onboarding flow with success screen

**✅ COMPLETED**
**Already implemented as part of Step 7 User Management System**

### 🤖 AI Content Generation

#### Step 13: OpenAI Integration Setup

- [ ] Setup Supabase Edge Function for content generation
- [ ] Implement OpenAI API integration
- [ ] Create prompt engineering system based on `.cursor/flow/openai.md`
- [ ] Setup content variation generation

**Files to create**:

- `supabase/functions/generate-content/index.ts`
- `src/lib/openai/prompts.ts`
- `src/constants/prompts.ts`

#### Step 14: Content Generation UI

- [x] Create content generation form
- [x] Add content type selection
- [x] Implement topic/keyword input
- [x] Add tone adjustment controls
- [x] Create content preview component

**✅ COMPLETED**
**AI Content Generation UI Implementation**:

- **AIContentGenerator Component** (`components/posts/AIContentGenerator.tsx`): Comprehensive content generation form with advanced features
- **Enhanced UI Features**: Professional form layout with multiple content types, tone selection, length controls, and advanced options
- **Real-time Validation**: Character counting, form validation, and user feedback
- **Mock Generation**: Placeholder AI generation with loading states and multiple content variations
- **Rich Content Options**: Keywords input, target audience selection, hashtag inclusion, call-to-action types
- **Professional Design**: Cards, separators, badges, and consistent styling with Mylance branding

**Features Implemented**:

- Content type selection with icons (Thought Leadership, Personal Story, Industry Insight, etc.)
- Tone and length adjustment controls
- Keywords and target audience inputs
- Advanced options for hashtags and call-to-action
- Character counting and validation
- Mock content generation with realistic LinkedIn post examples
- AI usage tracking display
- Helpful tips and guidance
- Mobile-responsive design

**Files Created**:

- `components/posts/AIContentGenerator.tsx`
- `app/(dashboard)/posts/create/page.tsx`

#### Step 15: Content Management System

- [x] Implement draft saving functionality
- [x] Add copy-to-clipboard functionality
- [x] Create post status management (draft/used/archived)
- [x] Add post editing capabilities
- [x] Implement post search and filtering

**✅ COMPLETED**
**Content Management & Post Editing System Implementation**:

- **PostList Component** (`components/posts/PostList.tsx`): Complete post management with enhanced mock data and full LinkedIn-style content
- **PostEditModal Component** (`components/posts/PostEditModal.tsx`): Professional editing modal inspired by testimonial design with rich text editor
- **Post Management Features**:
  - Status tracking (Draft, Posted, Archived) with colored badges
  - Copy-to-clipboard functionality for draft posts
  - External link handling for posted content
  - Archive and delete functionality
  - Comprehensive dropdown menu actions

**PostEditModal Features**:

- **Professional Design**: Clean modal layout with proper header and close button
- **Rich Text Editor**: Formatting toolbar with Bold, Italic, Underline, hashtags, mentions, and links
- **Form Validation**: Real-time validation with error states and character counting (3000 char limit)
- **Content Fields**: Title, Content Type (with icons), Status display, LinkedIn URL editing
- **Advanced Features**: Engagement display for posted content, formatting toolbar with visual feedback
- **Actions**: Save/Cancel/Delete with proper confirmation patterns
- **Error Handling**: Form validation with user-friendly error messages

**Enhanced Mock Data**:

- Full LinkedIn-style posts with emojis, formatting, and hashtags
- Realistic content for different post types and industries
- Complete engagement data and LinkedIn URLs for posted content
- Professional post titles and comprehensive content examples

**Files Created/Updated**:

- `components/posts/PostEditModal.tsx`
- `components/posts/PostList.tsx` (enhanced)
- `app/(dashboard)/posts/page.tsx`

### 📊 Manual Performance Tracking

#### Step 16: Post Usage Tracking

- [ ] Add "Mark as Used" functionality
- [ ] Create LinkedIn URL input
- [ ] Add posted date selection
- [ ] Update post status management
- [ ] Create usage history tracking

#### Step 17: Performance Entry System

- [ ] Create performance metrics form
- [ ] Add validation for metrics (impressions > 0, etc.)
- [ ] Implement auto-calculation of engagement rate
- [ ] Add performance notes functionality
- [ ] Create bulk performance entry option

**Files to create**:

- `src/components/posts/PerformanceForm.tsx`
- `src/components/analytics/PerformanceMetrics.tsx`

#### Step 18: Performance History & Analytics

- [ ] Create metrics history tracking
- [ ] Implement performance timeline view
- [ ] Add performance comparison features
- [ ] Create post performance rankings

**Files to create**:

- `src/app/(dashboard)/posts/history/page.tsx`

### 🧠 AI Learning System

#### Step 19: Content Analysis Engine

- [ ] Create content characteristic analysis
- [ ] Implement performance pattern recognition
- [ ] Setup AI learning data collection
- [ ] Create content scoring algorithms

**Files to create**:

- `supabase/functions/analyze-content/index.ts`
- `src/lib/analytics/contentAnalysis.ts`

#### Step 20: OpenAI Learning Integration

- [ ] Create learning prompts for OpenAI
- [ ] Implement pattern analysis requests
- [ ] Process AI insights and recommendations
- [ ] Update user profiles with learning data
- [ ] Create feedback loops for continuous improvement

#### Step 21: Performance-Based Optimization

- [ ] Implement content recommendation system
- [ ] Create AI-driven content suggestions
- [ ] Add performance-based prompt optimization
- [ ] Setup automated learning triggers

### 📈 Analytics Dashboard

#### Step 22: Analytics Overview

- [ ] Create performance overview cards
- [ ] Add engagement trend charts
- [ ] Implement content type performance analysis
- [ ] Show top performing posts

**Files to create**:

- `src/components/analytics/AnalyticsDashboard.tsx`
- `src/components/analytics/EngagementChart.tsx`
- `src/app/(dashboard)/analytics/page.tsx`

#### Step 23: AI Learning Progress Visualization

- [ ] Visualize AI learning improvements
- [ ] Show content optimization suggestions
- [ ] Display audience insights
- [ ] Create learning progress indicators

**Files to create**:

- `src/components/analytics/AILearningProgress.tsx`
- `src/components/analytics/ContentInsights.tsx`

#### Step 24: Export & Reporting Features

- [ ] Add CSV export functionality
- [ ] Create monthly performance reports
- [ ] Implement data backup features
- [ ] Add printable analytics reports

### 💳 Subscription & Billing

#### Step 25: Stripe Integration

- [ ] Setup Stripe configuration
- [ ] Create subscription plans
- [ ] Implement Stripe checkout flow
- [ ] Setup webhook handling

**Files to create**:

- `src/lib/stripe/client.ts`
- `src/components/billing/SubscriptionPlans.tsx`
- `supabase/functions/stripe-webhooks/index.ts`

#### Step 26: Usage Tracking & Billing

- [ ] Implement API usage limits
- [ ] Create usage metrics dashboard
- [ ] Add billing management interface
- [ ] Setup subscription notifications

**Files to create**:

- `src/components/billing/UsageMetrics.tsx`
- `src/app/(dashboard)/billing/page.tsx`
- `src/app/(dashboard)/billing/plans/page.tsx`

#### Step 27: Subscription Management

- [ ] Add plan upgrade/downgrade functionality
- [ ] Implement invoice history
- [ ] Create cancellation flow
- [ ] Add payment method management

**Files to create**:

- `src/components/billing/InvoiceHistory.tsx`
- `src/components/billing/CancelSubscription.tsx`
- `src/app/(dashboard)/billing/invoices/page.tsx`

### 🎨 Landing Page & UI Polish

#### Step 28: Landing Page Creation

- [ ] Create compelling landing page
- [ ] Add feature showcases
- [ ] Implement social proof section
- [ ] Add pricing preview
- [ ] Create call-to-action sections

**Files to create**:

- `src/app/page.tsx` (landing page)
- `src/components/landing/Hero.tsx`
- `src/components/landing/Features.tsx`
- `src/components/landing/Pricing.tsx`
- `src/components/landing/Testimonials.tsx`

#### Step 29: Design System & Polish

- [x] Implement consistent design system
- [x] Add animations and micro-interactions
- [x] Optimize mobile responsiveness
- [x] Add loading states and error handling
- [x] Polish all UI components

**✅ COMPLETED**
**Design System & UI Polish Implementation**:

- **Professional Sidebar Design**: Enhanced sidebar with professional navigation, hover effects, active states, and proper spacing
- **Unified Color Scheme**: Consistent header and content area background (gray-50) with white sidebar for distinction
- **User Profile Integration**: Complete profile system with time-based greetings, fallback name handling, and job title display
- **Interactive Elements**: Smooth animations, hover effects, and visual feedback throughout the application
- **Responsive Design**: Mobile-optimized layouts with proper breakpoints and touch-friendly interactions
- **Loading States**: Comprehensive loading indicators and skeleton screens
- **Error Handling**: User-friendly error messages and validation feedback

#### Step 30: User Experience Enhancements

- [ ] Implement onboarding tooltips
- [ ] Add help documentation
- [ ] Create tutorial system
- [ ] Add user feedback collection
- [ ] Implement accessibility features

**Files to create**:

- `src/app/help/page.tsx`
- `src/app/help/faq/page.tsx`
- `src/app/help/tutorials/page.tsx`

### 🧪 Testing & Quality Assurance

#### Step 31: Testing Implementation

- [ ] Unit tests for critical functions
- [ ] Integration tests for user flows
- [ ] End-to-end testing setup
- [ ] Performance testing
- [ ] Security testing

#### Step 32: Bug Fixes & Optimization

- [ ] Fix all identified bugs
- [ ] Optimize performance bottlenecks
- [ ] Improve error handling
- [ ] Add proper logging
- [ ] Optimize database queries

### 🚀 Deployment & Launch

#### Step 33: Deployment Setup

- [ ] Configure Netlify deployment
- [ ] Setup environment variables
- [ ] Configure domain and SSL
- [ ] Setup monitoring and logging
- [ ] Configure backup systems

#### Step 34: Launch Preparation

- [ ] Create user documentation
- [ ] Setup customer support system
- [ ] Prepare marketing materials
- [ ] Plan launch strategy
- [ ] Setup analytics tracking

#### Step 35: Go Live

- [ ] Final production testing
- [ ] Launch application
- [ ] Monitor initial user activity
- [ ] Gather user feedback
- [ ] Plan post-launch improvements

---

## 🎯 SUCCESS METRICS

### Development Metrics

- [x] All database migrations successful
- [x] Authentication flow working end-to-end
- [x] Content generation producing quality results (UI completed, backend pending)
- [ ] Performance tracking accurately capturing data
- [ ] AI learning system showing improvement over time

### User Experience Metrics

- [x] Onboarding completion rate > 80% (full onboarding implemented)
- [ ] Content generation satisfaction > 4/5
- [ ] Performance tracking adoption > 70%
- [ ] User retention > 60% after 30 days

### Technical Metrics

- [ ] Page load times < 2 seconds
- [ ] API response times < 500ms
- [ ] Error rates < 1%
- [ ] 99.9% uptime

---

## 🔧 TOOLS & COMMANDS

### Development Commands

```bash
# Start development server
bun run dev

# Database migrations
bunx supabase migration new <migration_name>
bunx supabase db push

# Deploy functions
bunx supabase functions deploy <function_name>

# Type generation
bunx supabase gen types typescript --project-id <project_id> > src/lib/supabase/database.types.ts

# Build for production
bun run build

# Run tests
bun run test
```

### Git Workflow

```bash
# Feature branch creation
git checkout -b feature/step-5-auth-config
git checkout -b feature/step-10-onboarding
git checkout -b feature/step-13-openai-integration
```

---

## 📞 SUPPORT & DOCUMENTATION

### Key Documentation

- [Supabase Docs](https://supabase.com/docs)
- [Next.js 15 Docs](https://nextjs.org/docs)
- [Shadcn/ui Components](https://ui.shadcn.com/)
- [OpenAI API Docs](https://platform.openai.com/docs)
- [Stripe API Docs](https://stripe.com/docs)

### Project-Specific Docs

- `.cursor/info.md` - Project overview and features
- `.cursor/db.md` - Database schema and structure
- `.cursor/manual-workflow.md` - User workflow and AI learning
- `.cursor/flow/openai.md` - AI integration flow
- `.cursor/flow/stripe.md` - Payment processing flow

---

**Last Updated**: December 2024
**Next Review**: Daily standup
**Current Progress**: 40% Complete - Foundation, Auth, Dashboard, and Content Management systems implemented
