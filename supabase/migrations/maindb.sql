-- Unified Identity Directory & Access Requests Database Schema Migration
-- Consolidated: 2026-07-12

-- Ensure UUID extensions are available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

--------------------------------------------------
-- 1. DEPARTMENTS
--------------------------------------------------
CREATE TABLE IF NOT EXISTS public.departments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

-- Seed initial departments
INSERT INTO public.departments (id, name, description) VALUES
  ('dep-dir', 'Director Office', 'Office of the Director-General of ESS'),
  ('dep-deputy', 'Deputy Director Office', 'Deputy Director Office for sector management'),
  ('dep-business', 'Business Statistics', 'Industrial, financial, and trade statistics compilation'),
  ('dep-household', 'Household Statistics', 'Socio-economic, demographic, and household census coordination'),
  ('dep-ict', 'ICT Department', 'Infrastructure, cybersecurity, database, and system operations'),
  ('dep-hr', 'Human Resource', 'Staff recruitment, placement, and employee relations'),
  ('dep-finance', 'Finance', 'Budgeting, accounting, and official payroll operations'),
  ('dep-other', 'Other Departments', 'General regional branches and supportive staff offices')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;


--------------------------------------------------
-- 2. SYSTEM APPLICATIONS
--------------------------------------------------
CREATE TABLE IF NOT EXISTS public.system_applications (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.system_applications ENABLE ROW LEVEL SECURITY;

-- Seed initial system applications
INSERT INTO public.system_applications (id, name, description, category) VALUES
  ('sys-statbank', 'StatBank', 'ESS primary statistical database gateway for public and internal indicators', 'Database'),
  ('sys-vms', 'VMS', 'Visitor and Vehicle Management System tracking ESS facilities', 'Application'),
  ('sys-dashboard', 'Dashboard System', 'Interactive visual reporting dashboard for statistics compilation', 'Application'),
  ('sys-shared', 'Shared Drive Access', 'Central storage for collaborative research, reports, and census letter sheets', 'File Storage'),
  ('sys-survey', 'Survey Management System', 'Configuration, field collection, and verification platform for regional surveys', 'Application'),
  ('sys-db', 'Database Access', 'Direct secure access to internal SQL/PostgreSQL database instances', 'Database'),
  ('sys-email', 'Email Account', 'Official corporate ESS email suite for staff communication', 'Email/Comm'),
  ('sys-other', 'Other Internal Systems', 'Miscellaneous custom utility tools used across ESS regional branches', 'Application')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category;


--------------------------------------------------
-- 3. PROFILES
--------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('User', 'Manager', 'IT Admin', 'Super Admin')) DEFAULT 'User',
  department_id TEXT REFERENCES public.departments(id) ON DELETE SET NULL,
  status TEXT NOT NULL CHECK (status IN ('Active', 'Deactivated')) DEFAULT 'Active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  notification_preferences JSONB NOT NULL DEFAULT '{"onSubmitted": true, "onUnderReview": true, "onApproved": true, "onRejected": true, "onCompleted": true}'::jsonb,
  avatar_url TEXT,
  phone_number TEXT,
  job_title TEXT,
  employee_id TEXT,
  last_login TIMESTAMPTZ
);

-- Create index on email for quick lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;


--------------------------------------------------
-- 4. PROFILE SYNCHRONIZATION TRIGGER (auth.users -> public.profiles)
--------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role, department_id, status, mfa_enabled)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    COALESCE(new.raw_user_meta_data->>'role', 'User'),
    COALESCE(new.raw_user_meta_data->>'department_id', 'dep-other'),
    'Active',
    COALESCE((new.raw_user_meta_data->>'mfa_enabled')::boolean, FALSE)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger definition
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


--------------------------------------------------
-- RLS HELPER FUNCTIONS
--------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('IT Admin', 'Super Admin')
  );
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_manager()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'Manager'
  );
$$ LANGUAGE sql SECURITY DEFINER;


--------------------------------------------------
-- 5. ACCESS REQUESTS
--------------------------------------------------
CREATE TABLE IF NOT EXISTS public.access_requests (
  id TEXT PRIMARY KEY DEFAULT 'req-' || gen_random_uuid()::text,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  user_full_name TEXT NOT NULL,
  department_id TEXT REFERENCES public.departments(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  access_type TEXT NOT NULL CHECK (access_type IN ('Application Access', 'Database Access', 'Folder Access', 'Email Group Access', 'VPN Access', 'Server Access')),
  system_name TEXT NOT NULL,
  justification TEXT NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')),
  start_date DATE NOT NULL,
  end_date DATE,
  status TEXT NOT NULL CHECK (status IN ('Draft', 'Pending', 'Submitted', 'Under Review', 'Approved', 'Rejected', 'Completed', 'Pending Department Approval', 'Pending IT Approval')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  requested_role TEXT,
  manager TEXT,
  current_approver TEXT,
  attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
  comments TEXT,
  comments_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  provisioned_credentials JSONB,
  employee_id TEXT,
  department_manager_id TEXT
);

-- Indexing for performance
CREATE INDEX IF NOT EXISTS idx_requests_user_id ON public.access_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_requests_department ON public.access_requests(department_id);
CREATE INDEX IF NOT EXISTS idx_requests_status ON public.access_requests(status);

-- Enable RLS
ALTER TABLE public.access_requests ENABLE ROW LEVEL SECURITY;


--------------------------------------------------
-- 6. IT SUPPORT TICKETS
--------------------------------------------------
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  user_department_id TEXT REFERENCES public.departments(id) ON DELETE SET NULL,
  user_role TEXT NOT NULL,
  subject TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Login Issue', 'Access Request', 'Account Problem', 'Technical Issue', 'Password Reset', 'Bug Report', 'Other')),
  priority TEXT NOT NULL CHECK (priority IN ('Low', 'Medium', 'High')),
  status TEXT NOT NULL CHECK (status IN ('Open', 'In Progress', 'Resolved', 'Closed')) DEFAULT 'Open',
  description TEXT NOT NULL,
  attachment_name TEXT,
  attachment_size TEXT,
  assigned_to_id TEXT,
  assigned_to_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  comments JSONB NOT NULL DEFAULT '[]'::jsonb,
  activity_logs JSONB NOT NULL DEFAULT '[]'::jsonb
);

-- Indexing for performance
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON public.support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_user_email ON public.support_tickets(user_email);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON public.support_tickets(status);

-- Enable RLS
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;


--------------------------------------------------
-- 7. APP NOTIFICATIONS
--------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
  id TEXT PRIMARY KEY DEFAULT 'nt-' || gen_random_uuid()::text,
  user_email TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  type TEXT NOT NULL CHECK (type IN ('submitted', 'approved', 'rejected', 'granted', 'info_requested', 'security'))
);

-- Indexing for user filter
CREATE INDEX IF NOT EXISTS idx_notifications_email ON public.notifications(user_email);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;


--------------------------------------------------
-- 8. AUDIT LOGS
--------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id TEXT PRIMARY KEY DEFAULT 'log-' || gen_random_uuid()::text,
  user_email TEXT NOT NULL,
  user_role TEXT NOT NULL,
  action TEXT NOT NULL,
  details TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address TEXT,
  device TEXT
);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;


--------------------------------------------------
-- 9. SECURITY POLICIES (RLS)
--------------------------------------------------

-- Departments policies
CREATE POLICY "Allow read access to departments for all authenticated users"
ON public.departments FOR SELECT
TO authenticated
USING (TRUE);

-- System Applications policies
CREATE POLICY "Allow read access to systems for all authenticated users"
ON public.system_applications FOR SELECT
TO authenticated
USING (TRUE);

-- Profiles policies
CREATE POLICY "Allow public profiles read access"
ON public.profiles FOR SELECT
TO public
USING (TRUE);

CREATE POLICY "Allow users to update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow admins full management access to profiles"
ON public.profiles FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Access Requests Policies
CREATE POLICY "Allow public request creation"
ON public.access_requests FOR INSERT
TO public
WITH CHECK (TRUE);

CREATE POLICY "Allow public select request by ID"
ON public.access_requests FOR SELECT
TO public
USING (TRUE);

CREATE POLICY "Allow select requests for owners, department managers, or admins"
ON public.access_requests FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR user_email = (SELECT email FROM public.profiles WHERE id = auth.uid())
  OR (public.is_manager() AND (
    department_id = (SELECT department_id FROM public.profiles WHERE id = auth.uid())
    OR manager = (SELECT full_name FROM public.profiles WHERE id = auth.uid())
    OR current_approver = (SELECT full_name FROM public.profiles WHERE id = auth.uid())
    OR department_manager_id = auth.uid()::text
  ))
  OR public.is_admin()
);

CREATE POLICY "Allow request update for owners, department managers, or admins"
ON public.access_requests FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id
  OR (public.is_manager() AND (
    department_id = (SELECT department_id FROM public.profiles WHERE id = auth.uid())
    OR manager = (SELECT full_name FROM public.profiles WHERE id = auth.uid())
    OR current_approver = (SELECT full_name FROM public.profiles WHERE id = auth.uid())
    OR department_manager_id = auth.uid()::text
  ))
  OR public.is_admin()
);

CREATE POLICY "Allow request deletion for owners of Drafts or admins"
ON public.access_requests FOR DELETE
TO authenticated
USING (
  (auth.uid() = user_id AND status = 'Draft')
  OR public.is_admin();
);

-- IT Support Tickets Policies
CREATE POLICY "Allow users to view their own tickets or admins to view all"
ON public.support_tickets FOR SELECT
TO authenticated
USING (
  user_email = (SELECT email FROM public.profiles WHERE id = auth.uid())
  OR public.is_admin()
);

CREATE POLICY "Allow users to submit new tickets"
ON public.support_tickets FOR INSERT
TO authenticated
WITH CHECK (TRUE);

CREATE POLICY "Allow users to update their own tickets or admins to update all"
ON public.support_tickets FOR UPDATE
TO authenticated
USING (
  user_email = (SELECT email FROM public.profiles WHERE id = auth.uid())
  OR public.is_admin()
)
WITH CHECK (TRUE);

CREATE POLICY "Allow admins to delete tickets"
ON public.support_tickets FOR DELETE
TO authenticated
USING (public.is_admin());

-- Notifications Policies
CREATE POLICY "Allow public notifications creation"
ON public.notifications FOR INSERT
TO public
WITH CHECK (TRUE);

CREATE POLICY "Allow user to view their own notifications"
ON public.notifications FOR SELECT
TO authenticated
USING (user_email = (SELECT email FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Allow user to modify their own notifications status"
ON public.notifications FOR UPDATE
TO authenticated
USING (user_email = (SELECT email FROM public.profiles WHERE id = auth.uid()))
WITH CHECK (user_email = (SELECT email FROM public.profiles WHERE id = auth.uid()));

-- Audit Logs Policies
CREATE POLICY "Allow public audit logs creation"
ON public.audit_logs FOR INSERT
TO public
WITH CHECK (TRUE);

CREATE POLICY "Allow admins to view audit logs"
ON public.audit_logs FOR SELECT
TO authenticated
USING (public.is_admin());


--------------------------------------------------
-- 10. REALTIME REPLICATION CONFIGURATION
--------------------------------------------------
-- Enable real-time replication for our core tables to allow cross-platform live communications
ALTER PUBLICATION supabase_realtime ADD TABLE public.access_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.audit_logs;
