# Database Schema Documentation Generator

This tool generates documentation for the Supabase database schema.

## Setup

1. Install dependencies:
   ```
   npm install
   ```

## Usage

Run the script with your Supabase credentials:

```bash
SUPABASE_URL=https://czcpgjcstkfngyzbpaer.supabase.co SUPABASE_SERVICE_ROLE_KEY=your_service_role_key npm run update-schema
```

This will generate a `database_schema.md` file with the current database schema.

## Important Notes

- You need to use the **service role key**, not the anon key, as this script needs to access schema information.
- Run this periodically to keep the documentation up to date.
- The generated documentation is in Markdown format and can be viewed in any Markdown viewer.