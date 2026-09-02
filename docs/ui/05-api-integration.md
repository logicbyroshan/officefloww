# 05 - Backend API Integration & Services

## Overview
The Desktop UI strictly integrates with the FastAPI backend modular monolith over HTTP/JSON REST. All data transfers use strongly-typed contracts generated directly from backend schemas.

## OpenAPI Contract Generation
The contracts are exported using `scripts/generate_contracts.py` into `@officefloww/api-types` and `@officefloww/api-client`.

## Standard API Response Envelope
Every backend response follows a unified envelope structure:
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "page_size": 20,
    "total": 1
  }
}
```
Or for errors:
```json
{
  "success": false,
  "error": {
    "code": "AUTHENTICATION_FAILED",
    "message": "Invalid email or password",
    "details": null
  }
}
```

## Singleton API Client & Interceptors
The client is instantiated via `src/api/client.ts`:
- Automatically checks for `officefloww_access_token` in local storage.
- Attaches `Authorization: Bearer <token>` header to all outgoing requests.
- Intercepts 401 Unauthorized errors and gracefully transitions the user to the login workstation.

## Domain Service Wrappers
Domain operations are cleanly segregated in `src/api/services.ts`:
- `OrdersService`: `list()`, `get()`, `create()`, `getItems()`, `getWorkflow()`, `getTasks()`
- `TasksService`: `list()`, `get()`, `complete()`, `addBlocker()`, `resolveBlocker()`, `addComment()`
- `ApprovalsService`: `list()`, `approve()`, `reject()`, `request()`
- `ClientsService`: `list()`, `get()`, `create()`, `addContact()`
- `ProductsService`: `list()`, `get()`, `create()`, `addBOM()`
- `FilesService`: `getOrderFiles()`, `getOrderWorkspace()`, `getVersions()`
- `QuantitiesService`: `getSummary()`, `record()`
- `SearchService`: `searchAll()`
