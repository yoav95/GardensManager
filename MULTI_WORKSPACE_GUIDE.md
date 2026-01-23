# Multi-Workspace System Guide

## Overview
The garden manager app now supports **multi-workspace functionality**, allowing users to:
- Create their own workspaces (where they are the owner/admin)
- Join other users' workspaces as members
- Switch between multiple workspaces
- Manage members and their roles within workspaces

## How It Works

### 1. User Registration & Authentication
- Users sign in with Google authentication
- New users create a pending registration request
- Workspace owners approve new users to join their workspaces

### 2. Workspace Structure

Each workspace has:
- **Name**: Display name for the workspace
- **Owner**: The user who created the workspace (stored as email)
- **OwnerId**: The user ID of the owner
- **Members**: A map of user IDs to member data containing:
  - `role`: Either "admin" or "member"
  - `email`: User's email
  - `displayName`: User's display name
  - `joinedAt`: ISO timestamp of when they joined

```javascript
{
  id: "workspace123",
  name: "My Garden Company",
  owner: "yoav.amenou@gmail.com",
  ownerId: "user_uid_123",
  createdAt: "2026-01-23T10:00:00.000Z",
  members: {
    "user_uid_123": {
      role: "admin",
      email: "yoav.amenou@gmail.com",
      displayName: "Yoav Amenou",
      joinedAt: "2026-01-23T10:00:00.000Z"
    },
    "user_uid_456": {
      role: "member",
      email: "client@example.com",
      displayName: "Client Name",
      joinedAt: "2026-01-23T11:00:00.000Z"
    }
  }
}
```

### 3. Your Scenario: Being in Multiple Workspaces

**Example: You (yoav.amenou@gmail.com) want to:**
1. Have your own workspace where you're the owner
2. Join a client's workspace as a member

#### Step 1: Create Your Workspace
1. Go to the WorkspaceSelector component (visible at the top)
2. Click "➕ צור סביבת עבודה חדשה"
3. Enter workspace name (e.g., "החברה שלי")
4. You're automatically added as an admin member

#### Step 2: Join Client's Workspace
1. Ask your client for their **workspace ID** (they can copy it from the "👥 משתמשים" panel)
2. Click "🔗 הצטרף לסביבת עבודה"
3. Enter the workspace ID you received
4. Click "שלח בקשה" (Send Request)
5. Wait for the workspace owner/admin to approve your request

#### Step 3: Switching Between Workspaces
- Use the dropdown in WorkspaceSelector to switch between workspaces
- All data (gardens, tasks, shopping) is filtered by the selected workspace
- Your selection is saved in localStorage

## Components Created

### 1. **CreateWorkspace** (`src/components/CreateWorkspace/`)
- Allows users to create new workspaces
- Automatically adds creator as admin member
- Updates Firestore with new workspace document

### 2. **JoinWorkspace** (`src/components/JoinWorkspace/`)
- Allows users to request to join existing workspaces
- Shows pending join requests
- Creates documents in `workspaceJoinRequests` collection

### 3. **WorkspaceMembers** (`src/components/WorkspaceMembers/`)
- Shows all members in current workspace
- Allows owners/admins to:
  - Change member roles (member ↔ admin)
  - Remove members
  - Copy workspace ID to share with others

### 4. **Enhanced AdminPanel** (`src/components/AdminPanel/`)
- Now has two tabs:
  - **"הרשמות חדשות"**: New user registrations (original functionality)
  - **"בקשות הצטרפות"**: Workspace join requests (new)
- Owners and admins can approve/reject both types of requests

## Firestore Collections

### `workspaces`
```javascript
{
  name: string,
  owner: string (email),
  ownerId: string (uid),
  createdAt: string (ISO),
  description?: string,
  members: {
    [uid]: {
      role: "admin" | "member",
      email: string,
      displayName: string,
      joinedAt: string (ISO)
    }
  }
}
```

### `workspaceJoinRequests`
```javascript
{
  workspaceId: string,
  userId: string,
  userEmail: string,
  displayName: string,
  requestedAt: string (ISO),
  status: "pending" | "approved" | "rejected",
  approvedAt?: string (ISO),
  approvedBy?: string (uid),
  rejectedAt?: string (ISO),
  rejectedBy?: string (uid)
}
```

## Security Rules

Updated Firestore rules to support:
- Users can create workspaces (must match their ownerId)
- Users can read all workspaces (to discover and join)
- Users can update/delete workspaces they're members of
- Join requests can be created by authenticated users
- Join requests are readable/updatable by authenticated users

## User Roles

### Owner
- The user who created the workspace
- Has full control (implicit admin rights)
- Cannot be removed from workspace
- Stored in `owner` (email) and `ownerId` (uid) fields

### Admin
- Can approve join requests
- Can manage members (change roles, remove members)
- Can modify workspace settings
- Set via `members[uid].role = "admin"`

### Member
- Regular workspace access
- Can view and work with gardens, tasks, shopping
- Cannot manage other members
- Set via `members[uid].role = "member"`

## Integration Points

The multi-workspace system integrates with:

1. **WorkspaceContext** - Filters workspaces by user membership
2. **TopNavbar** - Shows WorkspaceMembers and AdminPanel buttons
3. **WorkspaceSelector** - Shows create/join options
4. **All data queries** - Gardens, tasks, shopping are filtered by `selectedWorkspace`

## Usage Flow

```
User Authentication
    ↓
Check Workspace Membership
    ↓
    ├─→ Has Workspaces? → Select/Switch Workspace
    │                          ↓
    │                     Work with Data
    │
    └─→ No Workspaces? → Create New or Join Existing
```

## Next Steps (Optional Enhancements)

1. **Email Notifications**: Notify users when they're approved to join
2. **Workspace Invitations**: Send direct email invites instead of sharing IDs
3. **Workspace Settings Page**: Dedicated page for workspace configuration
4. **Member Permissions**: Fine-grained permissions beyond admin/member
5. **Workspace Transfer**: Allow transferring ownership to another member
6. **Audit Log**: Track workspace actions and changes

## Testing Your Setup

To test the multi-workspace functionality:

1. **As Owner (yoav.amenou@gmail.com)**:
   - Create your workspace "החברה שלי"
   - Copy the workspace ID from the members panel
   - Share it with your client

2. **As Client**:
   - Create their workspace
   - Add you to their workspace (if they approve your join request)
   - OR approve your join request if you submitted one

3. **Switch Between Workspaces**:
   - Use the dropdown to switch
   - Verify gardens/tasks/shopping filter correctly
   - Check you can see different members in each workspace

## Firestore Deployment

After making changes, deploy the updated rules:
```bash
firebase deploy --only firestore:rules
```

---

**Created**: January 23, 2026
**System Version**: Multi-workspace support v1.0
