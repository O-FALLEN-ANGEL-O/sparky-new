-- MySQL Database Schema for Sparkly Backend

-- Products Table
CREATE TABLE products (
  id INTEGER PRIMARY KEY,
  name TEXT,
  price REAL,
  description TEXT,
  category TEXT,
  rating REAL,
  stock INTEGER,
  model_url TEXT,
  certificate_url TEXT
);

-- Orders Table
CREATE TABLE orders (
  id INTEGER PRIMARY KEY,
  order_id TEXT UNIQUE,
  customer_name TEXT,
  customer_email TEXT,
  customer_avatar TEXT,
  date TEXT,
  status TEXT,
  total REAL
);

-- User Roles Table
CREATE TABLE user_roles (
  id INTEGER PRIMARY KEY,
  user_id TEXT UNIQUE,
  name TEXT,
  email TEXT,
  role TEXT,
  permissions TEXT,
  last_activity TEXT,
  last_login_ip TEXT,
  geo TEXT,
  risk_score INTEGER
);

-- Audit Logs Table
CREATE TABLE audit_logs (
  id INTEGER PRIMARY KEY,
  log_id TEXT UNIQUE,
  user_email TEXT,
  action TEXT,
  ip TEXT,
  timestamp TEXT,
  status TEXT
);

-- Deliveries Table
CREATE TABLE deliveries (
  id INTEGER PRIMARY KEY,
  delivery_id TEXT UNIQUE,
  order_id TEXT,
  agent_id TEXT,
  status TEXT,
  customer_name TEXT,
  customer_address TEXT,
  customer_phone TEXT,
  otp_code TEXT,
  verified INTEGER,
  last_update TEXT,
  proof_image_url TEXT
);

-- Delivery Agents Table
CREATE TABLE delivery_agents (
  id INTEGER PRIMARY KEY,
  agent_id TEXT UNIQUE,
  name TEXT,
  phone TEXT,
  avatar TEXT
);

-- Jobs Table
CREATE TABLE jobs (
  id INTEGER PRIMARY KEY,
  job_id TEXT UNIQUE,
  title TEXT,
  location TEXT,
  type TEXT,
  department TEXT,
  description TEXT,
  requirements TEXT
);

-- Security Alerts Table
CREATE TABLE security_alerts (
  id INTEGER PRIMARY KEY,
  message TEXT,
  timestamp TEXT
);

-- Employee Tasks Table
CREATE TABLE employee_tasks (
  id INTEGER PRIMARY KEY,
  title TEXT,
  status TEXT,
  progress INTEGER
);

-- HR Documents Table
CREATE TABLE hr_documents (
  id INTEGER PRIMARY KEY,
  title TEXT,
  date TEXT
);

-- HR Announcements Table
CREATE TABLE hr_announcements (
  id INTEGER PRIMARY KEY,
  message TEXT
);

-- Employee Leave Balance Table
CREATE TABLE employee_leave_balance (
  id INTEGER PRIMARY KEY,
  name TEXT,
  value INTEGER,
  color TEXT
);

-- Team Members Table
CREATE TABLE team_members (
  id INTEGER PRIMARY KEY,
  user_id TEXT,
  name TEXT,
  role TEXT,
  status TEXT,
  avatar TEXT
);

-- Leave Requests Table
CREATE TABLE leave_requests (
  id INTEGER PRIMARY KEY,
  employee_name TEXT,
  type TEXT,
  date_range TEXT,
  days INTEGER
);

-- Team Task Data Table
CREATE TABLE team_task_data (
  id INTEGER PRIMARY KEY,
  name TEXT,
  completed INTEGER,
  pending INTEGER
);

-- Payroll Data Table
CREATE TABLE payroll_data (
  id INTEGER PRIMARY KEY,
  month TEXT,
  payout REAL
);

-- HR Onboarding Tasks Table
CREATE TABLE hr_onboarding_tasks (
  id INTEGER PRIMARY KEY,
  task TEXT,
  completed INTEGER
);

-- Cart Items Table
CREATE TABLE cart_items (
  id INTEGER PRIMARY KEY,
  product_id INTEGER,
  quantity INTEGER
);
