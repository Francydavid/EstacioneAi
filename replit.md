# Overview

EstacioneAI is a comprehensive parking management system that provides real-time parking spot monitoring, reservation capabilities, and administrative dashboard functionality. The application features an interactive map-based interface for visualizing parking lots, real-time availability tracking, and a complete reservation system with email notifications.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript
- **UI Components**: Shadcn/ui component library with Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **State Management**: TanStack React Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Map Integration**: Leaflet.js for interactive map functionality
- **Build Tool**: Vite for development and production builds

## Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Real-time Communication**: WebSocket server for live updates
- **API Design**: RESTful endpoints with real-time WebSocket broadcasting
- **Session Management**: Express sessions with PostgreSQL session store
- **File Structure**: Monorepo structure with shared schema between client and server

## Data Storage
- **Database**: PostgreSQL with Neon serverless driver
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Validation**: Zod schemas for runtime type validation
- **Storage Strategy**: In-memory fallback storage for development with PostgreSQL for production

## Core Data Models
- **Users**: Authentication and user management
- **Parking Lots**: Physical parking locations with geolocation
- **Parking Spots**: Individual parking spaces with status tracking
- **Reservations**: Booking system with time-based availability
- **Contact Messages**: Customer communication system

## Authentication & Authorization
- **Strategy**: Username/password authentication
- **Session Storage**: PostgreSQL-backed session store using connect-pg-simple
- **Security**: Basic session-based authentication without complex role management

## Real-time Features
- **WebSocket Integration**: Live updates for parking spot status changes
- **Broadcast System**: Real-time notifications for reservation updates
- **Client Synchronization**: Automatic query invalidation on real-time events

# External Dependencies

## Core Dependencies
- **Database**: Neon PostgreSQL serverless database
- **Email Service**: SendGrid for transactional emails (reservation confirmations, contact notifications)
- **Maps Service**: OpenStreetMap via Leaflet.js for location visualization
- **UI Framework**: Radix UI primitives for accessible component foundation

## Development Tools
- **Replit Integration**: Development banner and cartographer plugins for Replit environment
- **Build Pipeline**: ESBuild for server bundling, Vite for client bundling
- **Type Checking**: TypeScript compiler for static type analysis

## Third-party Libraries
- **Form Handling**: React Hook Form with Hookform Resolvers
- **Date Manipulation**: date-fns for date formatting and calculations
- **Styling Utilities**: clsx and class-variance-authority for conditional styling
- **WebSocket**: ws library for real-time server communication
- **Validation**: Zod for schema validation across client and server

## Email Templates
- **Transactional Emails**: HTML email templates for reservation confirmations
- **Contact Notifications**: Admin notification system for contact form submissions
- **Error Handling**: Graceful degradation when email service is unavailable