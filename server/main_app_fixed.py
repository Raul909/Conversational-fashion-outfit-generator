"""
Fixed version of main_app.py for Render deployment
This file contains the necessary changes to deploy on Render.

Key Changes:
1. Port binding using environment variable
2. Cross-platform file paths using os.path
3. Better error handling for environment variables
4. Production-ready CORS configuration
5. Debug mode disabled for production
"""

from flask import Flask, request, jsonify
import os
from pathlib import Path
from dotenv import load_dotenv
import google.generativeai as genai

import requests
from bs4 import BeautifulSoup

import spacy
import re
import pandas as pd
import string

from flask_cors import CORS, cross_origin

# Get base directory for resolving paths
BASE_DIR = Path(__file__).resolve().parent

# Load environment variables (works in development with .env file)
if os.path.exists('.env'):
    load_dotenv()

# Access environment variables with error handling
token = os.environ.get("GEMINI_KEY")
if not token:
    raise ValueError("GEMINI_KEY environment variable is required!")

genai.configure(api_key=token)

# Set up the model
generation_config = {
  "temperature": 0.9,
  "top_p": 1,
  "top_k": 1,
  "max_output_tokens": 2048,
}

safety_settings = [
  {
    "category": "HARM_CATEGORY_HARASSMENT",
    "threshold": "BLOCK_MEDIUM_AND_ABOVE"
  },
  {
    "category": "HARM_CATEGORY_HATE_SPEECH",
    "threshold": "BLOCK_MEDIUM_AND_ABOVE"
  },
  {
    "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
    "threshold": "BLOCK_MEDIUM_AND_ABOVE"
  },
  {
    "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
    "threshold": "BLOCK_MEDIUM_AND_ABOVE"
  },
]

model = genai.GenerativeModel(model_name="gemini-1.0-pro",
                              generation_config=generation_config,
                              safety_settings=safety_settings)

convo = model.start_chat(history=[
])

# Create a Flask app instance
app = Flask(__name__)

# Configure CORS for production
# Get allowed origins from environment or default to localhost
ALLOWED_ORIGINS = os.environ.get('ALLOWED_ORIGINS', 'http://localhost:3000').split(',')
CORS(app, resources={r"/api/*": {"origins": ALLOWED_ORIGINS}})


def bold_text(text):
    text1 = text.replace(" **", " <b>")
    text2 = text1.replace("** ", "</b> ")
    return text2


to_bard=False
count=0
initial_prompt=None


occasion=[]
required=["occasion","location","gender","age"]
location=None
gender=None
age=None
colourset=["pink"+"black"+"purple"]
colours = " ".join(colourset)

def get_location(prompt):
    # Use cross-platform path
    csv_file_path = BASE_DIR / 'data' / 'indian_places.csv'
    
    # Verify file exists
    if not csv_file_path.exists():
        print(f"Warning: {csv_file_path} not found!")
        return None
    
    # Load the specific CSV file
    data = pd.read_csv(csv_file_path, header=None, names=['place_name'])

    # Filter the dataset to include only Indian place names
    indian_places = data['place_name']

    detected_place=None
    main_string_lower = prompt.lower()
    
    for substring in indian_places:
        if substring.strip().lower() in main_string_lower:
            detected_place = substring.strip()
            print("detected_place:", detected_place)

    return detected_place


def check_prompt(prompt):
    global to_bard
    global required
    print("checking...")

    # Use cross-platform paths for model loading
    model_occasion_path = BASE_DIR / 'models' / 'ner_model_occasion' / 'output' / 'model-best'
    
    # Check if model exists
    if not model_occasion_path.exists():
        print(f"Warning: Model not found at {model_occasion_path}")
        # You might want to download or handle this differently
    
    nlp1 = spacy.load(str(model_occasion_path))
    nlp2 = spacy.load("en_core_web_md")

    doc1 = nlp1(prompt) # input sample text

    for entity in doc1.ents:
        print("detected_occasion: ",end=" ")
        print(entity.text, entity.label_)
        occasion.append(entity.label_)

    if occasion:
        if "occasion" in required:
            required.remove("occasion")

    substrings = ["man", "woman", "girl", "boy","lady","male","female","baby"]

    main_string_lower = prompt.lower()
    global gender
    for substring in substrings:
        pattern = r'\b' + re.escape(substring.lower()) + r'\b'
        if re.search(pattern, main_string_lower):
            gender=substring
            print("detected_gender: "+gender)
    if gender:
        if "gender" in required:
            required.remove("gender")

    global location
    if not location:
        location=get_location(prompt)
    
    if location:
        if "location" in required:
            required.remove("location")
    
    pattern = r'\d+'  # Regular expression pattern for one or more digits
    global age
    if not age:
        age = re.findall(pattern, prompt)
        age2=" ".join(age)
        age=age2
        print("detected_age: "+age)
    if age:
        if "age" in required:
            required.remove("age")

    response=None  
    if not required:
        to_bard= True
        return response
    
    if required[0]=="occasion":
        response="Sure! Could you please specify the occasion for which you need an outfit? This will help me narrow down the options and suggest something appropriate.\nChoose one of the following: \n * casual \n * formal \n* party \n* traditional"
    elif required[0]=="gender":
        response="Great! Now, could you also let me know your gender? This will help me tailor the outfit suggestions to your style."
    elif required[0]=="location":
        response="Thank you! Could you provide me with your location? This will help me consider the local weather and suggest outfits that are suitable for your area."
    else:
        response="Got it, thanks! Lastly, may I ask how old you are? This will help me suggest outfits that are suitable for your age."

    to_bard= False
    return response


def find_image_class(url):
    try:
        response = requests.get(url, verify=False, timeout=10)
        
        if response.status_code == 200:
            html_content = response.text
        else:
            return None
        
        soup = BeautifulSoup(html_content, 'html.parser')
        img_tags = soup.find_all('img', class_='_2r_T1I')
        img_tags2 = soup.find_all('img', class_='_396cs4')
        img_urls=[]  

        if img_tags:
            img_urls = [img['src'] for img in img_tags[:5]]  # Get top 5 image URLs
            for image in img_urls:
                print(image)
        elif img_tags2:
            img_urls = [img['src'] for img in img_tags2[:5]]  # Get top 5 image URLs
            for image in img_urls:
                print(image)
        print("printing each result: ")   
        print(img_urls)
        return img_urls
    except Exception as e:
        print(f"Error scraping {url}: {e}")
        return []


def identify_image_class(all_generated_urls):
    all_image_urls = []
    for i in all_generated_urls:
        url = i  # Use the actual URL here
        img_urls = []
        result = find_image_class(url)
    
        if result:
            all_image_urls.append(result)
    print("printing all urls:")
    print(all_image_urls)

    return all_image_urls


def get_filtered_list(item_list):
    nlp = spacy.load("en_core_web_sm")

    # Define your custom stopwords
    custom_stopwords = ['matching','complete','look']

    # Define a translation table to remove punctuations
    translator = str.maketrans("", "", string.punctuation)

    # Extend the stopwords list
    nlp.Defaults.stop_words |= set(custom_stopwords)

    filtered_list=[]

    for item in item_list:
        # Process the text with spaCy
        doc = nlp(item)

        # Create a list of tokens without stopwords and punctuations
        filtered_tokens = [token.text.translate(translator) for token in doc if not token.is_stop]

        # Join the filtered tokens back into a sentence
        filtered_sentence = ' '.join(filtered_tokens)

        filtered_list.append(filtered_sentence)
    print("stopwords filtered list:")
    print(filtered_list)
    return filtered_list


from collections import defaultdict
import nltk
from nltk.tokenize import word_tokenize
from collections import defaultdict
from urllib.parse import quote


def generate_flipkart_url(search_query, filters):
    base_url = "https://www.flipkart.com/search?q="
    search_query = quote(search_query)
    url = f"{base_url}{search_query}&otracker=search&otracker1=search&marketplace=FLIPKART&as-show=off&as=off"

    if filters:
        filter_string = "&" + "&".join(filters)
        url += filter_string

    return url


def extract_keywords(user_query, keyword_lists):
    tokens = word_tokenize(user_query)
    keywords = defaultdict(list)
    
    for token in tokens:
        for keyword_type, keyword_list in keyword_lists.items():
            if token.lower() in keyword_list:
                keywords[keyword_type].append(token.lower())
                
    return keywords

def capitalize_first_letter(keyword_list):
    capitalized_keywords = []
    for keyword in keyword_list:
        capitalized_keyword = keyword.capitalize() if isinstance(keyword, str) else keyword
        capitalized_keywords.append(capitalized_keyword)
    return capitalized_keywords


def generate_urls(filtered_list):
    all_generated_urls = []
    # Example user query
    for i in filtered_list:
        user_query = i

        # Keyword lists for different categories
        keyword_lists = {
        "gender":["Men","Women","Boys","Girls","Baby Boys","Unisex","Baby Boys & Baby Girls","Boys & Girls","Baby Girls"],
        "occasion": ["party", "casual", "formal", "beach", "wedding", "lounge", "sports","festive"],
        "color": ["Black","Pink","Multicolor","Blue","Yellow","White","Beige","Brown","Dark Blue","Dark Green","Gold","Green","Grey","Light Blue","Light Green","Maroon","Orange","Purple","Red","Cream","Magenta","Mustard","Silver","Khaki","Dark Grey"],
        "type": ["Maxi","A-line","Fit and Flare","Bodycon","Kaftan","Shirt","Asymmetric","Blouson","Cinched Waist","Co-ords","Drop Waist","Empire Waist","Ethnic Dress","Gathered","Gown","High Low","Layered","Peplum","Pleated","Ribbed,Ruffled","Sheath","Sheer","Skater","Sweater","T Shirt,Tiered","Two Piece Dress","Wrap","Tank Top"],

        "dress_length": ["midi", "mini", "ankle", "below knee","knee length","above knee","ankle length"],

        "sleeve length": ["Full Sleeve","3/4 Sleeve","Half Sleeve","Short Sleeve","Sleeveless","Roll-up Sleeve","3/4th Sleeve","sleeveless", "short", "long", "half"],

        "pattern": ["Solid","Washed","Ethnic Motifs","Ombre","Chevron/Zig Zag","Animal Print","Checkered","Colorblock","Embellished","Embroidered","Floral Print","Geometric Print","Graphic Print","Polka Print","Printed","Self Design","Striped","Tie & Dye","Woven Design","Military Camouflage","Color Block","Dyed/Ombre","Applique","Chevron","Embossed","Houndstooth","Lace","Laser Cut","Paisley","Tribal","Woven","solid", "floral", "striped", "chevron","embroidered"],

        "neck": ["v-neck", "scoop neck", "round neck", "boat", "halter neck", "sweetheart neck","u-shaped","sphagetti","choker neck","asymmetric","high neck","keyhole","ruffle","square"]
        }

        # Extracted keywords
        extracted_keywords = extract_keywords(user_query, keyword_lists)
        print("for item:")
        print(i)
        print("Extracted Keywords:", extracted_keywords)

        # Capitalize the extracted keywords
        capitalized_keywords = {category: capitalize_first_letter(values) for category, values in extracted_keywords.items()}

        filters = []

        for category, values in capitalized_keywords.items():
            if values:
                encoded_values = [quote(value) for value in values]
                filters.append(f"p%5B%5D=facets.{category}%255B%255D%3D{','.join(encoded_values)}")

        flipkart_url = generate_flipkart_url(user_query, filters)
        flipkart_url += "&sort=popularity" 
        all_generated_urls.append(flipkart_url)
    print("printing flipkart urls:")
    print(all_generated_urls)
    return all_generated_urls


def get_answer_bard(prompt):

    prompt+=", suggest a single outfit specifically with details in 4 points as top, bottom, shoes and accessories. Do not give additional tips and information. Keep your response very short within 100 words."

    print("prompt:")
    print(prompt)

    convo.send_message(prompt)
    result=convo.last.text

    print("gemini response:")
    print(result)
    bard_response = result

    output = ""
    lines = bard_response.split('\n\n')[:3]

    for line in lines:
        line = line.strip()
        output += line + '\n\n'

    bard_response=output
    print("bard response output:")
    print(output)

    item_list = []
    lines = output.split('\n')

    for line in lines:
        line = line.strip()
        print("printing line:")
        print(line)
        if line.startswith('*'):
            item_parts = line.split(':**')
            if len(item_parts) > 1:
                item_list.append(item_parts[1].strip())
            else:
                item_list.append(line.split('*')[1].strip())

    print(item_list)

    filtered_list=get_filtered_list(item_list)

    all_generated_urls=generate_urls(filtered_list)

    product_urls=identify_image_class(all_generated_urls)

    lines = bard_response.split("\n")
    filtered_lines = [line for line in lines if not line.startswith("[Image")]
    filtered_response = "\n".join(filtered_lines)
    bold_resp=bold_text(filtered_response)

    lines2 = bold_resp.split('\n')

    new_resp=""
    ind=-1
    for line in lines2:
        line = line.strip()
        if line.startswith('*'):
            ind+=1
            new_resp+=line+'\n <div class="flex m-2">'
            if ind < len(product_urls):
                for url in product_urls[ind]:
                    new_resp+='<img class="m-2" src=\"'+url+'\" width="200" height="600">'
            new_resp+='</div>\n'

        else:
            new_resp+=line+'\n'
    print("printing new response:")
    print(new_resp)
    return new_resp


@app.route("/api/recommendations", methods=["POST"])
@cross_origin(origin="*")
def get_recommendations():
    user_message = request.json["userMessage"]
    global count

    if user_message:

        if to_bard==False:
                
            count+=1
            if count==1:
                global initial_prompt
                initial_prompt=user_message
            resp=check_prompt(user_message)
            if to_bard==True:
                
                occasion2=" ".join(occasion)
                print("Finally...")
                print("detected_occasion: "+occasion2)
                print("detected_age: "+age)
                print("detected_gender: "+gender)
                print("detected_location: "+location)
                user_message=initial_prompt+" I am "+age+" years old "+gender+" from "+location+", occasion is "+occasion2+", my colour preferences are "+colours

            else:
                bot_response=resp
                
                
        if to_bard==True:
            bot_response=get_answer_bard(user_message)
        
    
    return jsonify({"bot_response": bot_response})


if __name__ == '__main__':
    # Get port from environment variable (Render sets this)
    port = int(os.environ.get('PORT', 5000))
    
    # Use 0.0.0.0 to allow external connections
    # Set debug=False for production
    debug_mode = os.environ.get('FLASK_DEBUG', 'False').lower() == 'true'
    
    print(f"Starting Flask app on port {port}")
    app.run(host='0.0.0.0', port=port, debug=debug_mode)
