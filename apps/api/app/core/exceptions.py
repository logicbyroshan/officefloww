from typing import Any, Dict, List, Optional


class AppException(Exception):
    def __init__(
        self,
        message: str,
        code: str = "INTERNAL_SERVER_ERROR",
        status_code: int = 500,
        details: Optional[List[Any]] = None,
    ):
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code
        self.details = details or []


class EntityNotFoundError(AppException):
    def __init__(self, entity: str, identifier: Any):
        super().__init__(
            message=f"{entity} with id/code '{identifier}' was not found.",
            code="ENTITY_NOT_FOUND",
            status_code=404,
            details=[{"entity": entity, "identifier": str(identifier)}],
        )


class AuthenticationError(AppException):
    def __init__(self, message: str = "Invalid credentials or token expired."):
        super().__init__(
            message=message,
            code="AUTHENTICATION_FAILED",
            status_code=401,
        )


class PermissionDeniedError(AppException):
    def __init__(self, message: str = "You do not have permission to perform this action."):
        super().__init__(
            message=message,
            code="PERMISSION_DENIED",
            status_code=403,
        )


class BusinessRuleViolationError(AppException):
    def __init__(self, message: str, code: str = "BUSINESS_RULE_VIOLATION", details: Optional[List[Any]] = None):
        super().__init__(
            message=message,
            code=code,
            status_code=400,
            details=details,
        )


class ConflictError(AppException):
    def __init__(self, message: str, details: Optional[List[Any]] = None):
        super().__init__(
            message=message,
            code="CONFLICT",
            status_code=409,
            details=details,
        )


class WorkflowTransitionError(BusinessRuleViolationError):
    def __init__(self, message: str, details: Optional[List[Any]] = None):
        super().__init__(
            message=message,
            code="INVALID_WORKFLOW_TRANSITION",
            details=details,
        )
