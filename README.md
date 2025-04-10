```mermaid
graph TD
    %% Define Main Actors/Services
    User[fa:fa-user User]
    Developer[fa:fa-user-cog Developer]
    Browser[fa:fa-window-maximize Browser]
    Netlify[fa:fa-server Netlify Hosting]
    GitHub[fa:fa-github GitHub Repository]
    Git[fa:fa-code-branch Git Local]
    Supabase[fa:fa-database Supabase Backend DB]  %% Removed parentheses
    CDN[fa:fa-cloud CDN Libraries]            %% Removed parentheses

    %% Define Components within Browser
    subgraph Browser Client
        HTML(index.html / community.html)
        CSS(styles.css)
        JS(home.js / directory.js)
        Logos(images/logos/*)
        Libs(Supabase-JS / FontAwesome)
    end

    %% Define Interactions
    User -- 1. Request Site --> Browser;
    Developer -- A. Code Changes --> Git;
    Git -- B. Push --> GitHub;
    GitHub -- C. Deploy Trigger (Webhook) --> Netlify;
    Netlify -- D. Build & Deploy Files --> Netlify;
    Netlify -- 2. Serves Files (HTML, CSS, JS, Images) --> Browser;
    Browser -- 3. Loads External Libs --> CDN;
    Browser -- 4. Executes JS --> JS;

    subgraph Data Flow
      JS -- 5. API Call Fetch Provinces/Communities --> Supabase; %% Added text to arrows
      JS -- 7. API Call Fetch Community ID/Logo --> Supabase;
      JS -- 9. API Call Fetch Listings --> Supabase;
      Supabase -- 6. Returns Province/Community Data --> JS;
      Supabase -- 8. Returns Community ID/Logo Data --> JS;
      Supabase -- 10. Returns Listings Data --> JS;
    end

    JS -- 11. Manipulates DOM --> HTML;
    CSS -- Styles --> HTML;
    HTML -- Displays Content & Logos --> User;
    Logos -- Rendered in --> HTML;
    Libs -- Used by --> JS;
    Libs -- Used by --> CSS; % FontAwesome CSS

    %% Styling (Optional - GitHub might ignore this)
    classDef service fill:#f9f,stroke:#333,stroke-width:2px;
    classDef code fill:#ccf,stroke:#333,stroke-width:2px;
    classDef user fill:#9cf,stroke:#333,stroke-width:2px;
    class Netlify,Supabase,GitHub,Git,CDN service;
    class HTML,CSS,JS,Logos,Libs code;
    class User,Developer user;
```