# Supabase Setup & Database Migration

This directory contains the database migration schema to connect your corporate Identity Directory and Access Requests manager with a real, live Supabase PostgreSQL backend.

## Structure

- `migrations/20260623000000_init_schema.sql`: Contains the complete, enterprise-ready database schema including:
  - **Departments**: Seeds default business units (Engineering, Finance, HR, Operations, Marketing).
  - **System Applications**: Seeds central system assets (AWS, PostgreSQL, Sharepoint, VPN, Slack, SAP).
  - **Profiles**: Central employee roster linked dynamically to `auth.users` via foreign keys and PostgreSQL database triggers.
  - **Access Requests**: Standardizing multi-role security models with priority fields, justification, start/end dates, attachments (JSONB), and credential structures.
  - **Notifications & Audit Logs**: High-performance logging tables for corporate compliance tracking.
  - **Row Level Security (RLS) & Security Policies**:
    - Complete protection against arbitrary modifications.
    - Owners can only manage their own requests.
    - Managers can only view/approve requests from their own departments.
    - IT Admins & Super Admins get central management keys to approve, complete, or reject requests globally.

## How to Apply

### Option A: Via Supabase Dashboard (Recommended)

1. Open your project in the [Supabase Dashboard](https://supabase.com).
2. Navigate to the **SQL Editor** in the left sidebar.
3. Click **New Query**.
4. Copy the entire content of `migrations/20260623000000_init_schema.sql` and paste it into the SQL Editor.
5. Click **Run**. All tables, constraints, functions, RLS policies, and default seeds will be deployed immediately.

### Option B: Via Supabase CLI

If you manage your project using the Supabase local development toolchain:

```bash
# Link your project (if not already linked)
supabase link --project-ref kbqlhumzcfenjumhaznf

# Deploy the migrations immediately
supabase db push
```

## Configuring Federated Auth Providers

To complete the Single Sign-On (SSO) or federated social auth setup for Google or Apple logins shown in the app:

1. In the Supabase Dashboard, go to **Authentication** > **Providers**.
2. Select **Google** or **Apple** and toggle **Enabled**.
3. Fill in your **Client ID** and **Client Secret** (retrieved from Google Cloud Console or Apple Developer Center).
4. Save changes. Users can now securely sign in using their external corporate emails!
