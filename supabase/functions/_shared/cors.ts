// supabase/functions/_shared/cors.ts

// Define allowed origins. ** IMPORTANT: REPLACE WITH YOUR ACTUAL URLS **
const allowedOrigins = [
    'http://localhost:8888', // Default Netlify dev port
    'http://localhost:3000', // Another common dev port
    'https://bizlyca.netlify.app', // Replace with your Netlify site name
    'https://bizly.ca' // Replace with your actual custom domain if you have one
    // Add any other origins you need to allow (e.g., deploy preview URLs)
];

// Default CORS headers for all origins (less secure)
const defaultCorsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Function to generate CORS headers based on request origin
export function corsHeaders(requestOrigin: string | null): HeadersInit {
    if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
        // If the request origin is in our allowed list, allow it specifically
        return {
            'Access-Control-Allow-Origin': requestOrigin,
            'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
        };
    } else {
        // Otherwise, fall back to allowing all (less secure, good for initial testing)
        // Or you could return headers that *block* the request if origin is not allowed
        console.warn(`CORS Warning: Request from origin "${requestOrigin}" not in allowed list. Falling back to '*'. Consider adding it to allowedOrigins in _shared/cors.ts for better security.`);
        return defaultCorsHeaders;
        // For stricter production:
        // return { ...defaultCorsHeaders, 'Access-Control-Allow-Origin': allowedOrigins[0] }; // Or block entirely
    }
}