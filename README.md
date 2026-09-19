\# E-Commerce Platform



A full-stack e-commerce web application built with React, Node.js, Express, and MySQL.



The platform provides separate customer and admin workflows, including product browsing, shopping cart, wishlist, checkout, order management, inventory management, manual payment verification, OCR-based transaction ID extraction, notifications, coupons, reviews, and analytics.



\## Features



\### Customer Features



\- Customer registration and login

\- JWT-based authentication

\- Customer profile management

\- Product browsing

\- Product details

\- Product categories

\- Product search

\- Product filtering

\- Product sorting

\- Wishlist

\- Shopping cart

\- Address management

\- Coupon application

\- Checkout

\- Order placement

\- Order history

\- Order details

\- Order cancellation

\- Return requests

\- Order status tracking

\- Customer notifications

\- Product reviews

\- Payment status tracking



\### Payment Features



The application does not use an online payment gateway.



Supported payment methods:



\- Cash on Delivery (COD)

\- UPI ID

\- QR Code payment

\- Bank Transfer



For manual payments:



1\. Customer selects UPI, QR, or Bank Transfer.

2\. Customer completes the payment manually.

3\. Customer uploads the payment screenshot.

4\. OCR processes the screenshot.

5\. The system attempts to extract the transaction ID or UTR.

6\. Payment remains pending until admin verification.

7\. Admin reviews the screenshot and extracted transaction details.

8\. Admin approves or rejects the payment.



For COD:



\- Payment starts as pending.

\- Payment becomes successful when the order is delivered.



\## Admin Features



\- Admin authentication

\- Admin dashboard

\- Sales statistics

\- Order statistics

\- Customer management

\- Product management

\- Category management

\- Inventory management

\- Coupon management

\- Review management

\- Order management

\- Order status updates

\- Payment settings

\- Manual payment verification

\- Payment approval and rejection

\- Sales analytics

\- Inventory information

\- Low-stock monitoring

\- Admin notifications



\## Order Lifecycle



Customer orders follow this workflow:



```text

PLACED

&#x20;  ↓

CONFIRMED

&#x20;  ↓

PACKED

&#x20;  ↓

SHIPPED

&#x20;  ↓

OUT\_FOR\_DELIVERY

&#x20;  ↓

DELIVERED





For COD orders:



Order Placed

&#x20;    ↓

Payment PENDING

&#x20;    ↓

Order Delivered

&#x20;    ↓

Payment SUCCESS



For manual payments:



UPI / QR / Bank Transfer

&#x20;         ↓

Payment Screenshot

&#x20;         ↓

OCR Transaction ID / UTR Extraction

&#x20;         ↓

Payment PENDING

&#x20;         ↓

Admin Verification

&#x20;      ↙       ↘

&#x20; APPROVED    REJECTED

&#x20;     ↓           ↓

&#x20;  SUCCESS      FAILED

Technology Stack

Frontend

React

Vite

React Router

Axios

Recharts

QRCode React

Backend

Node.js

Express.js

MySQL2

JWT

bcrypt

Multer

Tesseract.js

CORS

dotenv

Database

MySQL

Development Tools

Visual Studio Code

MySQL Workbench

Git

GitHub

PowerShell

Project Structure

ecommerce-platform/

│

├── backend/

│   ├── config/

│   ├── controllers/

│   ├── middleware/

│   ├── routes/

│   ├── services/

│   ├── package.json

│   └── server.js

│

├── frontend/

│   ├── public/

│   ├── src/

│   ├── package.json

│   └── vite.config.js

│

├── database/

│

├── .gitignore

└── README.md

Backend Modules



The backend contains modules for:



Authentication

Profiles

Products

Product images

Categories

Cart

Wishlist

Addresses

Coupons

Orders

Payments

Payment settings

Payment OCR

Notifications

Reviews

Admin dashboard

Admin analytics

Admin customers

Admin inventory

Admin orders

Admin payments

Admin payment settings

Admin coupons

Admin reviews

Frontend Pages

Customer

Home

Login

Registration

Product details

Cart

Wishlist

Addresses

Checkout

Orders

Order details

Order success

Profile

Notifications

Admin

Admin dashboard

Products

Categories

Customers

Inventory

Orders

Order details

Payment settings

Payment verification

Coupons

Reviews

Analytics

Authentication



The application uses JWT-based authentication.



Different roles are supported through role-based authorization.



Protected backend routes verify the authentication token before allowing access.



Admin routes additionally verify that the authenticated user has administrator privileges.



Database



The application uses MySQL as its relational database.



The database stores information related to:



Users

Products

Categories

Inventory

Cart

Wishlist

Addresses

Orders

Order items

Payments

Coupons

Reviews

Notifications

Payment settings

Local Setup

Requirements



Install the following before running the project:



Node.js

npm

MySQL

MySQL Workbench

Git

Clone the Repository

git clone https://github.com/Pavanthota45/ecommerce-platform.git

cd ecommerce-platform

Backend Setup



Move into the backend:



cd backend



Install dependencies:



npm install



Create a .env file inside the backend directory.



Example structure:



PORT=5000



DB\_HOST=localhost

DB\_USER=root

DB\_PASSWORD=YOUR\_DATABASE\_PASSWORD

DB\_NAME=ecommerce\_db



JWT\_SECRET=YOUR\_SECRET\_KEY



Never commit the .env file to GitHub.



Start the backend:



npm run dev



The backend runs on:



http://localhost:5000

Frontend Setup



Open another terminal and move into the frontend:



cd ecommerce-platform/frontend



Install dependencies:



npm install



Start the frontend:



npm run dev



Vite will display the local frontend URL in the terminal.



Usually it will be:



http://localhost:5173



If that port is already in use, Vite may automatically use another available port.



Environment Variables



Never upload sensitive values such as:



Database passwords

JWT secrets

API keys

Authentication tokens

Private credentials



The project uses .gitignore to prevent environment files from being committed.



Payment Security



The manual payment workflow uses OCR only as an assistance mechanism.



OCR extraction does not independently prove that a payment is genuine.



The administrator must verify the payment screenshot and transaction information before approving the payment.



Testing



The complete local application workflow has been tested across customer and admin functionality.



Tested areas include:



Authentication

Product browsing

Product details

Wishlist

Cart

Addresses

Coupons

Checkout

COD

UPI payment

QR payment

Bank transfer

Payment screenshot upload

OCR transaction extraction

Payment verification

Orders

Order cancellation

Returns

Inventory handling

Notifications

Admin management

Order lifecycle

Analytics

Security Practices



The project includes:



Password hashing with bcrypt

JWT authentication

Role-based authorization

Environment variable protection

Protected admin routes

Protected customer routes

Input validation

Payment verification workflow

File upload handling

Future Improvements



Planned improvements include:



Cloud image storage

Email notifications

Advanced search

AI shopping assistant

AI product recommendations

AI-powered product search

Image-based product search

Inventory forecasting

Automated low-stock alerts

Advanced sales analytics

Improved responsive design

Production deployment

Performance optimization

Additional security hardening

Author



Pavan Thota



GitHub:



https://github.com/Pavanthota45



License



This project is currently intended for learning, development, and portfolio purposes.





Save the file and close Notepad.



\### Step 3 — Verify the content



Run:



```powershell

Get-Content .\\README.md | Select-Object -First 10



You should see:



\# E-Commerce Platform



A full-stack e-commerce web application built with React, Node.js, Express, and MySQL.

