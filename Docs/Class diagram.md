
# InfoCenter - UML Class Diagram

## 1. Class Diagram

This diagram illustrates the structure of the InfoCenter application, including its main classes, attributes, methods, and relationships between different components.

```mermaid
classDiagram
direction LR

class App {
    <<React Component>>
    -Source[] sources
    -Post[] posts
    -Tag[] tags
    -Language language
    -Theme theme
    -ViewTab currentTab
    -SortOption sortBy
    +handleAddSource()
    +handleDeleteSource()
    +handleToggleSource()
    +handleAddTag()
    +handleDeleteTag()
    +handleToggleBookmark()
    +handleToggleRead()
    +handleResetData()
}

class Source {
    +string id
    +string name
    +string handle
    +string url
    +SourcePlatform platform
    +string avatarUrl
    +string color
    +string[] tags
    +boolean enabled
    +number postCount
    +string lastUpdated
    +string description
    +boolean isDefault
}

class Post {
    +string id
    +string sourceId
    +string sourceName
    +string sourceHandle
    +SourcePlatform platform
    +string title
    +string content
    +string url
    +string publishedAt
    +string[] tags
    +boolean isPinned
    +boolean isImportant
    +boolean isRead
    +boolean isBookmarked
    +Engagement engagement
}

class Tag {
    +string id
    +string name
    +string color
    +string description
}

class Engagement {
    +number likes
    +number shares
}

class Api {
    <<REST API Service>>
    +getHealth()
    +getSources()
    +addSource()
    +toggleSource()
    +updateSourceTags()
    +deleteSource()
    +getPosts()
    +toggleBookmark()
    +toggleRead()
    +getTags()
    +addTag()
    +deleteTag()
    +savePreference()
    +resetBackend()
}

class FilterOptions {
    +string search
    +string[] mustInclude
    +string[] exclude
    +string[] selectedTags
    +string selectedPlatform
    +SortOption sortBy
    +ViewTab viewTab
}

class SourcePlatform {
    <<enumeration>>
    facebook
    instagram
    tiktok
}

class SortOption {
    <<enumeration>>
    newest
    oldest
    important
}

class ViewTab {
    <<enumeration>>
    all
    important
    unread
    bookmarked
}

class Language {
    <<enumeration>>
    en
    th
}

class Theme {
    <<enumeration>>
    dark
    light
}

App "1" o-- "0..*" Source : manages
App "1" o-- "0..*" Post : manages
App "1" o-- "0..*" Tag : manages

Source "1" --> "0..*" Post : provides

Post *-- Engagement : contains

App --> Api : uses
App --> FilterOptions : applies

Source --> SourcePlatform : uses
Post --> SourcePlatform : uses

FilterOptions --> SortOption : uses
FilterOptions --> ViewTab : uses

App --> Language : uses
App --> Theme : uses
```

## 2. Description

- **App:** Main React component that manages application state and user interactions.
- **Source:** Stores information about connected social media sources.
- **Post:** Stores social media posts, including titles, content, dates, and bookmark status.
- **Tag:** Organizes posts and sources into different categories.
- **Engagement:** Stores engagement information such as likes and shares.
- **Api:** Handles communication between the frontend and backend REST API.
- **FilterOptions:** Stores search, filtering, and sorting settings.
- **SourcePlatform:** Defines supported social media platforms.
- **SortOption:** Defines the available post sorting options.
- **ViewTab:** Defines the different feed views.
- **Language:** Defines available application languages.
- **Theme:** Defines available application themes.

## 3. Relationships

- **App – Source:** One App manages multiple Sources.
- **App – Post:** One App manages multiple Posts.
- **App – Tag:** One App manages multiple Tags.
- **Source – Post:** One Source can provide multiple Posts.
- **Post – Engagement:** Each Post contains Engagement information.
- **App – Api:** App uses the API service.
- **App – FilterOptions:** App uses FilterOptions to organize posts.
- **Source – SourcePlatform:** Each Source belongs to a social media platform.
- **Post – SourcePlatform:** Each Post belongs to a social media platform.


