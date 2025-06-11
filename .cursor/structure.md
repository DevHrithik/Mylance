# Mylance Project Structure

mylance/
├── README.md
├── next.config.js
├── package.json
├── tailwind.config.js
├── tsconfig.json
├── .cursorrules
├── .env.local
├── .env.example
├── .gitignore
├── admin_development_plan.md # Admin panel development guide
│
├── public/
│ ├── images/
│ ├── icons/
│ └── favicon.ico
│
├── app/
│ ├── globals.css
│ ├── layout.tsx
│ ├── page.tsx (Landing page)
│ ├── loading.tsx
│ ├── error.tsx
│ ├── not-found.tsx
│ │
│ ├── (auth)/
│ │ ├── login/
│ │ │ └── page.tsx
│ │ ├── signup/
│ │ │ └── page.tsx
│ │ ├── magic-link/
│ │ │ └── page.tsx
│ │ ├── callback/
│ │ │ └── page.tsx
│ │ └── layout.tsx
│ │
│ ├── (dashboard)/
│ │ ├── dashboard/
│ │ │ └── page.tsx
│ │ ├── onboarding/
│ │ │ └── page.tsx
│ │ ├── posts/
│ │ │ ├── page.tsx
│ │ │ ├── create/
│ │ │ │ └── page.tsx
│ │ │ ├── [id]/
│ │ │ │ └── page.tsx
│ │ │ └── history/
│ │ │ └── page.tsx
│ │ ├── analytics/
│ │ │ └── page.tsx
│ │ ├── profile/
│ │ │ ├── page.tsx
│ │ │ └── writing-profile/
│ │ │ └── page.tsx
│ │ ├── settings/
│ │ │ └── page.tsx
│ │ ├── billing/
│ │ │ ├── page.tsx
│ │ │ ├── plans/
│ │ │ │ └── page.tsx
│ │ │ └── invoices/
│ │ │ └── page.tsx
│ │ └── layout.tsx
│ │
│ ├── (admin)/ # 🆕 ADMIN PANEL ROUTES
│ │ ├── admin/
│ │ │ ├── page.tsx # Admin dashboard overview
│ │ │ ├── users/
│ │ │ │ ├── page.tsx # User management table
│ │ │ │ └── [id]/
│ │ │ │ ├── page.tsx # User details dashboard
│ │ │ │ ├── prompts/ # User's prompts management
│ │ │ │ │ └── page.tsx
│ │ │ │ ├── edit/ # Edit user profile
│ │ │ │ │ └── page.tsx
│ │ │ │ └── impersonate/ # User impersonation
│ │ │ │ └── page.tsx
│ │ │ ├── prompts/
│ │ │ │ ├── page.tsx # All prompts overview
│ │ │ │ ├── generate/ # Generate new prompts
│ │ │ │ │ └── page.tsx
│ │ │ │ ├── bulk/ # Bulk prompt operations
│ │ │ │ │ └── page.tsx
│ │ │ │ └── [id]/ # Edit individual prompt
│ │ │ │ └── page.tsx
│ │ │ ├── analytics/
│ │ │ │ ├── page.tsx # Platform analytics dashboard
│ │ │ │ ├── users/ # User analytics
│ │ │ │ │ └── page.tsx
│ │ │ │ ├── prompts/ # Prompt performance
│ │ │ │ │ └── page.tsx
│ │ │ │ └── subscriptions/ # Subscription analytics
│ │ │ │ └── page.tsx
│ │ │ ├── feedback/
│ │ │ │ ├── page.tsx # Feedback management
│ │ │ │ └── [id]/ # Individual feedback detail
│ │ │ │ └── page.tsx
│ │ │ └── settings/
│ │ │ ├── page.tsx # Admin settings
│ │ │ ├── permissions/ # Role management
│ │ │ │ └── page.tsx
│ │ │ └── system/ # System configuration
│ │ │ └── page.tsx
│ │ └── layout.tsx # Admin layout wrapper
│ │
│ └── help/
│ ├── page.tsx
│ ├── faq/
│ │ └── page.tsx
│ ├── contact/
│ │ └── page.tsx
│ └── tutorials/
│ └── page.tsx
│
├── components/
│ ├── ui/ (Shadcn/ui components)
│ │ ├── button.tsx
│ │ ├── input.tsx
│ │ ├── textarea.tsx
│ │ ├── card.tsx
│ │ ├── dialog.tsx
│ │ ├── form.tsx
│ │ ├── select.tsx
│ │ ├── table.tsx
│ │ ├── tabs.tsx
│ │ ├── toast.tsx
│ │ ├── progress.tsx
│ │ ├── skeleton.tsx
│ │ └── index.ts
│ │
│ ├── auth/
│ │ ├── LoginForm.tsx
│ │ ├── SignupForm.tsx
│ │ ├── MagicLinkForm.tsx
│ │ ├── SocialLoginButtons.tsx
│ │ └── AuthCallback.tsx
│ │
│ ├── dashboard/
│ │ ├── DashboardHeader.tsx
│ │ ├── StatsOverview.tsx
│ │ ├── RecentPosts.tsx
│ │ ├── QuickActions.tsx
│ │ ├── PerformanceChart.tsx
│ │ └── AIUsageStats.tsx
│ │
│ ├── onboarding/
│ │ ├── OnboardingWizard.tsx
│ │ ├── steps/
│ │ │ ├── PersonalInfo.tsx
│ │ │ ├── BusinessProfile.tsx
│ │ │ ├── ContentGoals.tsx
│ │ │ ├── WritingStyle.tsx
│ │ │ └── FinalSetup.tsx
│ │ ├── ProgressIndicator.tsx
│ │ └── CompletionScreen.tsx
│ │
│ ├── posts/
│ │ ├── PostEditor.tsx
│ │ ├── PostPreview.tsx
│ │ ├── PostList.tsx
│ │ ├── PostCard.tsx
│ │ ├── AIContentGenerator.tsx
│ │ ├── ContentSuggestions.tsx
│ │ ├── ContentPillars.tsx
│ │ └── SchedulePost.tsx
│ │
│ ├── analytics/
│ │ ├── AnalyticsDashboard.tsx
│ │ ├── EngagementChart.tsx
│ │ ├── PerformanceMetrics.tsx
│ │ ├── AILearningProgress.tsx
│ │ └── ContentInsights.tsx
│ │
│ ├── billing/
│ │ ├── SubscriptionPlans.tsx
│ │ ├── PaymentForm.tsx
│ │ ├── InvoiceHistory.tsx
│ │ ├── UsageMetrics.tsx
│ │ └── CancelSubscription.tsx
│ │
│ ├── admin/ # 🆕 ADMIN PANEL COMPONENTS
│ │ ├── layout/
│ │ │ ├── AdminLayout.tsx
│ │ │ ├── AdminSidebar.tsx
│ │ │ ├── AdminHeader.tsx
│ │ │ └── AdminBreadcrumbs.tsx
│ │ ├── dashboard/
│ │ │ ├── AdminOverview.tsx
│ │ │ ├── AdminStatsCards.tsx
│ │ │ └── AdminActivityFeed.tsx
│ │ ├── users/
│ │ │ ├── UserTable.tsx
│ │ │ ├── UserDetailModal.tsx
│ │ │ ├── UserSearch.tsx
│ │ │ ├── UserImpersonation.tsx
│ │ │ ├── ICPEditor.tsx
│ │ │ ├── ContentStrategyEditor.tsx
│ │ │ └── SubscriptionManager.tsx
│ │ ├── prompts/
│ │ │ ├── PromptGenerator.tsx
│ │ │ ├── PromptEditor.tsx
│ │ │ ├── PromptTable.tsx
│ │ │ └── PromptCalendar.tsx
│ │ ├── analytics/
│ │ │ ├── PlatformStats.tsx
│ │ │ ├── UserActivityChart.tsx
│ │ │ ├── SubscriptionTrends.tsx
│ │ │ └── PromptUsageStats.tsx
│ │ ├── feedback/
│ │ │ ├── FeedbackTable.tsx
│ │ │ ├── FeedbackModal.tsx
│ │ │ └── FeedbackStats.tsx
│ │ ├── bulk/
│ │ │ ├── BulkPromptGenerator.tsx
│ │ │ ├── BulkUserOperations.tsx
│ │ │ └── DataExport.tsx
│ │ └── tools/
│ │ ├── SystemHealth.tsx
│ │ ├── AIFeedbackTraining.tsx
│ │ └── ContentCalendarManager.tsx
│ │
│ ├── layout/
│ │ ├── Header.tsx
│ │ ├── Sidebar.tsx
│ │ ├── Footer.tsx
│ │ ├── Navigation.tsx
│ │ ├── MobileMenu.tsx
│ │ └── BreadcrumbNav.tsx
│ │
│ └── common/
│ ├── LoadingSpinner.tsx
│ ├── ErrorBoundary.tsx
│ ├── ConfirmDialog.tsx
│ ├── FileUpload.tsx
│ ├── SearchBar.tsx
│ ├── EmptyState.tsx
│ └── DataTable.tsx
│
├── lib/
│ ├── supabase/
│ │ ├── client.ts (Browser client)
│ │ ├── server.ts (Server client)
│ │ ├── middleware.ts (Auth middleware)
│ │ └── database.types.ts (Generated types)
│ │
│ ├── stripe/
│ │ ├── client.ts
│ │ └── config.ts
│ │
│ ├── admin/ # 🆕 ADMIN LIBRARY
│ │ ├── auth.ts # Admin authentication
│ │ ├── permissions.ts # Role-based access control
│ │ ├── supabase.ts # Admin Supabase MCP integration
│ │ └── impersonation.ts # User impersonation logic
│ │
│ ├── openai/ # 🆕 OPENAI INTEGRATION
│ │ ├── client.ts # OpenAI client setup
│ │ ├── promptGenerator.ts # Prompt generation logic
│ │ ├── prompts.ts # Prompt templates
│ │ └── types.ts # OpenAI types
│ │
│ ├── utils/
│ │ ├── cn.ts (Class name utility)
│ │ ├── format.ts (Date/number formatting)
│ │ ├── validation.ts (Form validation)
│ │ └── constants.ts
│ │
│ └── types/
│ ├── database.ts
│ ├── auth.ts
│ ├── posts.ts
│ ├── billing.ts
│ └── admin.ts # 🆕 Admin types and interfaces
│
├── hooks/
│ ├── useAuth.ts
│ ├── useUser.ts
│ ├── usePosts.ts
│ ├── useAnalytics.ts
│ ├── useSubscription.ts
│ ├── useLocalStorage.ts
│ ├── useDebounce.ts
│ ├── useSupabaseQuery.ts
│ ├── useAdmin.ts # 🆕 Admin-specific hooks
│ └── useOpenAI.ts # 🆕 OpenAI integration hooks
│
├── context/
│ ├── AuthProvider.tsx
│ ├── ThemeProvider.tsx
│ ├── ToastProvider.tsx
│ ├── QueryProvider.tsx
│ └── AdminProvider.tsx # 🆕 Admin context provider
│
├── constants/
│ ├── routes.ts
│ ├── subscription-plans.ts
│ ├── content-types.ts
│ ├── prompts.ts
│ └── admin.ts # 🆕 Admin constants and permissions
│
├── Prompts/ # 🆕 AI PROMPT TEMPLATES
│ ├── admin_prompt.md # 30 prompt generation template
│ └── admin_prompt2.md # 15 additional prompts template
│
├── supabase/ (Supabase project files)
│ ├── functions/ (Edge Functions)
│ │ ├── generate-content/
│ │ │ └── index.ts
│ │ ├── stripe-webhooks/
│ │ │ └── index.ts
│ │ ├── analyze-linkedin/
│ │ │ └── index.ts
│ │ ├── admin-prompt-generation/ # 🆕 Admin prompt generation
│ │ │ └── index.ts
│ │ └── shared/
│ │ ├── cors.ts
│ │ └── auth.ts
│ │
│ ├── migrations/
│ │ ├── 20250531172646_remote_schema.sql
│ │ └── [timestamp]\_admin_panel_setup.sql # 🆕 Admin panel migration
│ │
│ ├── seed.sql
│ └── config.toml
│
├── **tests**/ # 🆕 TESTING STRUCTURE
│ ├── admin/
│ │ ├── auth.test.ts
│ │ ├── permissions.test.ts
│ │ ├── prompt-generation.test.ts
│ │ └── user-management.test.ts
│ └── components/
│ └── admin/
│ ├── AdminLayout.test.tsx
│ ├── UserTable.test.tsx
│ └── PromptGenerator.test.tsx
│
└── docs/
├── SETUP.md
├── DATABASE.md
├── DEPLOYMENT.md
├── API.md
└── ADMIN.md # 🆕 Admin panel documentation

## Key Changes for Admin Panel

### 🆕 New Routes

- `app/(admin)/` - Admin panel route group with protected access
- Admin dashboard, user management, prompt generation, analytics, and feedback management

### 🆕 New Components

- `components/admin/` - Complete admin component library
- Layout components, data tables, forms, and management interfaces

### 🆕 New Libraries

- `lib/admin/` - Admin-specific authentication and permissions
- `lib/openai/` - OpenAI integration for prompt generation
- Supabase MCP integration for all database operations

### 🆕 Database Changes

- New tables: `admin_users`, `content_prompts`, `admin_activity_log`, `user_feedback`
- Enhanced existing tables with admin-required fields

### 🆕 AI Integration

- OpenAI API integration for prompt generation
- Admin prompt templates from `Prompts/` directory
- Automated content generation based on user ICP data

### 🔒 Security Features

- Role-based access control (admin, super_admin)
- Activity logging for all admin actions
- User impersonation with audit trails
- Session management and timeouts

### 📊 Analytics & Monitoring

- Platform-wide analytics dashboard
- User activity and engagement tracking
- Subscription and revenue analytics
- Prompt performance monitoring

This structure maintains the existing user-facing functionality while adding comprehensive admin capabilities for user management, AI-powered prompt generation, and platform monitoring.
