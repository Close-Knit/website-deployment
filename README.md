# Bizly Community Directory - Functionality Guide

This document outlines the core features and functionality of the Bizly Community Directory website.

## 1. Overview

Bizly is a dynamic web application designed to provide community-based telephone directories for various locations across Canada. It allows users to browse listings by province/territory and community, search within directories, and suggest additions or changes. It now also includes a feature for businesses to promote their listings for enhanced visibility.

The site utilizes a modern web stack:
*   **Frontend:** Static HTML (`.html`), CSS (`styles.css`), and client-side JavaScript (`.js` files).
*   **Backend/Database:** [Supabase](https://supabase.com/) provides the PostgreSQL database to store all province, community, and listing data, as well as handling backend logic via Edge Functions.
*   **Payment Processing:** [Stripe](https://stripe.com/) handles secure payment processing for listing promotions.
*   **Hosting:** Deployed via [Netlify](https://netlify.com/), which serves the static files and runs the Supabase Edge Functions.

## 2. Core Functionality

### 2.1. Homepage (`index.html` / `home.js`)

*   **Purpose:** Serves as the main entry point, allowing users to select a province/territory.
*   **Data Loading:**
    *   `home.js` fetches a list of all provinces and territories from the `provinces` table in Supabase.
    *   It also fetches all communities from the `communities` table.
*   **Display:**
    *   Provinces and territories are displayed as distinct columns/sections.
    *   For each region, a preview of the first `MAX_COMMUNITIES_VISIBLE` (currently 5) communities is shown, sorted alphabetically.
    *   Communities marked as 'NEW' or 'COMING_SOON' in the database have corresponding status labels displayed next to their names.
    *   A "View All" button links to the respective `province_page.html` for that region.
    *   The heading for "Newfoundland and Labrador" is displayed as "Newfoundland & Labrador" for better formatting.
*   **Client Initialization:** Relies on `common.js` to initialize the `supabaseClient`.

### 2.2. Province Page (`province_page.html` / `province_page.js`)

*   **Purpose:** Displays a complete, alphabetically grouped list of all communities within a selected province or territory.
*   **Navigation:** Accessed via the "View All" buttons on the homepage or direct link (e.g., `province_page.html?province=British%20Columbia`).
*   **Data Loading:**
    *   `province_page.js` reads the `province` name from the URL query parameter.
    *   It fetches the `province_id` from the `provinces` table based on the name.
    *   It then fetches all communities associated with that `province_id` from the `communities` table, including their `status`.
*   **Display:**
    *   The province name is displayed as the main heading, including the total community count.
    *   Communities are grouped alphabetically by their first letter (e.g., "A", "B", "C",...).
    *   Listings under each letter are sorted alphabetically.
    *   'NEW' and 'COMING_SOON' status labels are displayed.
    *   Each community name links to its specific `community.html` page.
    *   Includes breadcrumbs for navigation (Home > Province Name).
*   **Client Initialization:** Relies on `common.js` to initialize the `supabaseClient`.

### 2.3. Community Page (`community.html` / `directory.js`)

*   **Purpose:** Displays the detailed telephone directory listings for a specific community. This is the core directory view.
*   **Navigation:** Accessed via links from `index.html` or `province_page.html` (e.g., `community.html?province=British%20Columbia&community=Cluculz%20Lake`).
*   **Data Loading:**
    *   `directory.js` reads the `province` and `community` names from the URL.
    *   It determines the correct database table name based on the province name (e.g., `British_Columbia`).
    *   It fetches the `community_id` and `logo_filename` from the `communities` table.
    *   It fetches all listings (`*`) matching the `community_id` from the specific province table (e.g., `British_Columbia`), including promotion details (`is_promoted`, `promotion_expires_at`).
*   **Display:**
    *   Displays the community logo (if available).
    *   Displays the full community and province name as the main heading, along with the listing count.
    *   Includes breadcrumbs (Home > Province Name > Community Name).
    *   Listings are grouped by `category` (fetched from the database).
    *   Categories are sorted alphabetically ("Uncategorized" last).
    *   **Promotion Display:** Within each category, listings marked as `is_promoted = true` AND where `promotion_expires_at` is in the future are:
        *   Sorted to appear *first*.
        *   Given special styling (`.promoted-listing` class: background color, border).
        *   Display a "Sponsored" label (`.sponsored-label`) next to the business name.
    *   Regular (non-promoted or expired) listings appear below promoted ones, sorted alphabetically.
    *   Displays listing details: Name, Address (optional), Notes (optional).
    *   "Show Phone" button appears if a phone number exists; clicking it reveals the number in a popup modal (`#phonePopup`).
    *   "Promote" button appears for listings that are *not* currently actively promoted.
*   **Client Initialization:** Relies on `common.js` to initialize the `supabaseClient`.

## 3. Listing Promotion Feature

This feature allows businesses to pay a fee to have their listing highlighted and placed at the top of its category on the relevant `community.html` page for one month.

### 3.1. Overview

*   **Goal:** Increase listing visibility.
*   **Mechanism:** One-time payment via Stripe Checkout triggers an automated update in the Supabase database via a webhook.
*   **Duration:** 30 days (calculated from payment success).
*   **Display:** Promoted listings get background/border styling, a "Sponsored" label, and appear first within their category.

### 3.2. User Flow (Business Owner)

1.  **Click "Promote":** On the `community.html` page, the user clicks the "Promote" button next to the desired listing. This button is only shown if the listing isn't already actively promoted.
2.  **Navigate to Promotion Page:** The user is taken to `promote.html`. The URL contains parameters identifying the listing (`lid`), community (`cid`), province (`prov`), community name (`comm`), listing name (`name`), and database table (`table`).
3.  **Promotion Details (`promote.html` / `promote.js`):**
    *   The page displays the name of the listing being promoted (read from URL parameters by `promote.js`).
    *   It shows the price and explains the one-month, one-time payment terms.
    *   It requires the user to enter their email address (for the Stripe receipt).
4.  **Initiate Payment:** The user clicks "Proceed to Payment".
    *   `promote.js` performs basic email validation.
    *   It gathers all necessary data (listing ID, table name, email, Stripe Price ID, etc.).
    *   It securely calls the `create-checkout-session` Supabase Edge Function, sending the data in the request body.
5.  **Stripe Checkout:**
    *   The `create-checkout-session` function uses the stored Stripe Secret Key to create a secure Stripe Checkout session. It includes the listing details as `metadata`.
    *   The function returns the unique URL for this Stripe Checkout session back to `promote.js`.
    *   `promote.js` automatically redirects the user's browser to the Stripe Checkout URL.
6.  **Payment:** The user completes the payment on Stripe's secure page using test card details (or real details when live).
7.  **Success Redirect:** Upon successful payment, Stripe redirects the user back to the `success_url` configured in the Edge Function (`promotion_success.html`), appending the Stripe Session ID and listing name to the URL.
8.  **Success Page (`promotion_success.html`):** Displays a confirmation message, including the listing name read from the URL parameter.

### 3.3. Backend Process (Webhook Automation)

This happens automatically in the background after Stripe confirms payment.

1.  **Stripe Sends Webhook:** Stripe sends an HTTPS POST request containing the `checkout.session.completed` event data (including the metadata we sent) to the configured webhook endpoint URL (`https://<project_ref>.supabase.co/functions/v1/stripe-webhook`).
2.  **Function Receives Webhook (`stripe-webhook/index.ts`):**
    *   The `stripe-webhook` Supabase Edge Function receives the incoming request.
3.  **Signature Verification:** The function uses the unique `STRIPE_WEBHOOK_SIGNING_SECRET` (stored in Supabase Secrets) to verify the `Stripe-Signature` header, ensuring the request genuinely came from Stripe and wasn't tampered with. If verification fails, it returns an error.
4.  **Metadata Extraction:** If verified, the function parses the event data and extracts the `listing_id`, `table_name`, `promoter_email`, etc., from the `metadata`.
5.  **Expiry Calculation:** It calculates the `promotion_expires_at` date (currently 30 days from the time the webhook is processed).
6.  **Database Update:** The function uses the **Supabase Service Role Key** (stored in Supabase Secrets) to initialize an admin Supabase client. It then connects to the database and performs an `UPDATE` query on the correct `tableName`:
    *   It finds the row matching the `listing_id`.
    *   It sets `is_promoted = true`.
    *   It sets `promotion_expires_at` to the calculated timestamp.
    *   It sets `promoter_email` to the email from the metadata.
7.  **Acknowledge Stripe:** The function sends a `200 OK` status code back to Stripe to confirm successful receipt and processing of the webhook event.

### 3.4. Display Logic (`directory.js` / `styles.css`)

*   When `directory.js` fetches listings, it now also gets the `is_promoted` and `promotion_expires_at` columns.
*   Before rendering listings for a category, it filters them into `promotedInCategory` and `regularInCategory` based on whether `is_promoted` is true and `promotion_expires_at` is after the current time.
*   It renders the `promotedInCategory` list first, followed by `regularInCategory`.
*   Listings determined to be actively promoted have the `promoted-listing` CSS class added to their `<li>` element.
*   The `sponsored-label` (`<span>Sponsored</span>`) is added next to the name within the `.name` span for active promotions.
*   The "Promote" button is only generated and added to the HTML if a listing is *not* currently actively promoted.
*   `styles.css` contains rules for `.promoted-listing` (background, border) and `.sponsored-label` (styling, color).

## 4. Other Features (`common.js`, `directory.js`, etc.)

*   **Search (`directory.js`):** On `community.html`, allows users to filter listings in real-time by typing in the search box. It checks the listing name, address, notes, and category heading for matches.
*   **Share Page (`common.js`):** The "Share Page" button on `community.html` uses the Web Share API (if available) or falls back to copying the page URL to the clipboard. Provides user feedback ("Link Copied!").
*   **Suggest Change (`suggest_change.html` / `suggest_change.js`):** A form allowing users to suggest additions, changes, or deletions to listings for a specific community. Submissions are saved to the `suggested_changes` table in Supabase for review. Relies on `common.js` for Supabase client.
*   **Back to Top (`common.js`):** A button appears on longer pages after scrolling down, allowing users to smoothly scroll back to the top. Used on `province_page.html` and `community.html`.
*   **Phone Number Reveal (`directory.js`):** The "Show Phone" button on `community.html` listings displays a popup modal showing the phone number and a copy button. This is intended as an anti-scraping measure.

## 5. Technical Setup & Configuration

### 5.1. Environment Variables / Secrets

The following secrets **must** be set via the Supabase CLI (`supabase secrets set ...`) or Dashboard for the functions to work:

*   `STRIPE_SECRET_KEY`: Your Stripe **Secret Key** (use `sk_test_...` for testing, `sk_live_...` for production). Used by `create-checkout-session`.
*   `STRIPE_WEBHOOK_SIGNING_SECRET`: The unique secret generated by Stripe for your webhook endpoint (use the Test mode `whsec_...` for testing, Live mode `whsec_...` for production). Used by `stripe-webhook`.
*   `SUPABASE_URL`: Your project's Supabase URL (e.g., `https://<ref>.supabase.co`). Used by `stripe-webhook`.
*   `SUPABASE_SERVICE_ROLE_KEY`: Your project's **secret** Service Role Key. Used by `stripe-webhook` for database updates.
*   `SITE_URL`: The base URL of your deployed website (e.g., `https://bizly.ca` or `http://localhost:8888` for local dev). Used for Stripe redirect URLs.

The following keys are configured directly in the code:

*   `SUPABASE_ANON_KEY`: Your project's public Anon Key. Defined once in `common.js`.
*   `STRIPE_PRICE_ID`: The API ID of the specific Stripe Price object for the promotion. Defined in `promote.js`. Must match the Stripe mode (Test/Live) corresponding to the API keys being used.

### 5.2. Local Development

*   Requires Node.js/npm, Supabase CLI, Docker Desktop, Netlify CLI.
*   Use `netlify dev` to run the local server and test the full flow, including redirects.
*   Ensure Docker Desktop is running when deploying functions.

## 6. Going Live Checklist (Brief)

*   Activate Stripe Account.
*   Create **Live** Product/Price in Stripe.
*   Obtain **Live** API Keys from Stripe.
*   Create **Live** Webhook Endpoint in Stripe and get **Live** Signing Secret.
*   Update **ALL** Supabase Secrets (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SIGNING_SECRET`) with **Live** values.
*   Update `STRIPE_PRICE_ID` in `promote.js` with the **Live** Price ID.
*   Deploy code changes (JS, potentially function code if secrets changed how things init).
*   Perform a real (refundable) transaction.
*   Update `allowedOrigins` in `_shared/cors.ts` if needed.

---
This guide provides a functional overview. Refer to the specific code files for implementation details.