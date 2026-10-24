"""
Vercel Serverless Function entry point for FastAPI backend.
"""
import sys
from pathlib import Path

# Add project root directory to sys.path so 'app' package is found
root_dir = str(Path(__file__).resolve().parent.parent)
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

from app.main import app
