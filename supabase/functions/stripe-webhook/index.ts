// supabase/functions/stripe-webhook/index.ts (v3 - Save duration to DB)

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import Stripe from 'npm:stripe@^14'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

console.log(`Stripe Webhook Function Initializing (v3 - Save Duration)`)

// Get required environment variables
const stripeApiKey = Deno.env.get('STRIPE_SECRET_KEY');
const webhookSigningSecret = Deno.env.get('STRIPE_WEBHOOK_SIGNING_SECRET');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

// Validate required secrets
if (!stripeApiKey || !webhookSigningSecret || !supabaseUrl || !supabaseServiceKey) {
  console.error('FATAL ERROR: Missing one or more required environment variables.')
  throw new Error("Function configuration error: Missing secrets.");
}

// Initialize Stripe client
const stripe = new Stripe(stripeApiKey, {
  apiVersion: '2022-11-15',
});

// Initialize Supabase Admin Client
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req: Request) => {
  const signature = req.headers.get('Stripe-Signature')
  const body = await req.text()
  const requestOrigin = req.headers.get('origin');

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders(requestOrigin) });
  }

  // Ensure signature exists
  if (!signature) {
    console.error('Stripe-Signature header missing!');
    return new Response('Stripe-Signature header required', { status: 400 })
  }

  let receivedEvent: Stripe.Event;

  try {
    // --- 1. Verify the webhook signature ---
    console.log("Verifying Stripe webhook signature...");
    receivedEvent = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSigningSecret
    );
    console.log(`Webhook signature verified. Event ID: ${receivedEvent.id}, Type: ${receivedEvent.type}`);

  } catch (err) {
    console.error(`Webhook signature verification failed: ${err.message}`)
    return new Response(`Webhook Error: ${err.message}`, { status: 400 })
  }

  // --- 2. Handle the 'checkout.session.completed' event ---
  if (receivedEvent.type === 'checkout.session.completed') {
    const session = receivedEvent.data.object as Stripe.Checkout.Session;
    console.log(`Processing checkout.session.completed for session: ${session.id}`);

    // --- 3. Extract metadata ---
    const metadata = session.metadata;
    if (!metadata) {
      console.error("Metadata missing from checkout session:", session.id);
      return new Response('Metadata missing', { status: 400 });
    }

    const listingId = metadata.listing_id;
    const tableName = metadata.table_name;
    const promoterEmail = metadata.promoter_email;
    const durationMonths = metadata.durationMonths; // Get the duration

    console.log("Extracted Metadata:", metadata);

    // Validate essential metadata
    if (!listingId || !tableName || !promoterEmail || !durationMonths) {
      console.error("Essential metadata (listing_id, table_name, promoter_email, durationMonths) missing:", metadata);
      return new Response('Essential metadata missing', { status: 400 });
    }

    const durationNum = parseInt(durationMonths, 10);
    if (isNaN(durationNum) || durationNum <= 0) {
        console.error("Invalid durationMonths value received:", durationMonths);
        return new Response('Invalid duration value', { status: 400 });
    }

    try {
      // --- 4. Calculate expiry date ---
      const now = new Date();
      const expiryDate = new Date(now);
      expiryDate.setMonth(expiryDate.getMonth() + durationNum);
      const expiryTimestamp = expiryDate.toISOString();
      console.log(`Calculated expiry timestamp for ${durationNum} months: ${expiryTimestamp}`);

      // --- 5. Update the correct listing in the Supabase database ---
      // *** ADD promotion_duration_months to the update object ***
      console.log(`Attempting to update listing ID ${listingId} in table ${tableName}`);
      const { data: updateData, error: updateError } = await supabaseAdmin
        .from(tableName)
        .update({
          is_promoted: true,
          promotion_expires_at: expiryTimestamp,
          promoter_email: promoterEmail,
          promotion_duration_months: durationNum // <-- ADDED THIS LINE
        })
        .eq('id', parseInt(listingId, 10))
        .select(); // Optionally select to confirm update

      if (updateError) {
        console.error(`Error updating listing ${listingId} in table ${tableName}:`, updateError);
        throw new Error(`Database update failed: ${updateError.message}`);
      }

      if (!updateData || updateData.length === 0) {
          console.warn(`Listing ID ${listingId} not found in table ${tableName} during update attempt.`);
      } else {
          console.log(`Successfully updated listing ID ${listingId} in table ${tableName} with duration ${durationNum}.`);
      }

      // --- 6. Respond successfully to Stripe ---
      console.log("Webhook processed successfully.");
      return new Response(JSON.stringify({ received: true }), { status: 200 })

    } catch (dbError) {
        console.error('Error during database update processing:', dbError);
        return new Response(`Internal Server Error: ${dbError.message}`, { status: 500 });
    }

  } else {
    console.log(`Received unhandled event type: ${receivedEvent.type}`)
    return new Response(JSON.stringify({ received: true, handled: false }), { status: 200 })
  }
})