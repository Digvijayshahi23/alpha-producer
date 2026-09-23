import sys
import os

# Add src to the Python path so absolute imports like `from alpha_harness...` work on Vercel
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), 'src')))

from alpha_harness.main import app
