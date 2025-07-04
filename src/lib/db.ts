/**
 * @fileoverview
 * This file acts as a simulated database. It holds all the mock data
 * for the application and exports functions to retrieve it, mimicking
 * asynchronous database calls. This centralizes data management and
 * makes it easy to swap out for a real database in the future.
 */

import type {
  Product,
  Order,
  Testimonial,
  UserRole,
  AuditLog,
  Delivery,
  DeliveryAgent,
  Job,
  SecurityAlert,
  EmployeeTask,
  HrDocument,
  HrAnnouncement,
  LeaveBalance,
  TeamMember,
  LeaveRequest,
  TeamTask,
  Payroll,
  HrOnboardingTask,
  CartItem,
} from './mock-data';

// --- DATA STORAGE (Simulates Database Tables) ---

const products: Product[] = [
  {
    id: '1',
    name: 'Solitaire Diamond Ring',
    price: 1200,
    description:
      'A timeless classic, this solitaire diamond ring features a brilliant-cut 0.5 carat diamond set in a 14k white gold band. Perfect for engagements or as a statement piece.',
    images: [
      'https://placehold.co/600x600.png',
      'https://placehold.co/600x600.png',
      'https://placehold.co/600x600.png',
    ],
    category: 'Rings',
    rating: 4.9,
    stock: 15,
    modelUrl: '/models/diamond-ring.glb',
    certificateUrl: '/certs/gia-cert-1.pdf',
  },
  {
    id: '2',
    name: 'Emerald Pendant Necklace',
    price: 850,
    description:
      'This stunning necklace showcases a vibrant, pear-shaped emerald surrounded by a halo of sparkling diamonds, suspended from an 18-inch gold chain.',
    images: ['https://placehold.co/600x600.png'],
    category: 'Necklaces',
    rating: 4.8,
    stock: 22,
  },
  {
    id: '3',
    name: 'Sapphire Stud Earrings',
    price: 650,
    description:
      'Elegant and sophisticated, these stud earrings feature deep blue, round-cut sapphires, each set in a four-prong sterling silver setting.',
    images: ['https://placehold.co/600x600.png'],
    category: 'Earrings',
    rating: 4.7,
    stock: 30,
    modelUrl: '/models/earrings.glb',
  },
  {
    id: '4',
    name: 'Gold Bangle Bracelet',
    price: 980,
    description:
      'A solid 18k gold bangle bracelet with a high-polish finish. Its minimalist design makes it versatile for both casual and formal wear.',
    images: ['https://placehold.co/600x600.png'],
    category: 'Bracelets',
    rating: 4.9,
    stock: 12,
  },
  {
    id: '5',
    name: 'Vintage Pearl Choker',
    price: 450,
    description:
      'A beautiful single-strand choker made with genuine freshwater pearls, featuring a vintage-style silver clasp. A touch of classic elegance.',
    images: ['https://placehold.co/600x600.png'],
    category: 'Necklaces',
    rating: 4.6,
    stock: 18,
  },
  {
    id: '6',
    name: 'Ruby Drop Earrings',
    price: 1500,
    description:
      'Make a statement with these breathtaking drop earrings, featuring fiery red rubies dangling from a diamond-encrusted lever-back setting.',
    images: ['https://placehold.co/600x600.png'],
    category: 'Earrings',
    rating: 4.9,
    stock: 9,
    certificateUrl: '/certs/gia-cert-2.pdf',
  },
  {
    id: '7',
    name: "Men's Titanium Band",
    price: 300,
    description:
      'A modern and durable wedding band for men, crafted from lightweight, scratch-resistant titanium with a matte finish.',
    images: ['https://placehold.co/600x600.png'],
    category: 'Rings',
    rating: 4.8,
    stock: 40,
  },
  {
    id: '8',
    name: 'Diamond Tennis Bracelet',
    price: 2500,
    description:
      'An exquisite tennis bracelet featuring a continuous line of brilliant-cut diamonds, totaling 2.0 carats, set in platinum.',
    images: ['https://placehold.co/600x600.png'],
    category: 'Bracelets',
    rating: 5.0,
    stock: 7,
    modelUrl: '/models/bracelet.glb',
    certificateUrl: '/certs/gia-cert-3.pdf',
  },
];

const orders: Order[] = [
  {
    id: 'ORD001',
    customer: {
      name: 'Alice Johnson',
      email: 'alice@example.com',
      avatar: 'https://placehold.co/32x32.png',
    },
    date: '2023-10-26',
    status: 'Delivered',
    total: 1200.0,
  },
  {
    id: 'ORD002',
    customer: {
      name: 'Bob Williams',
      email: 'bob@example.com',
      avatar: 'https://placehold.co/32x32.png',
    },
    date: '2023-10-25',
    status: 'Shipped',
    total: 850.0,
  },
  {
    id: 'ORD003',
    customer: {
      name: 'Charlie Brown',
      email: 'charlie@example.com',
      avatar: 'https://placehold.co/32x32.png',
    },
    date: '2023-10-25',
    status: 'Processing',
    total: 650.0,
  },
  {
    id: 'ORD004',
    customer: {
      name: 'Diana Prince',
      email: 'diana@example.com',
      avatar: 'https://placehold.co/32x32.png',
    },
    date: '2023-10-24',
    status: 'Pending',
    total: 980.0,
  },
  {
    id: 'ORD005',
    customer: {
      name: 'Ethan Hunt',
      email: 'ethan@example.com',
      avatar: 'https://placehold.co/32x32.png',
    },
    date: '2023-10-23',
    status: 'Delivered',
    total: 450.0,
  },
];

const testimonials: Testimonial[] = [
  {
    name: 'Emily Carter',
    avatar: 'https://placehold.co/100x100.png',
    quote:
      "The ring I purchased is absolutely breathtaking. The craftsmanship is top-notch, and it sparkles from every angle. I couldn't be happier!",
  },
  {
    name: 'James Rodriguez',
    avatar: 'https://placehold.co/100x100.png',
    quote:
      'Exceptional service and an even more exceptional product. The necklace I bought for my wife was a huge hit. Thank you, Sparkle!',
  },
  {
    name: 'Sophia Chen',
    avatar: 'https://placehold.co/100x100.png',
    quote:
      "I'm in love with my new bracelet! It's so elegant and delicate. The entire process from browsing to delivery was seamless.",
  },
];

const userRoles: UserRole[] = [
  {
    id: 'USR001',
    name: 'Victoria Sterling',
    email: 'victoria@sparkle.com',
    role: 'Owner',
    permissions: ['All'],
    lastActivity: '5 minutes ago',
    lastLoginIp: '192.168.1.1',
    geo: 'New York, USA',
    riskScore: 2,
  },
  {
    id: 'USR002',
    name: 'Arthur Pendelton',
    email: 'arthur@sparkle.com',
    role: 'Admin',
    permissions: ['Manage Products', 'Manage Orders', 'View Analytics'],
    lastActivity: '2 hours ago',
    lastLoginIp: '203.0.113.24',
    geo: 'London, UK',
    riskScore: 1,
  },
  {
    id: 'USR003',
    name: 'Eleanor Vance',
    email: 'eleanor@sparkle.com',
    role: 'Manager',
    permissions: ['Manage Staff', 'View Store Analytics'],
    lastActivity: '30 minutes ago',
    lastLoginIp: '198.51.100.2',
    geo: 'Paris, France',
    riskScore: 5,
  },
  {
    id: 'USR004',
    name: 'Isla Mae',
    email: 'isla@sparkle.com',
    role: 'Employee',
    permissions: ['Process Orders', 'Update Inventory'],
    lastActivity: '1 hour ago',
    lastLoginIp: '198.51.100.2',
    geo: 'Paris, France',
    riskScore: 8,
  },
];

const auditLogs: AuditLog[] = [
  {
    id: 'LOG001',
    user: 'victoria@sparkle.com',
    action: 'User role updated: Isla Mae to Staff',
    ip: '192.168.1.1',
    timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    status: 'Success',
  },
  {
    id: 'LOG002',
    user: 'arthur@sparkle.com',
    action: 'Product deleted: Gold Bangle Bracelet',
    ip: '203.0.113.24',
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    status: 'Success',
  },
  {
    id: 'LOG003',
    user: 'system@sparkle.com',
    action: 'Failed login attempt for: arthur@sparkle.com',
    ip: '101.45.2.110',
    timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    status: 'Failure',
  },
  {
    id: 'LOG004',
    user: 'eleanor@sparkle.com',
    action: 'Emergency Maintenance Mode Enabled',
    ip: '198.51.100.2',
    timestamp: new Date(Date.now() - 62 * 60 * 1000).toISOString(),
    status: 'Success',
  },
  {
    id: 'LOG005',
    user: 'isla@sparkle.com',
    action: 'Order status updated: ORD003 to Shipped',
    ip: '198.51.100.2',
    timestamp: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
    status: 'Success',
  },
];

const deliveries: Delivery[] = [
  {
    id: 'del-1',
    orderId: 'ORD-JKU-001',
    agentId: 'agent-1',
    status: 'out_for_delivery',
    customer: {
      name: 'Olivia Chen',
      address: '123 Jade St, Metropolis',
      phone: '555-0101',
    },
    otpCode: '123456',
    verified: false,
    lastUpdate: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  },
  {
    id: 'del-2',
    orderId: 'ORD-JKU-002',
    agentId: 'agent-2',
    status: 'assigned',
    customer: {
      name: 'Liam Goldberg',
      address: '456 Ruby Ave, Star City',
      phone: '555-0102',
    },
    otpCode: '654321',
    verified: false,
    lastUpdate: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'del-3',
    orderId: 'ORD-JKU-003',
    agentId: 'agent-1',
    status: 'delivered',
    customer: {
      name: 'Sophia Loren',
      address: '789 Diamond Blvd, Gotham',
      phone: '555-0103',
    },
    otpCode: '987654',
    verified: true,
    lastUpdate: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    proofImageUrl: 'https://placehold.co/600x400.png',
  },
  {
    id: 'del-4',
    orderId: 'ORD-JKU-004',
    agentId: 'agent-2',
    status: 'failed',
    customer: {
      name: 'Noah Patel',
      address: '101 Sapphire Ln, Central City',
      phone: '555-0104',
    },
    otpCode: '456789',
    verified: false,
    lastUpdate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
];

const deliveryAgents: DeliveryAgent[] = [
  { id: 'agent-1', name: 'Alex Ray', phone: '123-456-7890', avatar: 'https://placehold.co/100x100.png' },
  { id: 'agent-2', name: 'Ben Carter', phone: '234-567-8901', avatar: 'https://placehold.co/100x100.png' },
];

const jobs: Job[] = [
  {
    id: 'job-1',
    title: 'Senior Frontend Developer',
    location: 'Remote',
    type: 'Full-time',
    department: 'Engineering',
    description: 'We are looking for an experienced Frontend Developer to join our team. You will be responsible for building the ‘client-side’ of our web applications. You should be able to translate our company and customer needs into functional and appealing interactive applications.',
    requirements: ['5+ years of experience with React & Next.js', 'Strong proficiency in TypeScript, HTML, and CSS', 'Experience with Tailwind CSS and component libraries like ShadCN UI', 'Familiarity with state management libraries'],
  },
  {
    id: 'job-2',
    title: 'Jewelry Designer',
    location: 'New York, NY',
    type: 'Full-time',
    department: 'Design',
    description: 'We are seeking a creative and talented Jewelry Designer to create new and exciting designs for our collections. You will work closely with our production team to bring your visions to life.',
    requirements: ['Proven experience as a Jewelry Designer', 'Strong portfolio of previous work', 'Proficiency in design software (e.g., Rhino, Matrix)', 'Knowledge of materials and manufacturing processes'],
  },
  {
    id: 'job-3',
    title: 'Digital Marketing Manager',
    location: 'Remote',
    type: 'Full-time',
    department: 'Marketing',
    description: 'We are looking for a Digital Marketing Manager to develop, implement, track and optimize our digital marketing campaigns across all digital channels.',
    requirements: ['Proven working experience in digital marketing', 'Demonstrable experience leading and managing SEO/SEM, marketing database, email, social media and/or display advertising campaigns', 'Highly creative with experience in identifying target audiences and devising digital campaigns that engage, inform and motivate'],
  },
];

const securityAlerts: SecurityAlert[] = [
  { id: 1, message: 'Multiple failed login attempts from IP 101.45.2.110', timestamp: '26 minutes ago'},
  { id: 2, message: 'High-risk session detected for user eleanor@sparkle.com', timestamp: '31 minutes ago'},
  { id: 3, message: 'Unusual access time for user isla@sparkle.com', timestamp: '1 hour ago'},
];

const employeeTasks: EmployeeTask[] = [
  { id: 1, title: 'Finalize Q3 sales report', status: 'In Progress', progress: 75 },
  { id: 2, title: 'Respond to customer support tickets', status: 'In Progress', progress: 50 },
  { id: 3, title: 'Prepare for new collection photoshoot', status: 'Not Started', progress: 0 },
  { id: 4, title: 'Complete compliance training module', status: 'Completed', progress: 100 },
];

const hrDocuments: HrDocument[] = [
  { id: 1, title: 'Employee Handbook 2024', date: 'Jan 15, 2024' },
  { id: 2, title: 'Payslip - October 2024', date: 'Nov 1, 2024' },
];

const hrAnnouncements: HrAnnouncement[] = [
  { id: 1, message: 'Annual performance reviews begin next week. Please schedule a meeting with your manager.' },
  { id: 2, message: 'The office will be closed on December 25th for Christmas.' },
  { id: 3, message: 'Reminder: Open enrollment for health insurance ends this Friday.' },
];

const employeeLeaveBalance: LeaveBalance[] = [
  { name: 'Casual', value: 5, color: 'hsl(var(--chart-1))' },
  { name: 'Sick', value: 8, color: 'hsl(var(--chart-2))' },
  { name: 'Earned', value: 12, color: 'hsl(var(--chart-3))' },
];

const teamMembers: TeamMember[] = [
  { id: 'USR004', name: 'Isla Mae', role: 'Jewelry Specialist', status: 'Online', avatar: 'https://placehold.co/100x100.png' },
  { id: 'USR005', name: 'Liam Harris', role: 'Sales Associate', status: 'Offline', avatar: 'https://placehold.co/100x100.png' },
  { id: 'USR006', name: 'Chloe Davis', role: 'Sales Associate', status: 'Online', avatar: 'https://placehold.co/100x100.png' },
  { id: 'USR007', name: 'Ben Carter', role: 'Inventory Manager', status: 'Away', avatar: 'https://placehold.co/100x100.png' },
];

const leaveRequests: LeaveRequest[] = [
  { id: 1, employeeName: 'Liam Harris', type: 'Casual Leave', dateRange: 'Nov 20 - Nov 22', days: 3 },
  { id: 2, employeeName: 'Chloe Davis', type: 'Sick Leave', dateRange: 'Nov 15', days: 1 },
];

const teamTaskData: TeamTask[] = [
  { name: 'Isla', completed: 12, pending: 5 },
  { name: 'Liam', completed: 8, pending: 8 },
  { name: 'Chloe', completed: 15, pending: 2 },
  { name: 'Ben', completed: 10, pending: 3 },
];

const payrollData: Payroll[] = [
  { month: 'May', payout: 112000 },
  { month: 'Jun', payout: 125000 },
  { month: 'Jul', payout: 130000 },
  { month: 'Aug', payout: 128000 },
  { month: 'Sep', payout: 140000 },
  { month: 'Oct', payout: 135000 },
];

const hrOnboardingTasks: HrOnboardingTask[] = [
  { id: 1, task: 'Sign employment contract', completed: true },
  { id: 2, task: 'Complete background check', completed: true },
  { id: 3, task: 'Set up company email and accounts', completed: true },
  { id: 4, task: 'Assign mentor and first project', completed: false },
  { id: 5, task: 'Schedule team introduction meeting', completed: false },
];

const cartItems: CartItem[] = [
  {
      product: products[0],
      quantity: 1,
  },
  {
      product: products[2],
      quantity: 1,
  }
];

// --- DATA ACCESS FUNCTIONS (Simulates API calls) ---

const simulateDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function getProducts(): Promise<Product[]> {
  await simulateDelay(500);
  return products;
}

export async function getProductById(id: string): Promise<Product | undefined> {
  await simulateDelay(300);
  return products.find(p => p.id === id);
}

export async function getOrders(): Promise<Order[]> {
    await simulateDelay(700);
    return orders;
}

export async function getTestimonials(): Promise<Testimonial[]> {
    await simulateDelay(400);
    return testimonials;
}

export async function getUserRoles(): Promise<UserRole[]> {
    await simulateDelay(200);
    return userRoles;
}

export async function getAuditLogs(): Promise<AuditLog[]> {
    await simulateDelay(800);
    return auditLogs;
}

export async function getDeliveries(): Promise<Delivery[]> {
    await simulateDelay(600);
    return deliveries;
}

export async function getDeliveryById(id: string): Promise<Delivery | undefined> {
    await simulateDelay(300);
    return deliveries.find(d => d.id === id);
}

export async function getDeliveryAgents(): Promise<DeliveryAgent[]> {
    await simulateDelay(200);
    return deliveryAgents;
}

export async function getJobs(): Promise<Job[]> {
    await simulateDelay(400);
    return jobs;
}

export async function getJobById(id: string): Promise<Job | undefined> {
    await simulateDelay(250);
    return jobs.find(j => j.id === id);
}

export async function getSecurityAlerts(): Promise<SecurityAlert[]> {
    await simulateDelay(100);
    return securityAlerts;
}

export async function getEmployeeTasks(): Promise<EmployeeTask[]> {
    await simulateDelay(300);
    return employeeTasks;
}

export async function getHrDocuments(): Promise<HrDocument[]> {
    await simulateDelay(200);
    return hrDocuments;
}

export async function getHrAnnouncements(): Promise<HrAnnouncement[]> {
    await simulateDelay(150);
    return hrAnnouncements;
}

export async function getEmployeeLeaveBalance(): Promise<LeaveBalance[]> {
    await simulateDelay(200);
    return employeeLeaveBalance;
}

export async function getTeamMembers(): Promise<TeamMember[]> {
    await simulateDelay(300);
    return teamMembers;
}

export async function getLeaveRequests(): Promise<LeaveRequest[]> {
    await simulateDelay(350);
    return leaveRequests;
}

export async function getTeamTaskData(): Promise<TeamTask[]> {
    await simulateDelay(450);
    return teamTaskData;
}

export async function getPayrollData(): Promise<Payroll[]> {
    await simulateDelay(550);
    return payrollData;
}

export async function getHrOnboardingTasks(): Promise<HrOnboardingTask[]> {
    await simulateDelay(250);
    return hrOnboardingTasks;
}

export function getCartItems(): CartItem[] {
  // This is synchronous because it's typically managed on the client side
  return cartItems;
}
