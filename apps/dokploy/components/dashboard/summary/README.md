# Summary Dashboard Components

This directory contains the modularized summary dashboard components, broken down into smaller, maintainable files for better code organization and reusability.

## 📁 Directory Structure

```
summary/
├── components/           # Reusable UI components
│   ├── welcome-header.tsx
│   ├── dashboard-controls.tsx
│   ├── stat-card.tsx
│   ├── quick-action-button.tsx
│   ├── system-health-card.tsx
│   ├── trend-chart.tsx
│   ├── activity-item.tsx
│   ├── user-action-item.tsx
│   └── index.ts
├── sections/            # Larger section components
│   ├── quick-stats-section.tsx
│   ├── quick-actions-section.tsx
│   ├── resource-usage-section.tsx
│   ├── trends-section.tsx
│   ├── deployments-projects-section.tsx
│   ├── projects-section.tsx
│   ├── recent-activity-section.tsx
│   ├── user-actions-section.tsx
│   └── index.ts
├── hooks/               # Custom React hooks
│   └── use-dashboard-data.ts
├── types.ts            # TypeScript type definitions
├── utils.ts            # Utility functions
├── show.tsx            # Main component (orchestrator)
└── README.md           # This file
```

## 🧩 Components

### Core Components (`components/`)

- **`welcome-header.tsx`** - User welcome section with avatar and notifications
- **`dashboard-controls.tsx`** - Dashboard customization controls and refresh button
- **`stat-card.tsx`** - Reusable statistics card with icons and trends
- **`quick-action-button.tsx`** - Action button component with link support
- **`system-health-card.tsx`** - System health monitoring with progress bars
- **`trend-chart.tsx`** - Reusable trend chart component using Recharts
- **`activity-item.tsx`** - Individual activity/notification item
- **`user-action-item.tsx`** - Individual user action item

### Section Components (`sections/`)

- **`quick-stats-section.tsx`** - Statistics overview section
- **`quick-actions-section.tsx`** - Quick action buttons section
- **`resource-usage-section.tsx`** - System resource monitoring charts
- **`trends-section.tsx`** - Analytics and trends section
- **`deployments-projects-section.tsx`** - Top deployments and active projects
- **`projects-section.tsx`** - All projects listing
- **`recent-activity-section.tsx`** - Recent activity and notifications
- **`user-actions-section.tsx`** - User's recent actions

## 🎣 Hooks

### `use-dashboard-data.ts`

A custom hook that manages all dashboard data including:
- API queries for projects, notifications, user, organization, and metrics
- Local state management for filters and visibility
- Computed values and data transformations
- Event handlers for user interactions
- Session storage persistence for user preferences

## 📝 Types

### `types.ts`

Contains all TypeScript interfaces and types:
- `DashboardCard` - Dashboard card configuration
- `MetricData` - Chart data structure
- `UserAction` - User action item structure
- `Notification` - Notification item structure
- `Project` - Project data structure
- `Deployment` - Deployment data structure
- `Metrics` - System metrics structure
- `CardKey` - Dashboard section keys

## 🛠️ Utils

### `utils.ts`

Utility functions for:
- `formatNumber()` - Number formatting (K, M suffixes)
- `getTimeAgo()` - Relative time formatting
- `getHealthStatus()` - System health status calculation
- `getNotificationIcon()` - Icon selection for notifications

## 🚀 Usage

The main component (`show.tsx`) orchestrates all the smaller components:

```tsx
import { Summary } from "./components/dashboard/summary/show";

// The component automatically handles all data fetching and state management
<Summary />
```

## ✨ Benefits

1. **Modularity** - Each component has a single responsibility
2. **Reusability** - Components can be reused across different parts of the app
3. **Maintainability** - Easier to find and fix issues
4. **Testability** - Smaller components are easier to test
5. **Performance** - Better code splitting and lazy loading opportunities
6. **Type Safety** - Proper TypeScript interfaces for all components
7. **Separation of Concerns** - Data logic separated from UI components

## 🔧 Customization

Each section can be individually toggled on/off using the dashboard controls, and user preferences are persisted in session storage.

## 📊 Features

- Real-time system health monitoring
- Interactive charts and analytics
- Customizable dashboard layout
- Responsive design
- Loading states and error handling
- Accessibility features
- Modern UI with hover effects and animations 