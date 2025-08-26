# 3PLVision Seller Onboarding

A beautiful, modern web application for 3PLVision seller onboarding built with Next.js, TypeScript, Tailwind CSS, and Supabase.

## Features

- ✨ Beautiful, responsive UI with modern design
- 📝 Comprehensive form covering all seller information fields
- 🗄️ Supabase database integration with auto-generated fields
- 📱 Mobile-friendly responsive design
- 🚀 Ready for Vercel deployment
- 🔒 Form validation and error handling
- 📊 Organized form sections for better UX
- 🎨 3PLVision branding and logo integration

## Tech Stack

- **Frontend**: Next.js 13.5.6, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Icons**: Lucide React
- **Deployment**: Vercel

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account and project

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
git clone <your-repo-url>
cd walmart-seller-onboarding
npm install
```

### 2. Set Up Supabase

1. Go to [Supabase](https://supabase.com) and create a new project
2. Once your project is created, go to the SQL Editor
3. Copy and paste the contents of `supabase-setup.sql` into the SQL Editor
4. Run the script to create your table and sample data

### 3. Environment Configuration

1. Copy `env.example` to `.env.local`
2. Fill in your Supabase credentials:

```bash
# Copy from env.example
cp env.example .env.local
```

3. Edit `.env.local` with your actual Supabase values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

You can find these values in your Supabase project settings under "API".

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Database Schema

The application uses a `walmart_sellers` table with the following structure:

- **id**: UUID (Primary Key)
- **seller_name**: VARCHAR(255) - Required (Seller Store name)
- **ste_code**: VARCHAR(50) - Auto-generated (9000 + row number)
- **contact_name**: VARCHAR(255) - Required
- **email**: VARCHAR(255) - Required
- **primary_phone**: VARCHAR(20) - Required
- **seller_logo**: TEXT (URL or base64) - Optional
- **business_name**: VARCHAR(255) - Required
- **address**: TEXT - Required
- **city**: VARCHAR(100) - Required
- **state**: VARCHAR(100) - Required
- **zipcode**: VARCHAR(20) - Required
- **country**: VARCHAR(100) - Required
- **store_type**: VARCHAR(100) - Required
- **comments**: TEXT - Optional
- **walmart_address**: TEXT - Required
- **created_at**: TIMESTAMP
- **updated_at**: TIMESTAMP

## Form Sections & Required Fields

The form is organized into logical sections with clear required field indicators:

### 1. **Basic Information** (Required)
- **Seller Store** - Required (renamed from Seller Name)
- **STE Code** - Auto-generated, read-only (9001, 9002, etc.)
- **Business Name** - Required

### 2. **Contact Information** (All Required)
- **Contact Name** - Required
- **Email** - Required
- **Primary Phone** - Required
- **Seller Logo URL** - Optional

### 3. **Address Information** (All Required)
- **Address** - Required
- **City** - Required
- **State/Province** - Required
- **ZIP/Postal Code** - Required
- **Country** - Required

### 4. **Business Details**
- **Store Type** - Required (dropdown selection)
- **Additional Comments** - Optional

### 5. **Walmart Return Address** (Required)
- **Walmart Return Address** - Required

## Auto-Generated Fields

- **STE Code**: Automatically generated as "9000" + row number (e.g., 9001, 9002, 9003...)
- **ID**: UUID automatically generated
- **Timestamps**: Created and updated timestamps automatically managed

## Deployment to Vercel

### 1. Push to GitHub

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

### 2. Deploy on Vercel

1. Go to [Vercel](https://vercel.com) and create an account
2. Click "New Project" and import your GitHub repository
3. Add your environment variables in the Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Deploy!

### 3. Environment Variables in Vercel

Make sure to add the same environment variables from your `.env.local` file to your Vercel project settings.

## Customization

### Styling
- Modify `tailwind.config.js` to customize colors and theme
- Update `app/globals.css` for custom CSS classes
- The form uses custom CSS classes defined in the global CSS file

### Form Fields
- Add/remove fields by updating the `Seller` type in `lib/supabase.ts`
- Modify the form component in `components/SellerForm.tsx`
- Update the database schema accordingly

### Validation
- The form includes comprehensive HTML5 validation for required fields
- Add custom validation logic in the `handleSubmit` function
- Implement client-side validation using libraries like Zod or Yup

## Troubleshooting

### Common Issues

1. **Supabase Connection Error**
   - Verify your environment variables are correct
   - Check that your Supabase project is active
   - Ensure RLS policies are configured correctly

2. **Form Submission Fails**
   - Check browser console for errors
   - Verify database table exists and has correct schema
   - Check Supabase logs for server-side errors

3. **Styling Issues**
   - Ensure Tailwind CSS is properly configured
   - Check that all CSS classes are defined
   - Verify PostCSS configuration

### Getting Help

- Check the [Supabase documentation](https://supabase.com/docs)
- Review [Next.js documentation](https://nextjs.org/docs)
- Check [Tailwind CSS documentation](https://tailwindcss.com/docs)

## License

This project is open source and available under the [MIT License](LICENSE).

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
