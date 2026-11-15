# InfoCenter Sequence Diagrams

## 1. Sequence Diagram - Load Feed

```mermaid
sequenceDiagram
    actor User
    participant UI as React Frontend
    participant App as App.tsx
    participant API as api.ts
    participant Mock as mockData.ts

    User->>UI: Open InfoCenter
    UI->>App: Initialize application
    App->>API: Request feed data
    alt Backend available
        API-->>App: Return feed data
    else Backend unavailable
        API->>Mock: Load mock posts
        Mock-->>API: Return mock data
        API-->>App: Return fallback data
    end
    App-->>UI: Update application state
    UI-->>User: Display aggregated feed
```

## 2. Sequence Diagram - Add a Source

```mermaid
sequenceDiagram
    actor User
    participant UI as AddSourceModal
    participant App as App.tsx
    participant API as api.ts
    participant Mock as Mock Data

    User->>UI: Click Add Source Link
    UI-->>User: Display source form
    User->>UI: Enter social media URL
    User->>UI: Submit source
    UI->>App: Send source information
    App->>API: Add source request

    alt Backend available
        API-->>App: Return response
    else Backend unavailable
        API->>Mock: Use mock data fallback
        Mock-->>API: Return fallback result
        API-->>App: Return result
    end

    App-->>UI: Update source list
    UI-->>User: Display updated sources
```

## 3. Sequence Diagram - Filter and Search Posts

```mermaid
sequenceDiagram
    actor User
    participant UI as Feed Interface
    participant App as App.tsx
    participant Data as Feed Data

    User->>UI: Select platform or tag
    UI->>App: Update filter settings
    User->>UI: Enter search keyword
    UI->>App: Update search criteria
    App->>Data: Apply filtering criteria
    Data-->>App: Return matching posts
    App-->>UI: Update displayed feed
    UI-->>User: Show filtered posts
```
## Diagram Summary

These sequence diagrams illustrate how users interact with InfoCenter. They cover loading the feed, adding social media sources, and filtering or searching posts.
