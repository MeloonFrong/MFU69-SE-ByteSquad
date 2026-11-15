
# InfoCenter UML Deployment Diagram

## 1. Deployment Diagram

This diagram illustrates the deployment architecture
of the InfoCenter application.

```mermaid
flowchart TB
    U[User]
    B[Web Browser]
    F[React Frontend]
    V[Vite Development Server :3000]
    API[Python Backend REST API :5030]
    M[Mock Data]

    U --> B
    B --> F
    F --> V
    V --> API
    F -. Backend unavailable .-> M
```

## 2. Description

- User: Accesses the application.
- Web Browser: Runs the frontend.
- React Frontend: Displays the user interface.
- Vite Server: Serves the frontend application.
- Python Backend: Provides REST API services.
- Mock Data: Provides fallback sample data.
