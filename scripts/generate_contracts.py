"""Script to generate OpenAPI specification and TypeScript contracts from FastAPI."""

import json
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from apps.api.app.main import app


def export_openapi():
    print("Generating OpenAPI specification from FastAPI...")
    openapi_schema = app.openapi()

    output_path = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "../packages/api-types/openapi.json")
    )
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(openapi_schema, f, indent=2)

    print(f"✅ OpenAPI JSON exported to {output_path}")


if __name__ == "__main__":
    export_openapi()
