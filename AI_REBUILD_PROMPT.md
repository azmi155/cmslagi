# Network Infrastructure Management System - AI Rebuild Prompt

## Project Overview
Create a comprehensive Network Infrastructure Management System for managing network devices (primarily MikroTik routers), users, monitoring, and network topology visualization. This is a full-stack web application with real-time monitoring capabilities.

## Technology Stack

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js 5.x
- **Database**: SQLite with Kysely query builder
- **Authentication**: Express sessions with bcrypt password hashing
- **File Uploads**: Multer for logo/branding management
- **Process Management**: Development with tsx/nodemon for hot reload

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Routing**: React Router DOM v7
- **UI Library**: shadcn/ui components (Radix UI primitives)
- **Styling**: Tailwind CSS with CSS variables for theming
- **Icons**: Lucide React
- **Charts**: Recharts (if needed for data visualization)

### Development Environment
- **Package Manager**: npm
- **Type Checking**: TypeScript strict mode
- **CSS Processing**: PostCSS with Autoprefixer
- **Module System**: ESM (type: "module")

## Core Features Required

### 1. Authentication System
- Login/logout functionality
- Session-based authentication
- Password change capability
- Role-based access (admin/user)
- Default admin account (username: admin, password: admin123)

### 2. Device Management
- Add/edit/delete network devices
- Device types: MikroTik, Ruijie, OLT, Router, Switch, Wireless, Generic
- Device properties: name, type, host/IP, port, username, password
- Online/offline status tracking
- Device synchronization functionality
- Real-time device statistics (CPU, memory, disk, uptime, temperature, voltage)

### 3. User Management
#### Hotspot Users (Wi-Fi Users)
- Create/edit/delete hotspot users
- User properties: username, password, profile, comment, disabled status
- Data usage tracking (bytes in/out, uptime)
- Profile assignment

#### PPPoE Users (Dial-up Users)
- Create/edit/delete PPPoE users
- Additional properties: service, caller_id, contact information (name, phone, WhatsApp)
- Service cost tracking
- WhatsApp integration for contact management

### 4. Profile Management
#### Hotspot Profiles
- Rate limiting configuration
- Session timeout settings
- Shared users limit
- Load profiles from device functionality

#### PPPoE Profiles
- Rate limiting
- Local/remote address pools
- Session timeout configuration
- Load profiles from device functionality

### 5. Network Topology
- Visual network diagram showing device connections
- Interactive node selection with device details
- Network statistics display
- Connection type visualization (WAN, ethernet, wireless)
- Status indicators (online/offline, latency)

### 6. WAN Monitoring
- Add/edit/delete WAN monitors for external connectivity
- Ping monitoring with latency tracking
- Automated ping scheduling (every 2 minutes)
- Ping history storage with automatic cleanup
- Real-time status updates
- Bulk ping operations

### 7. Real-time Monitoring
- System performance metrics (CPU, memory, disk usage)
- Network traffic monitoring
- Device status dashboard
- Active user sessions tracking
- Auto-refresh capabilities

### 8. Notes & Reminders
- Create/edit/delete notes with priority levels
- Task completion tracking
- Due date management
- Priority-based color coding
- Overdue notification indicators

### 9. Branding Management
- Company logo upload/management
- Company information customization
- Color scheme configuration
- Live preview functionality
- File size and type validation

### 10. Dashboard & Overview
- Summary statistics cards
- Real-time clock and calendar
- Device status widgets
- Network performance graphs
- Quick access to critical information

## Database Schema Requirements

Create SQLite database with the following tables:

### Core Tables
1. **admin_users** - System administrators
2. **devices** - Network devices
3. **hotspot_profiles** - Wi-Fi user profiles
4. **pppoe_profiles** - PPPoE user profiles
5. **hotspot_users** - Wi-Fi user accounts
6. **pppoe_users** - PPPoE user accounts
7. **user_sessions** - Active user sessions
8. **branding_settings** - Company branding
9. **notes** - Task/reminder notes
10. **device_stats** - Device performance data
11. **wan_monitors** - WAN monitoring hosts
12. **wan_ping_history** - Ping history records

### Key Relationships
- Foreign key constraints between devices and users/profiles
- Cascade deletion for dependent records
- Proper indexing for performance

## UI/UX Requirements

### Layout & Navigation
- Responsive sidebar navigation
- Mobile-friendly design
- Dark/light theme support via CSS variables
- Consistent shadcn/ui component usage

### Page Structure
1. **Overview/Dashboard** - Main statistics and widgets
2. **Devices** - Device management interface
3. **Topology** - Network visualization
4. **WAN Monitoring** - External connectivity monitoring
5. **Hotspot Users** - Wi-Fi user management
6. **PPPoE Users** - Dial-up user management
7. **Profile Management** - User profile configuration
8. **Monitoring** - Real-time system monitoring
9. **Branding** - Company customization
10. **Settings** - User preferences and system config

### Component Requirements
- Reusable form components with validation
- Data tables with sorting/filtering
- Modal dialogs for CRUD operations
- Progress bars and status indicators
- Interactive charts and graphs
- File upload components
- Color picker interfaces

## Technical Specifications

### API Structure
- RESTful API design
- Proper HTTP status codes
- JSON request/response format
- Error handling with descriptive messages
- Authentication middleware
- File upload endpoints

### Real-time Features
- Periodic data refresh (30-second intervals)
- Background WAN monitoring (2-minute intervals)
- Auto-sync device status
- Live dashboard updates

### Security Features
- Password hashing with bcrypt
- Session-based authentication
- CSRF protection considerations
- File upload validation
- Input sanitization

### Performance Considerations
- Database query optimization
- Efficient data pagination
- Image optimization for uploads
- Lazy loading for large datasets
- Connection pooling if needed

## Development Guidelines

### Code Organization
- Feature-based folder structure
- Separation of concerns (routes, middleware, services)
- TypeScript interfaces for type safety
- Consistent error handling patterns
- Comprehensive logging

### Development Workflow
- Hot reload for development
- Environment-specific configurations
- Proper build process for production
- Static file serving optimization

### Data Management
- Form validation on both client and server
- Optimistic UI updates where appropriate
- Loading states and error boundaries
- Data persistence and recovery

## Deployment Requirements

### Build Process
- Client build to `dist/public`
- Server compilation to `dist/server`
- Environment variable configuration
- Production optimization

### Runtime Environment
- SQLite database initialization
- Default admin user creation
- Automatic WAN monitor setup
- Background service management
- Static file serving

## Sample Data & Initialization

### Default Setup
- Create admin user with default credentials
- Initialize default WAN monitors (Google DNS, Cloudflare DNS)
- Set up default branding settings
- Create sample device types and profiles

### Demo Content
- Sample network devices
- Example user accounts
- Test monitoring configurations
- Sample notes and reminders

## Bonus Features (Optional)

1. **Export/Import** - Configuration backup/restore
2. **Notifications** - Email/SMS alerts for outages
3. **Reporting** - Usage and performance reports
4. **API Documentation** - Interactive API docs
5. **Audit Logging** - User action tracking
6. **Multi-tenancy** - Support for multiple organizations
7. **Mobile App** - React Native companion app

## Success Criteria

The application should:
- Successfully manage network devices and users
- Provide real-time monitoring and status updates
- Offer intuitive network topology visualization
- Support comprehensive WAN monitoring
- Maintain responsive and modern UI/UX
- Handle authentication and authorization properly
- Persist data reliably with proper relationships
- Scale efficiently for typical ISP/network admin usage

## Development Priority

1. **Phase 1**: Authentication, basic device management, database setup
2. **Phase 2**: User management (hotspot/PPPoE), profile management
3. **Phase 3**: Monitoring, WAN tracking, real-time features
4. **Phase 4**: Topology visualization, dashboard widgets
5. **Phase 5**: Branding, notes, advanced features

Build this as a production-ready application with proper error handling, logging, and scalability considerations.
