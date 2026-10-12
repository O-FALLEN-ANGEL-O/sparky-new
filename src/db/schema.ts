/**
 * Sparkle database schema (PostgreSQL, Drizzle ORM).
 * Money is stored as whole rupees (integers). Razorpay amounts are rupees × 100.
 */
import { relations, sql } from 'drizzle-orm';
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  real,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';

// ------------------------------------------------------------------ enums

export const roleEnum = pgEnum('role', [
  'customer',
  'owner',
  'admin',
  'manager',
  'hr',
  'employee',
  'shareholder',
  'delivery_agent',
]);
export const jewelTypeEnum = pgEnum('jewel_type', ['ring', 'necklace', 'earrings', 'bracelet', 'bangle', 'pendant']);
export const metalEnum = pgEnum('metal', ['yellow_gold', 'rose_gold', 'white_gold', 'platinum', 'silver']);
export const gemEnum = pgEnum('gem', ['diamond', 'emerald', 'ruby', 'sapphire', 'pearl', 'none']);
/** The shape the 3D engine builds for a product (see src/components/three/designs.ts). */
export const designEnum = pgEnum('design', [
  'solitaire', 'cocktail', 'halo', 'band', 'eternity',
  'temple', 'riviere', 'pearl_strand', 'drop_necklace',
  'heart', 'medallion', 'teardrop', 'evil_eye',
  'chandbali', 'stud', 'jhumka', 'drop_earring',
  'tennis', 'link', 'charm',
  'kangan', 'kada', 'studded_bangle', 'oxidised_bangle',
]);
export const orderStatusEnum = pgEnum('order_status', [
  'pending_payment',
  'confirmed',
  'processing',
  'out_for_delivery',
  'delivered',
  'cancelled',
]);
export const paymentMethodEnum = pgEnum('payment_method', ['cod', 'razorpay']);
export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'paid', 'failed', 'refunded']);
export const deliveryStatusEnum = pgEnum('delivery_status', [
  'pending',
  'assigned',
  'accepted',
  'out_for_delivery',
  'delivered',
  'failed',
]);
export const stockReasonEnum = pgEnum('stock_reason', ['sale', 'restock', 'adjustment', 'return', 'cancellation']);
export const taskStatusEnum = pgEnum('task_status', ['todo', 'in_progress', 'done']);
export const priorityEnum = pgEnum('priority', ['low', 'medium', 'high']);
export const leaveTypeEnum = pgEnum('leave_type', ['casual', 'sick', 'earned', 'unpaid']);
export const leaveStatusEnum = pgEnum('leave_status', ['pending', 'approved', 'rejected', 'cancelled']);
export const jobTypeEnum = pgEnum('job_type', ['full_time', 'part_time', 'contract', 'internship']);
export const applicationStatusEnum = pgEnum('application_status', [
  'new',
  'reviewing',
  'interview',
  'offer',
  'hired',
  'rejected',
]);
export const payrollStatusEnum = pgEnum('payroll_status', ['draft', 'processed']);

const created = () => timestamp('created_at', { withTimezone: true }).notNull().defaultNow();
const updated = () => timestamp('updated_at', { withTimezone: true }).notNull().defaultNow();

// ------------------------------------------------------------- identity

export const users = pgTable(
  'users',
  {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 120 }).notNull(),
    email: varchar('email', { length: 200 }).notNull(),
    phone: varchar('phone', { length: 20 }),
    passwordHash: text('password_hash').notNull(),
    role: roleEnum('role').notNull().default('customer'),
    active: boolean('active').notNull().default(true),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
    lastLoginIp: varchar('last_login_ip', { length: 64 }),
    createdAt: created(),
  },
  (t) => [uniqueIndex('users_email_idx').on(sql`lower(${t.email})`)],
);

export const sessions = pgTable(
  'sessions',
  {
    id: varchar('id', { length: 64 }).primaryKey(), // sha256 of the cookie token
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    ip: varchar('ip', { length: 64 }),
    userAgent: text('user_agent'),
    createdAt: created(),
    lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('sessions_user_idx').on(t.userId)],
);

/** Staff details. One row per non-customer user. */
export const employees = pgTable('employees', {
  userId: integer('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  employeeCode: varchar('employee_code', { length: 20 }).notNull().unique(),
  department: varchar('department', { length: 80 }).notNull(),
  title: varchar('title', { length: 120 }).notNull(),
  managerId: integer('manager_id').references(() => users.id, { onDelete: 'set null' }),
  joinDate: date('join_date').notNull(),
  monthlySalary: integer('monthly_salary').notNull().default(0),
  location: varchar('location', { length: 80 }),
});

export const addresses = pgTable('addresses', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 120 }).notNull(),
  phone: varchar('phone', { length: 20 }).notNull(),
  line1: varchar('line1', { length: 200 }).notNull(),
  line2: varchar('line2', { length: 200 }),
  city: varchar('city', { length: 80 }).notNull(),
  state: varchar('state', { length: 80 }).notNull(),
  pincode: varchar('pincode', { length: 10 }).notNull(),
  isDefault: boolean('is_default').notNull().default(false),
});

// --------------------------------------------------------------- catalog

export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  slug: varchar('slug', { length: 80 }).notNull().unique(),
  name: varchar('name', { length: 80 }).notNull(),
  description: text('description').notNull().default(''),
  jewelType: jewelTypeEnum('jewel_type').notNull(),
  sort: integer('sort').notNull().default(0),
});

export const products = pgTable(
  'products',
  {
    id: serial('id').primaryKey(),
    slug: varchar('slug', { length: 140 }).notNull().unique(),
    name: varchar('name', { length: 140 }).notNull(),
    description: text('description').notNull(),
    categoryId: integer('category_id')
      .notNull()
      .references(() => categories.id),
    price: integer('price').notNull(),
    compareAtPrice: integer('compare_at_price'),
    jewelType: jewelTypeEnum('jewel_type').notNull(),
    metal: metalEnum('metal').notNull(),
    gem: gemEnum('gem').notNull().default('none'),
    design: designEnum('design').notNull(),
    purity: varchar('purity', { length: 20 }).notNull(), // 22K, 18K, 950, 925
    weightGrams: real('weight_grams').notNull(),
    caratWeight: real('carat_weight'),
    images: jsonb('images').$type<string[]>().notNull().default([]),
    stock: integer('stock').notNull().default(0),
    lowStockThreshold: integer('low_stock_threshold').notNull().default(5),
    rating: real('rating').notNull().default(0),
    reviewCount: integer('review_count').notNull().default(0),
    featured: boolean('featured').notNull().default(false),
    active: boolean('active').notNull().default(true),
    certificateNo: varchar('certificate_no', { length: 40 }),
    createdAt: created(),
    updatedAt: updated(),
  },
  (t) => [index('products_category_idx').on(t.categoryId)],
);

export const inventoryMovements = pgTable(
  'inventory_movements',
  {
    id: serial('id').primaryKey(),
    productId: integer('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    change: integer('change').notNull(),
    stockAfter: integer('stock_after').notNull(),
    reason: stockReasonEnum('reason').notNull(),
    note: text('note'),
    userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
    orderId: integer('order_id'),
    createdAt: created(),
  },
  (t) => [index('inv_product_idx').on(t.productId)],
);

export const wishlist = pgTable(
  'wishlist',
  {
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    productId: integer('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    createdAt: created(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.productId] })],
);

export const cartItems = pgTable(
  'cart_items',
  {
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    productId: integer('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    quantity: integer('quantity').notNull(),
    updatedAt: updated(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.productId] })],
);

// ---------------------------------------------------------------- orders

export interface ShippingAddress {
  name: string
  phone: string
  line1: string
  line2?: string | null
  city: string
  state: string
  pincode: string
}

export const orders = pgTable(
  'orders',
  {
    id: serial('id').primaryKey(),
    number: varchar('number', { length: 20 }).notNull().unique(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
    status: orderStatusEnum('status').notNull().default('pending_payment'),
    paymentMethod: paymentMethodEnum('payment_method').notNull(),
    paymentStatus: paymentStatusEnum('payment_status').notNull().default('pending'),
    razorpayOrderId: varchar('razorpay_order_id', { length: 64 }),
    razorpayPaymentId: varchar('razorpay_payment_id', { length: 64 }),
    subtotal: integer('subtotal').notNull(),
    tax: integer('tax').notNull(),
    shipping: integer('shipping').notNull().default(0),
    total: integer('total').notNull(),
    shippingAddress: jsonb('shipping_address').$type<ShippingAddress>().notNull(),
    notes: text('notes'),
    cancelReason: text('cancel_reason'),
    stockCommitted: boolean('stock_committed').notNull().default(false),
    createdAt: created(),
    updatedAt: updated(),
  },
  (t) => [index('orders_user_idx').on(t.userId), index('orders_created_idx').on(t.createdAt)],
);

export const orderItems = pgTable('order_items', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  productId: integer('product_id').references(() => products.id, { onDelete: 'set null' }),
  name: varchar('name', { length: 140 }).notNull(),
  image: text('image'),
  price: integer('price').notNull(),
  quantity: integer('quantity').notNull(),
});

export const orderEvents = pgTable('order_events', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  status: varchar('status', { length: 40 }).notNull(),
  note: text('note'),
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  createdAt: created(),
});

export const deliveries = pgTable('deliveries', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id')
    .notNull()
    .unique()
    .references(() => orders.id, { onDelete: 'cascade' }),
  agentId: integer('agent_id').references(() => users.id, { onDelete: 'set null' }),
  status: deliveryStatusEnum('status').notNull().default('pending'),
  otp: varchar('otp', { length: 6 }).notNull(),
  otpAttempts: integer('otp_attempts').notNull().default(0),
  note: text('note'),
  assignedAt: timestamp('assigned_at', { withTimezone: true }),
  deliveredAt: timestamp('delivered_at', { withTimezone: true }),
  updatedAt: updated(),
});

// ------------------------------------------------------------ people ops

export const tasks = pgTable('tasks', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  assigneeId: integer('assignee_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  createdById: integer('created_by_id').references(() => users.id, { onDelete: 'set null' }),
  status: taskStatusEnum('status').notNull().default('todo'),
  priority: priorityEnum('priority').notNull().default('medium'),
  progress: integer('progress').notNull().default(0),
  dueDate: date('due_date'),
  createdAt: created(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
});

export const leaveRequests = pgTable('leave_requests', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  type: leaveTypeEnum('type').notNull(),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  days: integer('days').notNull(),
  reason: text('reason').notNull(),
  status: leaveStatusEnum('status').notNull().default('pending'),
  reviewerId: integer('reviewer_id').references(() => users.id, { onDelete: 'set null' }),
  reviewNote: text('review_note'),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  createdAt: created(),
});

export const payrollRuns = pgTable('payroll_runs', {
  id: serial('id').primaryKey(),
  month: varchar('month', { length: 7 }).notNull().unique(), // YYYY-MM
  status: payrollStatusEnum('status').notNull().default('draft'),
  totalGross: integer('total_gross').notNull().default(0),
  totalNet: integer('total_net').notNull().default(0),
  processedById: integer('processed_by_id').references(() => users.id, { onDelete: 'set null' }),
  processedAt: timestamp('processed_at', { withTimezone: true }),
  createdAt: created(),
});

export const payslips = pgTable(
  'payslips',
  {
    id: serial('id').primaryKey(),
    runId: integer('run_id')
      .notNull()
      .references(() => payrollRuns.id, { onDelete: 'cascade' }),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    basic: integer('basic').notNull(),
    hra: integer('hra').notNull(),
    allowances: integer('allowances').notNull(),
    gross: integer('gross').notNull(),
    pf: integer('pf').notNull(),
    professionalTax: integer('professional_tax').notNull(),
    tds: integer('tds').notNull(),
    unpaidLeaveDeduction: integer('unpaid_leave_deduction').notNull().default(0),
    net: integer('net').notNull(),
  },
  (t) => [uniqueIndex('payslip_run_user').on(t.runId, t.userId)],
);

export const onboardingTasks = pgTable('onboarding_tasks', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 200 }).notNull(),
  done: boolean('done').notNull().default(false),
  dueDate: date('due_date'),
  sort: integer('sort').notNull().default(0),
  completedAt: timestamp('completed_at', { withTimezone: true }),
});

export const announcements = pgTable('announcements', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 200 }).notNull(),
  body: text('body').notNull(),
  authorId: integer('author_id').references(() => users.id, { onDelete: 'set null' }),
  pinned: boolean('pinned').notNull().default(false),
  createdAt: created(),
});

export const policies = pgTable('policies', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 200 }).notNull(),
  category: varchar('category', { length: 60 }).notNull(),
  body: text('body').notNull(),
  updatedAt: updated(),
});

// ------------------------------------------------------------ recruiting

export const jobs = pgTable('jobs', {
  id: serial('id').primaryKey(),
  slug: varchar('slug', { length: 140 }).notNull().unique(),
  title: varchar('title', { length: 140 }).notNull(),
  department: varchar('department', { length: 80 }).notNull(),
  location: varchar('location', { length: 80 }).notNull(),
  type: jobTypeEnum('type').notNull(),
  description: text('description').notNull(),
  requirements: jsonb('requirements').$type<string[]>().notNull().default([]),
  open: boolean('open').notNull().default(true),
  createdAt: created(),
});

export const applications = pgTable('applications', {
  id: serial('id').primaryKey(),
  jobId: integer('job_id')
    .notNull()
    .references(() => jobs.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 120 }).notNull(),
  email: varchar('email', { length: 200 }).notNull(),
  phone: varchar('phone', { length: 20 }).notNull(),
  portfolioUrl: text('portfolio_url'),
  coverLetter: text('cover_letter').notNull(),
  status: applicationStatusEnum('status').notNull().default('new'),
  notes: text('notes'),
  createdAt: created(),
});

// ---------------------------------------------------------------- system

export const auditLogs = pgTable(
  'audit_logs',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
    actorEmail: varchar('actor_email', { length: 200 }),
    action: varchar('action', { length: 80 }).notNull(),
    entity: varchar('entity', { length: 40 }),
    entityId: varchar('entity_id', { length: 40 }),
    details: text('details'),
    ip: varchar('ip', { length: 64 }),
    success: boolean('success').notNull().default(true),
    createdAt: created(),
  },
  (t) => [index('audit_created_idx').on(t.createdAt), index('audit_action_idx').on(t.action)],
);

export const settings = pgTable('settings', {
  key: varchar('key', { length: 60 }).primaryKey(),
  value: jsonb('value').notNull(),
  updatedAt: updated(),
});

export const subscribers = pgTable('subscribers', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 200 }).notNull().unique(),
  createdAt: created(),
});

// ------------------------------------------------------------- relations

export const usersRelations = relations(users, ({ one, many }) => ({
  employee: one(employees, { fields: [users.id], references: [employees.userId] }),
  orders: many(orders),
  addresses: many(addresses),
}));
export const employeesRelations = relations(employees, ({ one }) => ({
  user: one(users, { fields: [employees.userId], references: [users.id] }),
  manager: one(users, { fields: [employees.managerId], references: [users.id] }),
}));
export const categoriesRelations = relations(categories, ({ many }) => ({ products: many(products) }));
export const productsRelations = relations(products, ({ one }) => ({
  category: one(categories, { fields: [products.categoryId], references: [categories.id] }),
}));
export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, { fields: [orders.userId], references: [users.id] }),
  items: many(orderItems),
  events: many(orderEvents),
  delivery: one(deliveries, { fields: [orders.id], references: [deliveries.orderId] }),
}));
export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  product: one(products, { fields: [orderItems.productId], references: [products.id] }),
}));
export const orderEventsRelations = relations(orderEvents, ({ one }) => ({
  order: one(orders, { fields: [orderEvents.orderId], references: [orders.id] }),
}));
export const deliveriesRelations = relations(deliveries, ({ one }) => ({
  order: one(orders, { fields: [deliveries.orderId], references: [orders.id] }),
  agent: one(users, { fields: [deliveries.agentId], references: [users.id] }),
}));
export const tasksRelations = relations(tasks, ({ one }) => ({
  assignee: one(users, { fields: [tasks.assigneeId], references: [users.id] }),
  createdBy: one(users, { fields: [tasks.createdById], references: [users.id] }),
}));
export const leaveRelations = relations(leaveRequests, ({ one }) => ({
  user: one(users, { fields: [leaveRequests.userId], references: [users.id] }),
  reviewer: one(users, { fields: [leaveRequests.reviewerId], references: [users.id] }),
}));
export const payslipsRelations = relations(payslips, ({ one }) => ({
  run: one(payrollRuns, { fields: [payslips.runId], references: [payrollRuns.id] }),
  user: one(users, { fields: [payslips.userId], references: [users.id] }),
}));
export const payrollRunsRelations = relations(payrollRuns, ({ many }) => ({ payslips: many(payslips) }));
export const jobsRelations = relations(jobs, ({ many }) => ({ applications: many(applications) }));
export const applicationsRelations = relations(applications, ({ one }) => ({
  job: one(jobs, { fields: [applications.jobId], references: [jobs.id] }),
}));
export const inventoryRelations = relations(inventoryMovements, ({ one }) => ({
  product: one(products, { fields: [inventoryMovements.productId], references: [products.id] }),
  user: one(users, { fields: [inventoryMovements.userId], references: [users.id] }),
}));
export const auditRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, { fields: [auditLogs.userId], references: [users.id] }),
}));
