# Dropbox OAuth 2.0 Setup Guide

This guide explains how to set up Dropbox OAuth 2.0 for file requests in your application, based on the [Dropbox OAuth Guide](https://developers.dropbox.com/oauth-guide).

## 🔧 **What Changed**

The application now uses **OAuth 2.0 Authorization Code Flow** instead of client credentials, which is required for file requests. This means:

- ✅ **File requests work properly** - Users can upload documents via secure Dropbox links
- ✅ **User-specific authentication** - Each user authorizes the app to access their Dropbox
- ✅ **Long-lived access** - Refresh tokens provide persistent access without re-authorization
- ✅ **Secure** - Follows OAuth 2.0 best practices

## 📋 **Setup Steps**

### 1. **Create Dropbox App**

1. Go to [Dropbox App Console](https://www.dropbox.com/developers/apps)
2. Click **"Create app"**
3. Choose **"Scoped access"**
4. Select **"Full Dropbox"** (or "App folder" if you prefer)
5. Name your app (e.g., "3PLVision KYC Uploader")

### 2. **Configure App Permissions**

In your app settings, enable these scopes:
- ✅ `file_requests.write` - Create file requests
- ✅ `file_requests.read` - Read file requests  
- ✅ `files.metadata.write` - Create folders
- ✅ `files.metadata.read` - Read folder metadata

### 3. **Set Redirect URI**

1. Go to **"Settings"** tab in your app
2. Add redirect URI: `http://localhost:3000/api/dropbox/callback`
3. For production, add: `https://yourdomain.com/api/dropbox/callback`

### 4. **Get App Credentials**

1. Copy your **App key** (client_id)
2. Copy your **App secret** (client_secret)
3. Add them to your `.env.local` file:

```env
# Dropbox OAuth 2.0 Configuration
DROPBOX_APP_KEY=your_app_key_here
DROPBOX_APP_SECRET=your_app_secret_here
DROPBOX_REDIRECT_URI=http://localhost:3000/api/dropbox/callback
DROPBOX_KYC_PARENT_FOLDER=/3PLVision/KYC-Uploads
```

### 5. **Test the Flow**

1. Start your development server: `npm run dev`
2. Fill out the seller form
3. Click **"Get KYC Upload Link"**
4. You'll be redirected to Dropbox for authorization
5. After authorizing, you'll be redirected back
6. The file request link will be generated successfully

## 🔄 **How It Works**

### **User Flow:**
1. User clicks "Get KYC Upload Link"
2. App checks if user is authenticated with Dropbox
3. If not authenticated → Opens Dropbox authorization window
4. User authorizes the app on Dropbox
5. Dropbox redirects back with authorization code
6. App exchanges code for access token + refresh token
7. App creates file request using user's token
8. User receives secure upload link

### **Technical Flow:**
```
User → SellerForm → /api/kyc/file-request → Check Auth → 
If not auth → /api/dropbox/auth → Dropbox OAuth → 
/api/dropbox/callback → Exchange Code → Create File Request
```

## 🛠 **API Endpoints**

### **`/api/dropbox/auth`** (POST)
- Initiates OAuth flow
- Returns authorization URL
- Body: `{ userId: string }`

### **`/api/dropbox/callback`** (GET)
- Handles OAuth callback
- Exchanges code for tokens
- Redirects back to app

### **`/api/kyc/file-request`** (POST)
- Creates file request (requires authentication)
- Body: `{ seller_name, email, ste_code, userId }`
- Returns: `{ url, title, destination }`

## 🔐 **Security Features**

- **User-specific tokens** - Each user has their own Dropbox access
- **Refresh tokens** - Long-lived access without re-authorization
- **Token expiration** - Automatic refresh before expiration
- **Secure storage** - Tokens stored in memory (upgrade to database for production)
- **OAuth 2.0 compliance** - Follows industry standards

## 🚀 **Production Considerations**

### **Token Storage**
Currently uses in-memory storage. For production, consider:
- **Database storage** - Store tokens in your database
- **Encryption** - Encrypt tokens at rest
- **Session management** - Link tokens to user sessions

### **Environment Variables**
Update for production:
```env
DROPBOX_REDIRECT_URI=https://yourdomain.com/api/dropbox/callback
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### **Error Handling**
The app handles:
- ✅ Authentication required
- ✅ Token expiration
- ✅ Refresh token failure
- ✅ Network errors
- ✅ User cancellation

## 🐛 **Troubleshooting**

### **"User not authenticated" Error**
- User needs to complete OAuth flow
- Check if redirect URI is correct
- Verify app credentials

### **"Token expired" Error**
- Refresh token is invalid
- User needs to re-authorize
- Check token storage

### **"Invalid access token" Error**
- Token doesn't have required scopes
- Check app permissions in Dropbox console
- Verify token exchange

## 📚 **References**

- [Dropbox OAuth Guide](https://developers.dropbox.com/oauth-guide)
- [Dropbox File Requests API](https://www.dropbox.com/developers/documentation/http/documentation#file_requests)
- [OAuth 2.0 Specification](https://tools.ietf.org/html/rfc6749)

---

**Note:** This implementation follows the Dropbox OAuth guide recommendation for "server-side web applications that only call the Dropbox API as users interact with it" using the authorization code flow with short-lived access tokens and refresh tokens.
