# 53. Final Error & Exception Catalog

## 1. Exception Handling Architecture

Every custom application exception inherits from `AppException` in `apps.api.app.core.exceptions` and maps to a consistent JSON error structure:

```json
{
  "success": false,
  "error": {
    "code": "<ERROR_CODE>",
    "message": "<Human-readable explanatory message>",
    "details": []
  }
}
```

---

## 2. Error Catalog

| Error Code | HTTP Status | Exception Class | Description & Common Trigger |
|---|:---:|---|---|
| `AUTHENTICATION_ERROR` | 401 | `AuthenticationError` | Missing, expired, or invalid JWT Bearer token |
| `PERMISSION_DENIED` | 403 | `PermissionDeniedError` | Authenticated user lacks the necessary permission token |
| `ENTITY_NOT_FOUND` | 404 | `EntityNotFoundError` | Resource identifier (UUID) does not exist in the database |
| `BUSINESS_RULE_VIOLATION` | 400 | `BusinessRuleViolationError` | Attempt to violate domain constraints (e.g., over-allocation, unapproved batch, invalid ledger entry) |
| `VALIDATION_ERROR` | 422 | `RequestValidationError` | Pydantic schema validation failure on input payload |
| `DEPENDENCY_ERROR` | 409 | `WorkflowDependencyError` | Attempting to start/complete a task before prerequisite tasks finish |
| `INTERNAL_SERVER_ERROR` | 500 | `InternalServerError` | Uncaught runtime error, automatically tagged with `correlation_id` |
