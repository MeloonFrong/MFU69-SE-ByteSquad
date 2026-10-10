# Integration Work Log and Technical Report HTET WAI YAN (6931503004)

**Project:** MFU69-SE-ByteSquad
**Area:** Frontend and Backend Integration
**Branch:** `integration`
**Purpose:** Document implementation, configuration, testing, and Git records related to the integration work.

---

## 1. Overview

This document records the integration work performed for the MFU69-SE-ByteSquad prototype.

The work documented here covers the C# backend, React frontend communication, source data persistence, API endpoints, local development configuration, and verification performed during development.

The purpose is to provide a technical record that can be reviewed alongside the source code and Git history.

## 2. Backend Integration

The prototype uses a C# backend to provide API functionality to the frontend.

### Implementation

The integration work included:

- Registering the source persistence service through dependency injection.
- Implementing an API endpoint to retrieve saved sources.
- Implementing an API endpoint to add sources.
- Connecting the API endpoints to the source persistence mechanism.
- Configuring the backend for local development and testing.

### Relevant files

| File                             | Purpose                                                                   |
| -------------------------------- | ------------------------------------------------------------------------- |
| `backend/Program.cs`             | Backend configuration, dependency injection, and API endpoint definitions |
| `backend/SourceStore.cs`         | JSON-based source persistence                                             |
| `backend/ApifyDatasetService.cs` | Apify dataset integration                                                 |
| `backend/PostDataProcessor.cs`   | Post-data processing                                                      |

These files should be reviewed alongside the implementation commit to distinguish new code from existing components that were modified.

## 3. Frontend and Backend Communication

The React frontend communicates with the C# backend through API requests.

### Implementation

The integration work included:

- Connecting source submission to the backend API.
- Connecting post retrieval to the backend API.
- Configuring the Vite development server to proxy API requests to the backend.
- Running the frontend and backend locally for development and verification.

### Relevant files

| File             | Purpose                                                 |
| ---------------- | ------------------------------------------------------- |
| `src/api.ts`     | Frontend API requests                                   |
| `src/App.tsx`    | Application behavior and integration with backend data  |
| `vite.config.ts` | Frontend development server and API proxy configuration |

## 4. Source Data Persistence

A JSON-based persistence mechanism was implemented for source records.

### Expected behavior

1. The frontend submits a source through the API.
2. The backend receives the request.
3. The source persistence service saves the source data.
4. Saved sources can be retrieved through the backend API.
5. Previously saved sources remain available after the backend restarts.

### Relevant files

- `backend/SourceStore.cs`
- `backend/Program.cs`
- `backend/data/sources.json`

### Verification performed

During development, a source was added through the application, its stored data was inspected in the JSON file, and persistence was checked after restarting the backend.

This verification applies to source persistence. It does not establish that every social media source is automatically scraped.

## 5. Local Development Configuration

The frontend and backend were configured to run as separate local development processes.

| Component | Technology          | Local address            |
| --------- | ------------------- | ------------------------ |
| Frontend  | React and Vite      | `http://localhost:3000/` |
| Backend   | C# and ASP.NET Core | `http://localhost:5030`  |

The Vite development server proxies API requests to the backend.

Repository configuration work also included updating `.gitignore` to exclude generated .NET build files and local environment files.

Relevant files:

- `.gitignore`
- `backend/ApifyDatasetReader.csproj`
- `backend/Properties/launchSettings.json`
- `backend/appsettings.json`
- `vite.config.ts`

Secrets and access tokens should remain in local environment configuration rather than being committed to the repository.

## 6. Testing and Verification Record

The following checks were performed during development.

| Test                         | Verification performed                             | Recorded outcome |
| ---------------------------- | -------------------------------------------------- | ---------------- |
| Backend build                | Built the C# backend                               | Successful       |
| Source creation              | Tested adding a source through the API/application | Successful       |
| Source retrieval             | Tested retrieving saved sources                    | Successful       |
| JSON persistence             | Inspected the stored source data                   | Verified         |
| Persistence after restart    | Restarted the backend and checked saved data       | Verified         |
| Frontend and backend startup | Ran both development processes locally             | Successful       |
| Git whitespace check         | Checked staged changes before committing           | Passed           |

These outcomes reflect the checks performed during development. They are not a claim that every feature or possible error condition has been tested.

### Reproducing the tests

The tests can be repeated by:

1. Starting the C# backend.
2. Starting the React frontend.
3. Adding a test source through the application.
4. Checking whether the source appears in the stored JSON file.
5. Retrieving the saved source through the API.
6. Restarting the backend.
7. Checking whether the saved source remains available.

When repeating the tests, record the date, steps, actual response, and result. Save screenshots or terminal output where useful.

## 7. Git History and Implementation Evidence

The following commits document the integration implementation and its work log.

### Implementation commit

- **Commit:** `1934057`
- **Message:** `Integrate C# backend source persistence`
- **Branch:** `integration`

This commit records the integration implementation and associated code changes.

### Documentation commit

- **Commit:** `327f769`
- **Message:** `Document integration work and testing`
- **Branch:** `integration`

This commit records the addition of this work log.

The commit history and changed-file views can be used to inspect the recorded changes.

## 8. Scope and Limitations

The integration work described here has specific boundaries.

- Saving a source does not automatically mean the backend scrapes content from every newly added social media page.
- The Facebook post retrieval workflow uses a configured Apify dataset.
- Instagram and TikTok feeds may still use sample data.
- Local development and the tests listed above do not establish that the application has been tested in every deployment environment.

These limitations should be considered when evaluating the current state of the prototype.

## 9. Individual Contribution Record

This document is intended to make the integration implementation easier to review.

The relevant source files, Git commits, configuration, and test procedures provide supporting evidence for the work described above.

For individual assessment, the implementation commit should be examined to identify the specific changes made. Existing components, modified components, and tests should be distinguished where appropriate.

## 10. Conclusion

The integration work established a connection between the React frontend and the C# backend, added persistent storage for source records, and provided API functionality for creating and retrieving sources.

The implementation and documentation commits are available on the `integration` branch of the MFU69-SE-ByteSquad repository.

This report should be read alongside the actual source code and reproducible test results when assessing the implementation.

## Additional Integration Verification — 10 October 2026

### 1. Backend Build

**Result: Passed**

Executed:

`dotnet build backend\ApifyDatasetReader.csproj`

The C# backend compiled successfully. An earlier build attempt failed because the compiled DLL was locked by a running .NET Host process. After stopping the running backend, the build succeeded in 2.8 seconds.

### 2. Backend Source Retrieval

**Result: Passed**

Requested `GET /api/sources` from `http://localhost:5030/api/sources`.

The endpoint returned the saved `MED MFU Page` source as JSON, including its source ID, name, URL, platform, tags, enabled status, and description.

### 3. Source Persistence After Restart

**Result: Passed**

Stopped and restarted the C# backend, then requested `GET /api/sources` again.

The `MED MFU Page` record remained available with the same source ID, confirming that the source data persisted across the backend restart.

### 4. Frontend Proxy Verification

**Result: Passed**

Requested `GET /api/sources` through `http://localhost:3000/api/sources`.

The request returned the same source JSON as the backend endpoint. This confirms that the frontend's Vite proxy forwards source API requests to the C# backend successfully.

### 5. Outstanding Issue

**Status: Requires Investigation**

The browser console reported a `404 Not Found` response for `POST /api/preferences`.

This issue has not yet been investigated or resolved. The successful source API and proxy tests do not establish that the preferences endpoint works.
