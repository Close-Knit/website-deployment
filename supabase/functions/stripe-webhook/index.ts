// supabase/functions/stripe-webhook/index.ts

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import Stripe from 'npm:stripe@^14' // Use npm specifier
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2' // Import Supabase client library

console.log(`Stripe Webhook Function Initializing`)

// Get required environment variables from Supabase secrets
const stripeApiKey = Deno.env.get('STRIPE_SECRET_KEY');
const webhookSigningSecret = Deno.env.get('STRIPE_WEBHOOK_SIGNING_SECRET'); // We will set this later!
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'); // Use Service Role Key for backend updates

// Validate required secrets
if (!stripeApiKey || !webhookSigningSecret || !supabaseUrl || !supabaseServiceKey) {
  console.error('Missing one or more required environment variables (Stripe keys, Webhook Secret, Supabase URL/Service Key).')
  // Cannot proceed without secrets
  throw new Error("Function configuration error: Missing secrets.");
}

// Initialize Stripe client
const stripe = new Stripe(stripeApiKey, {
  apiVersion: '2022-11-15',
  // No httpClient needed with npm:stripe
});

// Initialize Supabase Admin Client (use Service Role Key for backend operations)
// This allows the function to bypass Row Level Security if needed for updates
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req: Request) => {
  const signature = req.headers.get('Stripe-Signature')
  const body = await req.text() // Read body as text first for verification

  if (!signature) {
    console.error('Stripe-Signature header missing!');
    return new Response('Stripe-Signature header required', { status: 400 })
  }

  let receivedEvent: Stripe.Event;

  try {
    // --- 1. Verify the webhook signature ---
    console.log("Verifying Stripe webhook signature...");
    receivedEvent = await stripe.webhooks.constructEventAsync(
      body,               // The raw request body (text)
      signature,          // The signature header value
      webhookSigningSecret // Your webhook signing secret
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
      return new Response('Metadata missing', { status: 400 }); // Bad request - essential info missing
    }

    const listingId = metadata.listing_id;
    const tableName = metadata.table_name;
    const communityId = metadata.community_id; // Optional, but good for logging/context
    const promoterEmail = metadata.promoter_email; // Get email from metadata

    console.log("Extracted Metadata:", metadata);

    // Validate essential metadata
    if (!listingId || !tableName || !promoterEmail) {
      console.error("Essential metadata (listing_id, table_name, promoter_email) missing:", metadata);
      return new Response('Essential metadata missing', { status: 400 });
    }

    try {
      // --- 4. Calculate expiry date (e.g., 1 month from now) ---
      const now = new Date();
      // Set expiry to roughly 30 days from now. Adjust logic if specific "end of month" is needed.
      const expiryDate = new Date(now.setDate(now.getDate() + 30));
      // Format for Supabase timestampz column (ISO 8601 format)
      const expiryTimestamp = expiryDate.toISOString();
      console.log(`Calculated expiry timestamp: ${expiryTimestamp}`);

      // --- 5. Update the correct listing in the Supabase database ---
      // IMPORTANT: Use the 'tableName' variable dynamically
      console.log(`Attempting to update listing ID ${listingId} in table ${tableName}`);
      const { data: updateData, error: updateError } = await supabaseAdmin
        .from(tableName) // Dynamic table name
        .update({
          is_promoted: true,
          promotion_expires_at: expiryTimestamp,
          promoter_email: promoterEmail // Store the email
        })
        .eq('id', parseInt(listingId, 10)) // Match the specific listing ID (ensure it's parsed as integer if DB column is int)
        .select() // Optionally select the updated row to confirm

      if (updateError) {
        console.error(`Error updating listing ${listingId} in table ${tableName}:`, updateError);
        // Don't automatically fail the webhook response here, Stripe might retry.
        // Log the error for investigation. Depending on the error, you might want to return 500.
        // For critical DB errors, returning 500 might be appropriate so Stripe knows processing failed.
        throw new Error(`Database update failed: ${updateError.message}`); // Throw to be caught below
      }

      if (!updateData || updateData.length === 0) {
          console.warn(`Listing ID ${listingId} not found in table ${tableName} during update attempt.`);
          // Decide how to handle: Maybe it was deleted? Log it. Don't throw error to Stripe.
      } else {
          console.log(`Successfully updated listing ID ${listingId} in table ${tableName}. Result:`, updateData);
      }

      // --- 6. Respond successfully to Stripe ---
      console.log("Webhook processed successfully.");
      return new Response(JSON.stringify({ received: true }), { status: 200 })

    } catch (dbError) {
        // Catch errors during the DB update phase
        console.error('Error during database update processing:', dbError);
        // Return 500 to indicate server-side processing error to Stripe
        return new Response(`Internal Server Error: ${dbError.message}`, { status: 500 });
    }

  } else {
    // Handle other event types if needed in the future
    console.log(`Received unhandled event type: ${receivedEvent.type}`)
    return new Response(`Unhandled event type: ${receivedEvent.type}`, { status: 400 })
  }
})