# """
# At the command line, only need to run once to install the package via pip:

# $ pip install google-generativeai
# """
# import os
# from dotenv.main import load_dotenv
# import google.generativeai as genai

# # Load environment variables if needed
# load_dotenv()

# # Access environment variables
# token = os.environ.get("GEMINI_KEY")

# genai.configure(api_key=token)

# # Set up the model
# generation_config = {
#   "temperature": 0.9,
#   "top_p": 1,
#   "top_k": 1,
#   "max_output_tokens": 2048,
# }

# safety_settings = [
#   {
#     "category": "HARM_CATEGORY_HARASSMENT",
#     "threshold": "BLOCK_MEDIUM_AND_ABOVE"
#   },
#   {
#     "category": "HARM_CATEGORY_HATE_SPEECH",
#     "threshold": "BLOCK_MEDIUM_AND_ABOVE"
#   },
#   {
#     "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
#     "threshold": "BLOCK_MEDIUM_AND_ABOVE"
#   },
#   {
#     "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
#     "threshold": "BLOCK_MEDIUM_AND_ABOVE"
#   },
# ]

# model = genai.GenerativeModel(model_name="gemini-1.0-pro",
#                               generation_config=generation_config,
#                               safety_settings=safety_settings)

# convo = model.start_chat(history=[
# ])

# convo.send_message("how is the weather?")
# print(convo.last.text)

import os
from dotenv import load_dotenv # Standard import
import google.generativeai as genai

# 1. Load environment variables
load_dotenv()
token = os.environ.get("GEMINI_KEY")

if not token:
    print("Error: GEMINI_KEY not found in environment variables.")
    exit()

genai.configure(api_key=token)

# 2. Set up the model (Updated to 1.5 Flash)
# We can usually skip explicit generation_config for basic use, 
# but here is a balanced config:
generation_config = {
  "temperature": 0.7,
  "top_p": 0.95,
  "top_k": 40,
  "max_output_tokens": 2048,
}

# Safety settings (Simplified for readability)
safety_settings = [
  {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
  {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
  {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
  {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
]

model = genai.GenerativeModel(
    model_name="gemini-1.5-flash", # Newer, faster model
    generation_config=generation_config,
    safety_settings=safety_settings
)

# 3. Start Chat
convo = model.start_chat(history=[])

# Note: The model cannot provide real-time weather without tools. 
# Changing the prompt to something the model can answer internally.
prompt = "Explain how clouds are formed in one sentence."

print(f"User: {prompt}")
convo.send_message(prompt)
print(f"Gemini: {convo.last.text}")