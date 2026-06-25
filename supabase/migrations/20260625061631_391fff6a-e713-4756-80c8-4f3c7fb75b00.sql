
-- Enums
CREATE TYPE public.app_role AS ENUM ('owner', 'counter_staff');
CREATE TYPE public.repair_status AS ENUM ('received', 'in_progress', 'ready', 'delivered');
CREATE TYPE public.repair_priority AS ENUM ('normal', 'urgent');

-- Profiles
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- User roles
CREATE TABLE public.user_roles (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff can view all roles" ON public.user_roles FOR SELECT TO authenticated USING (true);

-- has_role function
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- updated_at helper
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- new user handler
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name', NEW.email);
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'counter_staff')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Job number sequence
CREATE SEQUENCE public.repair_job_seq START 1001;

-- Repairs
CREATE TABLE public.repairs (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  job_number TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  device_brand TEXT NOT NULL,
  device_model TEXT NOT NULL,
  imei TEXT,
  problem_description TEXT NOT NULL,
  quoted_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  status public.repair_status NOT NULL DEFAULT 'received',
  warranty TEXT,
  priority public.repair_priority NOT NULL DEFAULT 'normal',
  condition_notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.repairs TO authenticated;
GRANT ALL ON public.repairs TO service_role;
ALTER TABLE public.repairs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff can view repairs" ON public.repairs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can create repairs" ON public.repairs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Staff can update repairs" ON public.repairs FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Staff can delete repairs" ON public.repairs FOR DELETE TO authenticated USING (true);

CREATE INDEX idx_repairs_phone ON public.repairs (phone_number);
CREATE INDEX idx_repairs_customer ON public.repairs (customer_name);
CREATE INDEX idx_repairs_status ON public.repairs (status);
CREATE INDEX idx_repairs_created_at ON public.repairs (created_at DESC);

CREATE TRIGGER update_repairs_updated_at
BEFORE UPDATE ON public.repairs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Job number generation
CREATE OR REPLACE FUNCTION public.set_repair_job_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.job_number IS NULL OR NEW.job_number = '' THEN
    NEW.job_number := 'RJ-' || to_char(nextval('public.repair_job_seq'), 'FM000000');
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER set_repair_job_number_trigger
BEFORE INSERT ON public.repairs
FOR EACH ROW EXECUTE FUNCTION public.set_repair_job_number();

-- Status history
CREATE TABLE public.repair_status_history (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  repair_id UUID NOT NULL REFERENCES public.repairs(id) ON DELETE CASCADE,
  status public.repair_status NOT NULL,
  note TEXT,
  changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.repair_status_history TO authenticated;
GRANT ALL ON public.repair_status_history TO service_role;
ALTER TABLE public.repair_status_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff can view history" ON public.repair_status_history FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can insert history" ON public.repair_status_history FOR INSERT TO authenticated WITH CHECK (true);

CREATE INDEX idx_history_repair ON public.repair_status_history (repair_id, created_at);

-- Auto log status changes
CREATE OR REPLACE FUNCTION public.log_repair_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO public.repair_status_history (repair_id, status, changed_by, note)
    VALUES (NEW.id, NEW.status, NEW.created_by, 'Repair job created');
  ELSIF (TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status) THEN
    INSERT INTO public.repair_status_history (repair_id, status, changed_by, note)
    VALUES (NEW.id, NEW.status, auth.uid(), 'Status updated');
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER log_repair_status_insert
AFTER INSERT ON public.repairs
FOR EACH ROW EXECUTE FUNCTION public.log_repair_status();
CREATE TRIGGER log_repair_status_update
AFTER UPDATE ON public.repairs
FOR EACH ROW EXECUTE FUNCTION public.log_repair_status();
