# StockMaster - Database Setup Fix

## Issue Found
The signup is failing because the database credentials are incorrect.

**Error:** "Authentication failed against database server at `localhost`, the provided database credentials for `root` are not valid."

## Solution

You need to update the `DATABASE_URL` in your `.env` file with the correct MySQL credentials.

### Option 1: Update Credentials
Edit `.env` file and replace the DATABASE_URL with your actual MySQL credentials:

```env
DATABASE_URL="mysql://USERNAME:PASSWORD@localhost:3306/stockmaster"
```

Replace:
- `USERNAME` - Your MySQL username (default: `root`)
- `PASSWORD` - Your actual MySQL password

### Option 2: Common MySQL Default Passwords
Try these common defaults:
- Empty password: `mysql://root@localhost:3306/stockmaster`
- Default XAMPP: `mysql://root@localhost:3306/stockmaster`
- Default WAMP: `mysql://root@localhost:3306/stockmaster`

### Steps to Fix

1. **Find your MySQL password:**
   - XAMPP/WAMP users: Usually no password (empty)
   - Custom installation: The password you set during MySQL setup

2. **Update `.env` file:**
   ```powershell
   notepad .env
   ```
   
3. **Create the database:**
   ```powershell
   mysql -u root -p
   ```
   Then in MySQL:
   ```sql
   CREATE DATABASE IF NOT EXISTS stockmaster;
   EXIT;
   ```

4. **Run Prisma migrations:**
   ```powershell
   npx prisma migrate dev --name init
   ```

5. **Restart the dev server:**
   ```powershell
   npm run dev
   ```

### Quick Test
To test if MySQL is accessible with your credentials:
```powershell
mysql -u root -p
```
Enter your password when prompted.

## Need Help?
If you're still having issues, please share:
1. Are you using XAMPP, WAMP, or standalone MySQL?
2. Did you set a password during MySQL installation?
