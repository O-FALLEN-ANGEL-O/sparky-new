import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Products
  await prisma.product.createMany({
    data: [
      {
        id: '1',
        name: 'Solitaire Diamond Ring',
        price: 1200,
        description: 'A timeless classic, this solitaire diamond ring features a brilliant-cut 0.5 carat diamond set in a 14k white gold band.',
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
        description: 'This stunning necklace showcases a vibrant, pear-shaped emerald surrounded by a halo of sparkling diamonds.',
        category: 'Necklaces',
        rating: 4.8,
        stock: 22,
      },
      // Add more products as needed
    ],
  });

  // Orders
  await prisma.order.createMany({
    data: [
      {
        id: 'ORD001',
        customerName: 'Alice Johnson',
        customerEmail: 'alice@example.com',
        date: new Date('2023-10-26'),
        status: 'Delivered',
        total: 1200.0,
      },
      {
        id: 'ORD002',
        customerName: 'Bob Williams',
        customerEmail: 'bob@example.com',
        date: new Date('2023-10-25'),
        status: 'Shipped',
        total: 850.0,
      },
      // Add more orders as needed
    ],
  });

  // UserRoles
  await prisma.userRole.createMany({
    data: [
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
      // Add more user roles as needed
    ],
  });

  // Add similar createMany calls for all other models: Delivery, DeliveryAgent, Job, SecurityAlert, EmployeeTask, HrDocument, HrAnnouncement, LeaveBalance, TeamMember, LeaveRequest, TeamTask, Payroll, HrOnboardingTask, CartItem

  // For brevity, only a few models are shown here. You can expand similarly.
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
