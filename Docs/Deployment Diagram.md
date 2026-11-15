
# InfoCenter - UML Deployment Diagram

## 1. Deployment Diagram

This diagram illustrates the deployment architecture of the InfoCenter application, including the client device, frontend application, development server, and backend services.

```mermaid
flowchart LR

    User(["User"])

    subgraph Client["Client Device"]
        direction TB

        subgraph Browser["Web Browser"]
            direction TB

            Frontend["InfoCenter Web Interface<br/>React 18 + TypeScript"]

            UI["UI Components"]

            Logic["Application Logic<br/>App.tsx"]

            API["API Client<br/>api.ts"]

            Storage[("Browser LocalStorage")]

            Frontend --> UI
            UI --> Logic
            Logic --> API
            Logic --> Storage
        end
    end

    subgraph Server["Development Computer / Server"]
        direction LR

        subgraph Vite["Vite Development Server<br/>Port 3000"]
            Build["Frontend Build<br/>HTML, CSS, JavaScript"]
        end

        subgraph Backend["Python Backend Server<br/>Port 5030"]
            REST["REST API<br/>/api/*"]
        end

        Mock[("Mock Data<br/>mockData.ts")]
    end

    User --> Frontend
    API -->|"HTTP Requests"| Vite
    Vite -->|"Proxies /api/*"| Backend
    API -.->|"Fallback when backend unavailable"| Mock

    classDef user fill:#e8eaff,stroke:#8264db,stroke-width:2px,color:#222
    classDef frontend fill:#e8eaff,stroke:#8264db,stroke-width:2px,color:#222
    classDef component fill:#f2edff,stroke:#9b7bea,stroke-width:1.5px,color:#222
    classDef server fill:#e5f4ff,stroke:#4285b4,stroke-width:2px,color:#222
    classDef database fill:#e5f4ff,stroke:#4285b4,stroke-width:2px,color:#222

    class User user
    class Frontend frontend
    class UI,Logic,API component
    class Build,REST server
    class Storage,Mock database
```

## 2. Description

- **User:** Accesses the InfoCenter application.
- **Client Device:** The device used to access the application.
- **Web Browser:** Runs the frontend application.
- **React Frontend:** Displays the user interface.
- **UI Components:** Displays individual interface elements.
- **Application Logic:** Handles application operations through App.tsx.
- **API Client:** Communicates with backend services through api.ts.
- **Browser LocalStorage:** Saves user preferences.
- **Vite Development Server:** Serves the frontend on port 3000.
- **Python Backend Server:** Provides REST API services on port 5030.
- **Mock Data:** Provides fallback data when the backend is unavailable.
