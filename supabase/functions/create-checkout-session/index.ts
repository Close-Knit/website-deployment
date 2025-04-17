// supabase/functions/create-checkout-session/index.ts

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
// Importing stripe library - make sure the version is compatible if you update Deno/Supabase Function runtime later
import Stripe from 'https://esm.sh/stripe@12.12.0?target=deno&deno-std=0.132.0'
// We will create this shared file next
import { corsHeaders } from '../_shared/cors.ts'

console.log('Create Checkout Session Function Initializing')

// Initialize Stripe client using the secret key stored in Supabase secrets
// Ensure 'STRIPE_SECRET_KEY' is set via `supabase secrets set`
const stripeApiKey = Deno.env.get('STRIPE_SECRET_KEY');
if (!stripeApiKey) {
    console.error("Stripe secret key not set in Supabase secrets.");
    // Don't proceed if the key is missing
    // In a real scenario, you might want serve to still run but return an error immediately
    throw new Error("Stripe secret key is not configured.");
}

const stripe = new Stripe(stripeApiKey, {
  // Stripe spec requires this flag when using Deno's fetch
  httpClient: Stripe.createFetchHttpClient(),
  apiVersion: '2022-11-15', // Pin API version for stability
})

// Define the base URL of your website for redirects
// Get from secrets, fallback to localhost for dev
const YOUR_WEBSITE_URL = Deno.env.get('SITE_URL') || 'http://localhost:8888'; // Ensure this is correct for testing/deployment

serve(async (req: Request) => {
  const requestOrigin = req.headers.get('origin'); // Get origin for CORS check

  // Handle CORS preflight requests (OPTIONS method)
  if (req.method === 'OPTIONS') {
    console.log(`Handling OPTIONS request from: ${requestOrigin}`);
    // Respond with appropriate CORS headers based on the request origin
    return new Response('ok', { headers: corsHeaders(requestOrigin) })
  }

  try {
    console.log(`Handling ${req.method} request from: ${requestOrigin}`);
    // --- 1. Parse Incoming Request Body ---
    // Ensure the request has a body before trying to parse JSON
    if (!req.body) {
        throw new Error("Request has no body.");
    }
    const {
        listingId,
        tableName,
        communityId,
        provinceName,
        communityName,
        listingName,
        promoterEmail,
        priceId // Expecting Price ID from the frontend now
    } = await req.json();

    // --- 2. Basic Input Validation ---
    if (!listingId || !tableName || !promoterEmail || !priceId || !communityId || !provinceName || !communityName || !listingName) {
        // Log exactly what's missing for easier debugging
        console.error("Missing required data:", { listingId, tableName, promoterEmail, priceId, communityId, provinceName, communityName, listingName });
        throw new Error('Missing required promotion details in request body.');
    }
    console.log("Received promotion request for:", { listingId, tableName, promoterEmail, priceId });

    // --- 3. Define Success and Cancel URLs ---
    // Pass necessary info back in success URL query params if needed by the success page
    const successUrl = `${YOUR_WEBSITE_URL}/promotion_success.html?session_id={CHECKOUT_SESSION_ID}&listingName=${encodeURIComponent(listingName)}`;
    // Pass context back to the promote page if cancelled
    const cancelUrl = `${YOUR_WEBSITE_URL}/promote.html?lid=${encodeURIComponent(listingId)}&cid=${encodeURIComponent(communityId)}&prov=${encodeURIComponent(provinceName)}&comm=${encodeURIComponent(communityName)}&name=${encodeURIComponent(listingName)}&table=${encodeURIComponent(tableName)}&status=cancelled`;

    // --- 4. Create Stripe Checkout Session ---
    console.log(`Creating Stripe session with Price ID: ${priceId}`);
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment', // one-time payment
      line_items: [
        {
          price: priceId, // Use the Price ID received from the request
          quantity: 1,
        },
      ],
      customer_email: promoterEmail, // Pre-fill email on Stripe page
      success_url: successUrl,
      cancel_url: cancelUrl,
      // Metadata to link payment to your database records
      metadata: {
        listing_id: String(listingId),
        table_name: tableName,
        community_id: String(communityId),
        province_name: provinceName,
        community_name: communityName,
        promoter_email: promoterEmail, // Include for potential verification/logging
      },
    });

    console.log("Stripe session created:", session.id);

    // --- 5. Return the Session URL to the Frontend ---
    return new Response(JSON.stringify({ checkoutUrl: session.url }), {
      headers: { ...corsHeaders(requestOrigin), 'Content-Type': 'application/json' }, // Include dynamic CORS headers
      status: 200,
    });

  } catch (error) {
    // Log the detailed error
    console.error('Error processing checkout request:', error);
    // Return a user-friendly error message
    return new Response(JSON.stringify({ error: error.message || "An unexpected error occurred." }), {
      headers: { ...corsHeaders(requestOrigin), 'Content-Type': 'application/json' }, // Include dynamic CORS headers
      status: error instanceof SyntaxError ? 400 : 500, // 400 for bad request (e.g., bad JSON), 500 otherwise
    });
  }
});