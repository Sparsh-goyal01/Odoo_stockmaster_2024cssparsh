# StockMaster - Quick Setup Guide

## 🎯 Quick Start (5 minutes)

### Step 1: Install Dependencies ✅ DONE
```bash
npm install
```

### Step 2: Configure Database

1. **Install MySQL** if you haven't already
   - Download from: https://dev.mysql.com/downloads/mysql/
   - Or use Docker: `docker run --name mysql -e MYSQL_ROOT_PASSWORD=password -p 3306:3306 -d mysql:8`

2. **Create the database**:
   ```sql
   CREATE DATABASE stockmaster;
   ```

3. **Update `.env` file**:
   ```env
   DATABASE_URL="mysql://root:password@localhost:3306/stockmaster"
   JWT_SECRET="your-random-secret-key-here"
   ```

### Step 3: Initialize Database

```bash
# Generate Prisma Client (Already done ✅)
npx prisma generate

# Push schema to database
npx prisma db push
```

### Step 4: Start Development Server

```bash
npm run dev
```

Visit: **http://localhost:3000**

---

## 🔧 Database Setup Options

### Option 1: Local MySQL

1. Install MySQL 8.0+
2. Create database: `CREATE DATABASE stockmaster;`
3. Update `.env` with your credentials

### Option 2: MySQL with Docker

```bash
# Start MySQL container
docker run --name stockmaster-mysql \
  -e MYSQL_ROOT_PASSWORD=password \
  -e MYSQL_DATABASE=stockmaster \
  -p 3306:3306 \
  -d mysql:8

# Connection string
DATABASE_URL="mysql://root:password@localhost:3306/stockmaster"
```

### Option 3: Cloud Database (PlanetScale, Railway, etc.)

1. Create a MySQL database on your platform
2. Copy the connection string
3. Update `DATABASE_URL` in `.env`

---

## 📝 First Steps After Setup

### 1. Create Your Account
- Navigate to: http://localhost:3000/signup
- Fill in your details
- You'll be redirected to the dashboard

### 2. Set Up Your Inventory Structure

**a) Create Warehouses** (Settings → Warehouses)
```
Example:
- Main Warehouse (Code: MAIN)
- Distribution Center (Code: DC01)
```

**b) Add Locations** (Settings → Locations)
```
Example for Main Warehouse:
- Receiving Area
- Storage Rack A
- Storage Rack B
- Shipping Area
- Scrap Area
```

**c) Create Categories** (Settings → Categories)
```
Example:
- Raw Materials
- Finished Goods
- Packaging
- Tools & Equipment
```

### 3. Add Products (Products → Add Product)
```
Example:
Name: Steel Rod 10mm
SKU: SR-10MM-001
Category: Raw Materials
Unit: Meters
```

### 4. Start Operations

Now you can:
- ✅ Create **Receipts** for incoming stock
- ✅ Create **Deliveries** for outgoing stock
- ✅ Transfer stock between locations
- ✅ Adjust stock for corrections
- ✅ View complete stock move history

---

## 🎨 UI Preview

The application includes:
- 🔐 **Clean authentication pages** (Login, Signup, Password Reset)
- 📊 **Dashboard with KPI cards**
- 📦 **Product management**
- 🏭 **Warehouse & location management**
- 📋 **Operations management**
- 📈 **Stock move history**

---

## 🔍 Testing the Auth Flow

### Test Signup
1. Go to http://localhost:3000/signup
2. Create account with:
   - Name: Test User
   - Email: test@example.com
   - Password: password123

### Test Login
1. Go to http://localhost:3000/login
2. Login with the credentials above

### Test Password Reset
1. Go to http://localhost:3000/forgot-password
2. Enter your email
3. Check console logs for OTP (in development)
4. Use OTP to reset password at `/reset-password`

---

## 🐛 Troubleshooting

### Database Connection Errors

**Error**: `Can't connect to MySQL server`
- ✅ Check if MySQL is running: `mysql --version`
- ✅ Verify credentials in `.env`
- ✅ Ensure database exists: `SHOW DATABASES;`

**Error**: `Database 'stockmaster' does not exist`
```sql
CREATE DATABASE stockmaster;
```

### Port Already in Use

**Error**: `Port 3000 is already in use`
```bash
# Use a different port
npm run dev -- -p 3001
```

### Prisma Errors

**Error**: `Prisma Client is not generated`
```bash
npx prisma generate
```

**Error**: `Schema drift detected`
```bash
npx prisma db push --force-reset
```

---

## 🚀 Production Deployment

### Environment Variables

Update for production:
```env
DATABASE_URL="your-production-db-url"
JWT_SECRET="strong-random-secret-at-least-32-chars"
NEXT_PUBLIC_APP_URL="https://yourdomain.com"
NODE_ENV="production"
```

### Build and Deploy

```bash
# Build the application
npm run build

# Start production server
npm start
```

### Recommended Platforms
- **Vercel** (recommended for Next.js)
- **Railway** (includes MySQL)
- **DigitalOcean App Platform**
- **AWS / GCP / Azure**

---

## 📚 Next Steps

1. ✅ Set up your database
2. ✅ Run the application
3. ✅ Create your first user
4. ✅ Set up warehouses and locations
5. 🔄 Start building the CRUD APIs (next phase)
6. 🔄 Add real-time KPI calculations
7. 🔄 Implement email sending for OTP

---

## 💡 Development Tips

### Prisma Studio (Database GUI)
```bash
npx prisma studio
```
Opens at: http://localhost:5555

### Hot Reload
Next.js automatically reloads on file changes - no need to restart!

### Database Reset (Development Only!)
```bash
npx prisma db push --force-reset
```
⚠️ **Warning**: This deletes all data!

---

## 📞 Need Help?

- 📖 Check the main README.md
- 🐛 Open an issue on GitHub
- 📧 Contact the maintainer

---

**Happy Coding! 🎉**
