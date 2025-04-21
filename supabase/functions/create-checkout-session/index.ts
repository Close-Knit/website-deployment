// supabase/functions/create-checkout-session/index.ts (Corrected to include durationMonths)

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import Stripe from 'npm:stripe@^14' // Use npm specifier
import { corsHeaders } from '../_shared/cors.ts' // Import the CORS helper

console.log('Create Checkout Session Function Initializing (v2)')

// --- Get Environment Variables ---
const stripeApiKey = Deno.env.get('STRIPE_SECRET_KEY');
const siteUrl = Deno.env.get('SITE_URL') || 'http://localhost:8888'; // Default for local dev

// --- Validate Secrets ---
if (!stripeApiKey) {
    console.error("FATAL ERROR: Stripe secret key not set in Supabase secrets.");
    throw new Error("Stripe secret key is not configured.");
}

// --- Initialize Stripe Client ---
const stripe = new Stripe(stripeApiKey, {
  apiVersion: '2022-11-15', // Pin API version
  // No httpClient needed with npm:stripe
});

console.log(`Function using SITE_URL: ${siteUrl}`);


serve(async (req: Request) => {
  const requestOrigin = req.headers.get('origin'); // Get origin for CORS check

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log(`Handling OPTIONS request from: ${requestOrigin}`);
    return new Response('ok', { headers: corsHeaders(requestOrigin) })
  }

  try {
    console.log(`Handling ${req.method} request from: ${requestOrigin}`);
    // --- 1. Parse Incoming Request Body ---
    if (!req.body) {
        throw new Error("Request has no body.");
    }
    // *** Ensure durationMonths is destructured from the JSON body ***
    const {
        listingId,
        tableName,
        communityId,
        provinceName,
        communityName,
        listingName,
        promoterEmail,
        priceId,
        durationMonths // <-- Added here
    } = await req.json();

    // --- 2. Basic Input Validation ---
    // *** Add durationMonths to the validation check ***
    if (!listingId || !tableName || !promoterEmail || !priceId || !communityId || !provinceName || !communityName || !listingName || !durationMonths) {
        console.error("Missing required data:", { listingId, tableName, promoterEmail, priceId, communityId, provinceName, communityName, listingName, durationMonths }); // Log missing data
        throw new Error('Missing required promotion details in request body.');
    }
    console.log("Received promotion request for:", { listingId, tableName, promoterEmail, priceId, durationMonths });

    // --- 3. Define Success and Cancel URLs (Unchanged) ---
    const successUrl = `${siteUrl}/promotion_success.html?session_id={CHECKOUT_SESSION_ID}&listingName=${encodeURIComponent(listingName)}`;
    const cancelUrl = `${siteUrl}/promote.html?lid=${encodeURIComponent(listingId)}&cid=${encodeURIComponent(communityId)}&prov=${encodeURIComponent(provinceName)}&comm=${encodeURIComponent(communityName)}&name=${encodeURIComponent(listingName)}&table=${encodeURIComponent(tableName)}&status=cancelled`;

    // --- 4. Create Stripe Checkout Session ---
    console.log(`Creating Stripe session with Price ID: ${priceId}`);
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      customer_email: promoterEmail,
      success_url: successUrl,
      cancel_url: cancelUrl,
      // --- CRITICAL: Add durationMonths to metadata ---
      metadata: {
        listing_id: String(listingId),
        table_name: tableName,
        community_id: String(communityId),
        province_name: provinceName,
        community_name: communityName,
        promoter_email: promoterEmail,
        durationMonths: String(durationMonths) // <-- Added here (ensure it's a string)
      },
    });

    console.log("Stripe session created:", session.id);

    // --- 5. Return the Session URL to the Frontend ---
    return new Response(JSON.stringify({ checkoutUrl: session.url }), {
      headers: { ...corsHeaders(requestOrigin), 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error processing checkout request:', error);
    return new Response(JSON.stringify({ error: error.message || "An unexpected error occurred." }), {
      headers: { ...corsHeaders(requestOrigin), 'Content-Type': 'application/json' },
      status: error instanceof SyntaxError ? 400 : 500,
    });
  }
})