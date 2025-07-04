# **App Name**: JewelKart Ultra

## Core Features:

- List Virtualization: Virtualize large lists/grids to only render visible items, using react-window or react-virtualized.
- Lazy Loading: Implement code splitting and lazy loading for heavy components.
- Skeleton Loaders: Display skeleton screens or shimmer loaders as placeholders for content being lazy-loaded.
- Component Memoization: Utilize memoization to prevent unnecessary re-renders of React components.
- Image Optimization: Optimize images with lazy loading and responsive breakpoints for different devices.
- Efficient State Management: Use a modern state management library for handling the app's state.
- Performance Monitoring: Use performance monitoring tools to identify bottlenecks and measure loading times.
- Frontend Optimization: Enable code splitting and lazy loading for heavy components using React.lazy() and dynamic() imports with fallback loaders.
- Atomic Component Architecture: Organize the UI with atomic component architecture, reusing efficient, stateless components.
- Smooth UI Transitions: Implement Framer Motion for GPU-accelerated, smooth UI transitions.
- Fast-Rendering CSS: Use TailwindCSS for utility-first, fast-rendering CSS that minimizes custom styling overhead.
- Responsive Design: Add responsive breakpoints, lazy="true" props, and image priority hints.
- Intersection Observer: Implement IntersectionObserver to delay rendering off-screen sections (e.g., in a product grid).
- State Management: Use Zustand for local/global UI state to avoid Redux bloat and reduce global re-renders.
- Data Caching: Use React Query (or SWR) for async server data, with built-in caching, revalidation, and background fetch.
- Server-Side Queries: Ensure pagination, search, filters are implemented with server-side queries (offset/limit or cursor-based).
- Input Debouncing: Debounce user inputs and use requestIdleCallback() for non-critical updates.
- Backend Performance: Use Express or NestJS with modular services and DTOs to minimize API payload sizes.
- Response Compression: Compress all responses with gzip or brotli using compression() middleware.
- Redis Caching: Implement Redis caching for expensive or frequently-accessed queries.
- Database Indexing: Index commonly used fields in PostgreSQL and avoid full-table scans.
- API Optimization: Use REST or GraphQL with field-level resolvers that return only required data.
- Background Tasks: Offload non-critical background tasks (image compression, logs, emails) using a queue system (e.g., BullMQ).
- On-Demand Image Loading: Use Next.js Image component or react-lazyload for on-demand image loading.
- Optimized Images: Serve images via Cloudinary in WebP or AVIF formats, auto-compressed, with correct sizes per breakpoint.
- Font Optimization: Load fonts via font-display: swap, preload critical assets using <link rel="preload">.
- Tree Shaking: Enable tree shaking to remove unused code via Webpack/Vite config.
- Bundle Analysis: Add bundle analysis using webpack-bundle-analyzer or next build --analyze.
- CDN Delivery: Serve assets via CDN (Cloudflare, Akamai, or AWS CloudFront).
- Edge Caching: Use Edge caching (Cloudflare workers or Next.js ISR) for page-level caching.
- Docker Deployment: Dockerize the backend and use NGINX with gzip for production deployment.
- Deployment Platforms: Deploy frontend on Vercel, backend on Railway/Render, or self-hosted via Docker on VPS.
- PWA Support: Enable PWA support, background sync, and offline asset caching.
- Error Tracking: Integrate Sentry for runtime error tracking (both frontend and backend).
- Performance Testing: Use Lighthouse or Pagespeed Insights to test real-world performance.
- Responsiveness Logging: Log frontend responsiveness using performance.mark and FPS counters.
- Performance Metrics: Track bundle sizes, hydration time, and time-to-interactive.
- 3D Product Viewer: Built with React Three Fiber + Drei to Load .glb files from model_url; OrbitControls, zoom, rotate, and auto-rotation
- Certificate Viewer: Show certification via embedded PDF viewer (e.g. react-pdf)
- Admin Panel Navigation: Sidebar navigation (dashboard, orders, products, staff, settings)
- Admin Panel Responsiveness: Responsive design with Tailwind breakpoints
- Admin Panel Data Tables: Data tables with pagination, search, and filters (e.g., TanStack Table)
- Admin Panel Modals: Modal forms for adding/editing content
- Admin Panel Roles: Role-based rendering using token claims
- AI Smart Search: Use a tool to perform AI Smart Search: OpenAI Embeddings + Vector DB (e.g. Qdrant)
- WhatsApp Notifications: WhatsApp Notification System via Twilio
- Cloudinary Optimization: Image/model optimization pipeline via Cloudinary presets
- Offline POS Sync: Offline POS Sync (store-side local cache + sync queue)
- Mobile PWA: PWA for mobile store staff
- Authentication System: All endpoints guarded by role middleware with token validation.
- Roles & Permissions: Role Permissions: Customer (Register, login, view products, add to cart, checkout, track orders, view 3D models & certificates), Store Staff (Login, view/update inventory, mark orders as shipped/delivered), Store Admin (Manage inventory, orders, products (images & 3D), view dashboard), Super Admin (Manage all stores, users, roles, full analytics, assign admins/staff)
- Product Management: File uploads to Cloudinary using signed upload tokens
- Order Management: Orders include items[], status, store_id, user_id, total
- Store Management: Store Management (Super Admin Only)
- Inventory Management: Includes low-stock alerts and threshold tracking.
- Dashboard & Analytics: Super Admin Dashboard: Total orders & revenue across India Filter by date, store, SKU Top performing products Store heatmap & revenue map Graphs: Recharts or Chart.js Store Admin Dashboard: Store-level analytics Inventory status Order pipeline (Pending → Shipped → Delivered) Daily/weekly sales report
- E-commerce Features: Implement standard e-commerce features similar to Amazon, including product browsing, detailed product pages, shopping cart, checkout process, user accounts, order tracking, wishlists, customer reviews, and personalized recommendations.

## Style Guidelines:

- Primary color: Vibrant teal (#008080) to represent speed, clarity, and optimization.
- Background color: Light, desaturated teal (#E0F8F8) for a clean and unobtrusive background.
- Accent color: Electric lime (#B0FF00) for highlighting interactive elements.
- Font: 'Inter', a grotesque sans-serif for its modern and neutral look, suitable for both headlines and body text.
- Maintain a modular file structure for improved code maintainability.
- Use smooth, GPU-accelerated UI transitions to avoid performance drops, and signal performance in the app itself.