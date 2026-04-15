# Tenant Landlord System

A simple full-stack app using **Flask**, **React**, and **MySQL** to manage tenants, landlords, and properties.

---

## Tech Stack

* Frontend: React
* Backend: Flask
* Database: MySQL

---

## Setup

### 1. Update `.env`

Go to the backend folder and update your `.env` file with database details.

---

### 2. Run Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python seed.py
python run.py
```

---

### 3. Run Frontend

```bash
cd frontend
npm install
npm start
```

---

## Notes

* Make sure MySQL is running
* Backend runs on `localhost:5000`
* Frontend runs on `localhost:3000`

---
