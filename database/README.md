# Meetior Database Architecture & Management

This directory contains the database design artifacts, ER diagrams, and schema definitions for the **Meetior** platform.

## Directory Structure

```
meetior/
├── database/                          # Database documentation and raw schema
│   ├── schema.sql                     # Full MySQL DDL schema definition
│   ├── erd.mmd                        # Mermaid entity-relationship diagram source
│   ├── database-schema.md             # Comprehensive table-by-table schema reference
│   └── database-relationships.md      # Foreign keys, cardinality, and cascade rules
│
└── backend/
    ├── config/
    │   └── database.js                # Sequelize connection pool configuration
    ├── models/                        # 27 Sequelize ORM models
    │   └── index.js                   # Central relationship & association registry
    ├── migrations/                    # Database migration scripts
    │   ├── 001_admin_tables.js
    │   └── 002_super_admin_system.js
    └── seeders/                       # Seed scripts
        └── 002_admin_user.js
```

## Database Management Commands

Run these from `meetior/backend`:

- **Check Connection & Diagnostics**: `npm run check`
- **View Live Database Tables**: `npm run db:view`
- **Seed Sample Events & Images**: `npm run seed`
- **Seed Full Geography (States/Cities)**: `npm run seed:locations`
- **Clean Reset & Seed**: `npm run reset:clean`
