# AI-Powered Hotel Property Management System

## Overview

This is a comprehensive SaaS-based Hotel Property Management System (PMS) with AI-powered features including demand forecasting, dynamic pricing, and occupancy optimization. The application serves hotels, resorts, guest houses, serviced apartments, hostels, and B&Bs with a full suite of operational management tools including reservations, front desk operations, housekeeping, room service, revenue management, and guest CRM.

The system is designed as a subscription-based service with license key activation supporting monthly and yearly billing plans through Stripe integration.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System**
- React 18+ with TypeScript for type-safe component development
- Vite as the build tool and development server for fast hot module replacement
- Client-side routing using Wouter for lightweight navigation

**UI Design System**
- Material Design 3 principles adapted for hospitality management
- Shadcn/ui component library built on Radix UI primitives
- Tailwind CSS for utility-first styling with custom design tokens
- Inter font family for typography, Roboto Mono for monospaced content
- Light/dark theme support with CSS custom properties

**State Management**
- TanStack Query (React Query) for server state management and caching
- Query invalidation patterns for optimistic updates
- React hooks for local component state

**Form Handling**
- React Hook Form for performant form management
- Zod validation schemas shared between client and server
- Hookform/resolvers for schema validation integration

### Backend Architecture

**Runtime & Framework**
- Node.js with Express.js REST API
- TypeScript for type safety across the stack
- ESM module system for modern JavaScript features

**API Design**
- RESTful endpoints following resource-based patterns
- CORS configuration for cross-origin requests from frontend
- Express middleware for JSON parsing and request logging
- Session-based authentication state management

**Database Layer**
- PostgreSQL as the primary relational database
- Drizzle ORM for type-safe database operations
- Neon serverless PostgreSQL adapter with WebSocket support
- Connection pooling for efficient database access
- Schema migrations managed through Drizzle Kit

**Authentication & Authorization**
- Replit OIDC (OpenID Connect) integration for user authentication
- Passport.js strategy for OIDC flow management
- Express-session with PostgreSQL session store
- Role-based access control (guest, staff, manager, admin, super_admin)
- Secure session cookies with HTTP-only flag

**Data Model Design**

The schema supports multi-tenancy through property-based isolation:

- **Users & Authentication**: User profiles with role assignments and Stripe customer linking
- **License Management**: Subscription status tracking, license key generation, trial periods
- **Property Hierarchy**: Properties → Room Types → Individual Rooms with inventory tracking
- **Guest Management**: Guest profiles with reservation history and preferences
- **Reservations**: Booking lifecycle from pending to completed with date ranges and pricing
- **Room Service**: Categories, items, and request tracking with status workflow
- **Revenue Management**: Rate plans, AI forecasts, dynamic pricing recommendations
- **Channel Management**: OTA (Online Travel Agency) connection configurations

All entities include audit timestamps (createdAt, updatedAt) for tracking changes.

### External Dependencies

**Payment Processing**
- Stripe integration for subscription billing
- Payment intents for secure card processing
- Webhook handling for subscription lifecycle events
- Support for monthly and yearly billing cycles
- Price IDs configured via environment variables

**AI/ML Services**
- OpenAI API integration (optional feature)
- Used for demand forecasting and pricing optimization
- Revenue predictions and occupancy analysis
- Natural language processing for guest personalization

**Development & Deployment**
- Vercel for frontend static hosting with automatic deployments
- Render for backend API and PostgreSQL database hosting
- Environment-based configuration for development/production
- Blueprint-based deployment using render.yaml

**Third-Party UI Components**
- Radix UI headless component primitives (dialogs, dropdowns, popovers, etc.)
- Lucide React for icon system
- React Day Picker for calendar selection
- Recharts for data visualization
- Vaul for drawer components
- CMDK for command palette

**Build & Development Tools**
- TypeScript compiler for type checking
- ESBuild for server-side bundling
- PostCSS with Autoprefixer for CSS processing
- Drizzle Kit for database schema management

**Session & Security**
- connect-pg-simple for PostgreSQL session storage
- Crypto module for license key generation
- CORS protection with origin whitelisting
- Security headers (X-Content-Type-Options, X-Frame-Options, XSS-Protection)