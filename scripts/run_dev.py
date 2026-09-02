"""Single command runner for local developer environment."""

import os
import sys
import uvicorn

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))


def main():
    print("🚀 Starting OfficeFloww FastAPI Server...")
    uvicorn.run(
        "apps.api.app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )


if __name__ == "__main__":
    main()
