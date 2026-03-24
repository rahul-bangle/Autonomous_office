import os
from dotenv import load_dotenv
load_dotenv()
print(f"URL: {os.environ.get('SUPABASE_URL')}")
print(f"KEY: {os.environ.get('SUPABASE_KEY')}")
print(f"VITEURL: {os.environ.get('VITE_SUPABASE_URL')}")
print(f"VITEKEY: {os.environ.get('VITE_SUPABASE_ANON_KEY')}")
