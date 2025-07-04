# Deployment Instructions for PHP Backend and MySQL Database on InfinityFree

## 1. Set up MySQL Database on InfinityFree

- Log in to your InfinityFree control panel.
- Go to the "MySQL Databases" section.
- Create a new MySQL database and user.
- Note down the database name, username, password, and MySQL host (usually `sqlXXX.epizy.com`).

## 2. Import Database Schema

- Use the InfinityFree phpMyAdmin tool to access your MySQL database.
- Open the `php-backend/db-schema.sql` file.
- Import the SQL file into your MySQL database to create the tables.

## 3. Configure PHP Backend

- Open `php-backend/db.php`.
- Replace the placeholders for database name, username, password, and host with your InfinityFree MySQL credentials.

```php
$host = 'your_mysql_host';
$dbname = 'your_database_name';
$username = 'your_username';
$password = 'your_password';
```

## 4. Upload PHP Backend Files

- Upload all files in the `php-backend/` directory to your InfinityFree hosting account's `htdocs` directory using FTP or the file manager.

## 5. Update Frontend API Calls

- Update your frontend code to fetch data from the PHP backend API endpoints, for example:

```typescript
// Example fetch products
const response = await fetch('https://yourdomain.infinityfreeapp.com/api-products.php');
const products = await response.json();
```

- Replace all calls to the mock database functions with calls to the PHP backend APIs.

## 6. Test Your Application

- Visit your frontend hosted on InfinityFree or your preferred hosting.
- Verify that data is fetched correctly from the PHP backend.
- Check for any errors in the browser console or network tab.

## Notes

- InfinityFree has limitations on PHP execution time and database size; optimize your queries accordingly.
- Secure your PHP backend by adding authentication if needed.
- Consider caching data to reduce database load.

If you need further assistance, feel free to ask.
