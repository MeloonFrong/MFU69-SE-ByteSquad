# InfoCenter Component Diagram

## Component Diagram - InfoCenter Architecture

```mermaid
flowchart TB
    User([User])

    subgraph Frontend["InfoCenter Frontend"]
        Main["main.tsx"]
        App["App.tsx - Root Component"]

        subgraph UI["UI Components"]
            Navbar["Navbar.tsx"]
            Tabs["FeedTabs.tsx"]
            Filter["FilterSidebar.tsx"]
            Post["PostCard.tsx"]
            Add["AddSourceModal.tsx"]
            ManageS["ManageSourcesModal.tsx"]
            ManageT["ManageTagsModal.tsx"]
            About["AboutModal.tsx"]
        end

        subgraph Data["Frontend Data Layer"]
            API["api.ts - REST API Client"]
            Mock["mockData.ts - Mock Data"]
            Types["types.ts - Shared Types"]
            Trans["translations.ts - Thai / English"]
        end

        Storage[("localStorage - Theme")]
    end

    Backend["Python Backend - Planned"]

    User --> Main
    Main --> App
    App --> Navbar
    App --> Tabs
    App --> Filter
    App --> Post
    App --> Add
    App --> ManageS
    App --> ManageT
    App --> About

    App --> API
    App --> Mock
    App --> Types
    App --> Trans
    App <--> Storage

    API -.->|"When available"| Backend
    API -.->|"Fallback"| Mock
```
## Diagram Description

This diagram illustrates the overall architecture of InfoCenter, including its frontend components, data layer, local storage, and planned Python backend. It shows how the main application connects with different components to provide the platform's features.
