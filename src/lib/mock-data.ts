/**
 * @fileoverview
 * This file defines the TypeScript types for the application's data models.
 * All mock data has been moved to `src/lib/db.ts` to simulate a database.
 */

export type Product = {
  id: string;
  name: string;
  price: number;
  description: string;
  images: string[];
  category: string;
  rating: number;
  stock: number;
  modelUrl?: string;
  certificateUrl?: string;
};

export type Order = {
  id: string;
  customer: {
    name: string;
    email: string;
    avatar: string;
  };
  date: string;
  status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  total: number;
};

export type CartItem = {
  product: Product;
  quantity: number;
};

export type Testimonial = {
  name: string;
  avatar: string;
  quote: string;
};

export type UserRole = {
    id: string;
    name: string;
    email: string;
    role: 'Owner' | 'Admin' | 'Manager' | 'Staff' | 'HR' | 'Employee' | 'Shareholder';
    permissions: string[];
    lastActivity: string;
    lastLoginIp: string;
    geo: string;
    riskScore: number;
}

export type AuditLog = {
  id: string;
  user: string;
  action: string;
  ip: string;
  timestamp: string;
  status: 'Success' | 'Failure';
};

export type DeliveryStatus =
  | 'pending'
  | 'assigned'
  | 'accepted'
  | 'out_for_delivery'
  | 'delivered'
  | 'failed';

export type DeliveryAgent = {
  id: string;
  name: string;
  phone: string;
  avatar: string;
}

export type Delivery = {
  id: string;
  orderId: string;
  agentId: string;
  status: DeliveryStatus;
  customer: {
    name: string;
    address: string;
    phone: string;
  };
  otpCode: string;
  verified: boolean;
  lastUpdate: string;
  proofImageUrl?: string;
}

export type Job = {
  id: string;
  title: string;
  location: string;
  type: 'Full-time' | 'Part-time' | 'Contract';
  department: string;
  description: string;
  requirements: string[];
};

export type SecurityAlert = {
  id: number;
  message: string;
  timestamp: string;
};

export type EmployeeTask = {
  id: number;
  title: string;
  status: 'In Progress' | 'Not Started' | 'Completed';
  progress: number;
};

export type HrDocument = {
  id: number;
  title: string;
  date: string;
};

export type HrAnnouncement = {
  id: number;
  message: string;
};

export type LeaveBalance = {
  name: string;
  value: number;
  color: string;
};

export type TeamMember = {
  id: string;
  name: string;
  role: string;
  status: 'Online' | 'Offline' | 'Away';
  avatar: string;
};

export type LeaveRequest = {
  id: number;
  employeeName: string;
  type: string;
  dateRange: string;
  days: number;
};

export type TeamTask = {
  name: string;
  completed: number;
  pending: number;
};

export type Payroll = {
  month: string;
  payout: number;
};

export type HrOnboardingTask = {
  id: number;
  task: string;
  completed: boolean;
};
