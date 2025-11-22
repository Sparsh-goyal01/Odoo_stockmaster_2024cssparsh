# StockMaster - Inventory Management System

A modern, full-stack inventory management system built with Next.js, TypeScript, Prisma, and MySQL.

## 🚀 Features

- **Authentication**: Email/password login, signup, and OTP-based password reset
- **Dashboard**: Real-time KPIs and inventory overview
- **Products Management**: Create, update, and track products with SKUs and categories
- **Multi-Warehouse Support**: Manage multiple warehouses and storage locations
- **Operations**:
  - Receipts (Incoming Stock)
  - Deliveries (Outgoing Stock)
  - Internal Transfers
  - Inventory Adjustments
  - Stock Move History (Audit Trail)
- **Low Stock Alerts**: Automatic tracking and notifications
- **Reordering Rules**: Set minimum quantities and reorder points

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **MySQL** (v8.0 or higher)

## 🛠️ Installation

### 1. Clone the Repository

```bash
git clone https://github.com/Sparsh-goyal01/Odoo_stockmaster_2024cssparsh.git
cd Odoo_stockmaster_2024cssparsh
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit the `.env` file with your database credentials:

```env
# Database
DATABASE_URL="mysql://USER:PASSWORD@localhost:3306/stockmaster"

# JWT Secret (generate a strong random string)
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

**Important**: Replace `USER` and `PASSWORD` with your MySQL credentials.

### 4. Set Up the Database

Create a MySQL database:

```sql
CREATE DATABASE stockmaster;
```

Generate Prisma client and run migrations:

```bash
npx prisma generate
npx prisma db push
```

This will create all the necessary tables in your database.

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📱 Usage

### First Time Setup

1. **Sign Up**: Create a new account at `/signup`
2. **Login**: Access the system at `/login`
3. **Set Up Warehouses**: Navigate to Settings → Warehouses
4. **Add Locations**: Navigate to Settings → Locations
5. **Create Categories**: Navigate to Settings → Categories
6. **Add Products**: Navigate to Products → Add Product
7. **Start Operations**: Begin managing your inventory!

### Default Credentials

After signup, your account will be created with the `USER` role. The first user should be promoted to admin manually in the database if needed.

## 🗂️ Project Structure

```
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Authentication pages
│   │   ├── (dashboard)/       # Protected dashboard pages
│   │   └── api/               # API routes
│   ├── components/            # React components
│   │   ├── layout/           # Layout components
│   │   └── ui/               # UI components
│   ├── lib/                   # Utilities and configurations
│   │   ├── prisma.ts         # Prisma client
│   │   ├── auth.ts           # Authentication utilities
│   │   ├── jwt.ts            # JWT utilities
│   │   ├── validations.ts    # Zod schemas
│   │   └── utils.ts          # Helper functions
│   └── types/                 # TypeScript type definitions
├── prisma/
│   └── schema.prisma          # Database schema
└── public/                    # Static assets
```

## 🔐 Authentication Flow

1. **Sign Up**: Creates user account with hashed password
2. **Login**: Validates credentials and issues JWT token
3. **Protected Routes**: Middleware validates JWT on each request
4. **Password Reset**:
   - Request OTP via email
   - Enter OTP and new password
   - Password updated securely

## 🗄️ Database Schema

Key models:
- **User**: User accounts and authentication
- **Product**: Product definitions with SKU and categories
- **Warehouse**: Physical storage facilities
- **Location**: Storage locations within warehouses
- **Operation**: Stock operations (receipts, deliveries, etc.)
- **OperationLine**: Line items for operations
- **StockQuant**: Current stock quantities per location
- **StockMove**: Historical record of all stock movements
- **ReorderRule**: Automatic reordering rules

## 📜 Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run start           # Start production server

# Database
npm run prisma:generate # Generate Prisma client
npm run prisma:migrate  # Create and run migrations
npm run prisma:studio   # Open Prisma Studio (DB GUI)
npm run prisma:push     # Push schema to database

# Linting
npm run lint            # Run ESLint
```

## 🚧 Development Roadmap

### Phase 1: Core Setup ✅
- [x] Project initialization
- [x] Authentication system
- [x] Database schema
- [x] Basic UI components
- [x] Dashboard layout

### Phase 2: CRUD Operations (In Progress)
- [ ] Complete Products CRUD with API
- [ ] Complete Warehouses CRUD with API
- [ ] Complete Locations CRUD with API
- [ ] Complete Categories CRUD with API

### Phase 3: Operations
- [ ] Receipt operations
- [ ] Delivery operations
- [ ] Transfer operations
- [ ] Adjustment operations
- [ ] Stock move history with filters

### Phase 4: Advanced Features
- [ ] Real-time KPI calculations
- [ ] Low stock alerts
- [ ] Email notifications for OTP
- [ ] Export to CSV/PDF
- [ ] Advanced search and filters
- [ ] Role-based access control

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👥 Authors

- **Sparsh Goyal** - [Sparsh-goyal01](https://github.com/Sparsh-goyal01)

## 📞 Support

For issues and questions, please open an issue on GitHub.

---

Built with ❤️ using Next.js, TypeScript, Prisma, and MySQL