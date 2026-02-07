
# Test Accounts

Since the application now uses Firebase Authentication, the legacy hardcoded demo accounts no longer work directly. You need to create accounts in the live Firebase environment.

The logic for role assignment is as follows:
- The **FIRST** user to ever sign up in the system will be automatically assigned the **Admin** role.
- All subsequent users will be assigned the **Viewer** role by default.
- An Admin can later change other users' roles to 'Editor' or 'Admin' via the Admin Panel.

## Recommended Test Setup

To replicate the previous test environment, perform these steps in order:

### 1. Create Admin Account (Do this first!)
- **Email:** admin@test.com
- **Password:** admin123
- **Role:** Admin (Automatic)

### 2. Create Editor Account
- **Email:** editor@test.com
- **Password:** editor123
- **Role:** Viewer (Automatic) -> **Action Required:** Log in as Admin and change this user's role to 'Editor'.

### 3. Create Viewer Account
- **Email:** viewer@test.com
- **Password:** viewer123
- **Role:** Viewer (Automatic)

## Troubleshooting
If you need to reset roles or start over:
1. Go to Firebase Console > Firestore Database.
2. Delete all documents in the `users` collection.
3. The next user to sign up will become the new Admin.
