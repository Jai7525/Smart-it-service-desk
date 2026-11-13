"""
Top-level entry point so `uvicorn main:app` works directly from the root project directory.
"""
from smart_ticket.main import app

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8080, reload=True)

