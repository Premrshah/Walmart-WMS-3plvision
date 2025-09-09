# Dropbox Backend Token Management

This guide shows how to set up proper token management for your Dropbox integration, following the [Dropbox OAuth Guide](https://developers.dropbox.com/oauth-guide). The token logic runs completely behind the scenes - users never see or interact with it.

## What This Solves

- **Problem**: Access tokens expire every 2 hours, causing "invalid_access_token" errors
- **Solution**: Automatic token caching and refresh before expiration
- **User Experience**: Completely transparent - users never see token management

## Backend-Only Setup

### Step 1: Configure Dropbox App

1. Go to [Dropbox App Console](https://www.dropbox.com/developers/apps)
2. Create a new app or use an existing one
3. Set the app type to "Web app"
4. Note down your App Key and App Secret

### Step 2: Add to Environment Variables

Add your Dropbox credentials to your `.env.local` file:

```env
DROPBOX_APP_KEY=your_app_key
DROPBOX_APP_SECRET=your_app_secret
DROPBOX_KYC_PARENT_FOLDER=/3PLVision/KYC-Uploads
```

### Step 3: Restart Your Application

```bash
npm run dev
```

## How It Works (Behind the Scenes)

1. **First API Call**: Uses client credentials to get access token
2. **Cached Usage**: Uses cached access token for subsequent calls
3. **Auto-Refresh**: Before expiration, automatically gets new token
4. **Race Condition Protection**: Prevents multiple simultaneous token requests
5. **User Experience**: Completely transparent - no user interaction needed

## Benefits

- ✅ **Eliminates "invalid_access_token" errors**
- ✅ **Automatic token management** - no manual intervention
- ✅ **Multi-user safe** - one token serves all users
- ✅ **Completely behind the scenes** - users never see token management
- ✅ **Maintains existing folder structure**
- ✅ **Race condition protection** - prevents duplicate token requests
- ✅ **Simple setup** - only requires app key and secret

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DROPBOX_APP_KEY` | Yes | Your Dropbox app key |
| `DROPBOX_APP_SECRET` | Yes | Your Dropbox app secret |
| `DROPBOX_KYC_PARENT_FOLDER` | No | Parent folder for KYC uploads |

## Troubleshooting

### "invalid_access_token" Error
- Make sure `DROPBOX_APP_KEY` and `DROPBOX_APP_SECRET` are set correctly
- Check that your Dropbox app is configured properly
- Verify your app credentials are correct

### "Missing Dropbox app credentials" Error
- Ensure `DROPBOX_APP_KEY` and `DROPBOX_APP_SECRET` are set
- Check your `.env.local` file is loaded correctly

### "Token generation failed" Error
- Verify your Dropbox app credentials are correct
- Check that your app has the necessary permissions
- Ensure your app is not suspended or disabled

## Security Notes

- Never commit app credentials to version control
- Use environment variables for all sensitive data
- App credentials should be treated as passwords
- The same credentials can be used securely by all users

## Testing

To test the implementation:

1. Set up the app credentials as described above
2. Use the KYC upload feature in your application
3. Check the console logs for token generation messages
4. The "invalid_access_token" errors should be eliminated

The token management logic is completely transparent to users - they just use the application normally while the backend handles all token management automatically.

## Reference

This implementation follows the [Dropbox OAuth Guide](https://developers.dropbox.com/oauth-guide) recommendations for server-side web applications that only call the Dropbox API as users interact with it.
