from flask import Flask, render_template, request, jsonify
from groq import Groq
import random

app = Flask(__name__)

# ================= API SETUP =================
client = Groq(api_key="Groq Api Key")

# ================= MEMORY =================
chat_memory = {}
users = {}
used_ideas = {}

# ================= PROJECT DATABASE =================
project_ideas = {
    "science": [
        {"name": "Balloon Car", "desc": "Air powered car", "materials": "Balloon, straw", "working": "Air push → move"},
        {"name": "Volcano Model", "desc": "Eruption demo", "materials": "Baking soda, vinegar", "working": "Reaction → foam"},
        {"name": "Water Filter", "desc": "Clean water model", "materials": "Sand, gravel", "working": "Layer filtration"}
    ],

    "arduino": [
        {"name": "Smart Irrigation", "desc": "Auto watering", "materials": "Arduino, soil sensor", "working": "Dry soil → pump ON"},
        {"name": "Obstacle Robot", "desc": "Obstacle avoid robot", "materials": "Ultrasonic sensor", "working": "Object detect → turn"}
    ],

    "ai": [
        {"name": "Chatbot", "desc": "AI chat system", "materials": "Python", "working": "Input → reply"},
        {"name": "Voice Assistant", "desc": "AI voice system", "materials": "Mic, Python", "working": "Voice → response"}
    ]
}

# ================= MEMORY UPDATE =================
def update_memory(user_id, msg):
    if user_id not in users:
        users[user_id] = {"name": "", "class": "", "interest": ""}

    text = msg.lower()

    if "name" in text:
        users[user_id]["name"] = msg.split()[-1]

    if "class" in text:
        for i in range(1, 13):
            if str(i) in text:
                users[user_id]["class"] = str(i)

    if "interest" in text or "pasand" in text:
        users[user_id]["interest"] = msg


# ================= RESPONSE SYSTEM =================
def generate_response(user_id, user_message):

    update_memory(user_id, user_message)

    if user_id not in chat_memory:
        chat_memory[user_id] = []

    chat_memory[user_id].append({"role": "user", "content": user_message})

    msg = user_message.lower()

    # 🎯 GUIDE MODE
    guide_mode = "steps" in msg or "kaise" in msg

    # 🎯 CATEGORY
    category = None
    if "science" in msg:
        category = "science"
    elif "arduino" in msg:
        category = "arduino"
    elif "ai" in msg:
        category = "ai"

    # ================= PROJECT IDEA =================
    if "idea" in msg or category:

        if not category:
            category = random.choice(list(project_ideas.keys()))

        if user_id not in used_ideas:
            used_ideas[user_id] = []

        ideas = project_ideas[category]

        available = [i for i in ideas if i["name"] not in used_ideas[user_id]]

        if not available:
            used_ideas[user_id] = []
            available = ideas

        idea = random.choice(available)
        used_ideas[user_id].append(idea["name"])

        system_prompt = f"""
You are AI Kaushal Guru 🤖

User:
Name: {users[user_id]['name']}
Class: {users[user_id]['class']}
Interest: {users[user_id]['interest']}

👉 Project Name: {idea['name']}

👉 Description:
{idea['desc']}

👉 Materials:
{idea['materials']}

👉 Working:
{idea['working']}
"""

        if guide_mode:
            system_prompt += """

👉 Steps to Build:
1. Step-by-step explain karo
2. Simple Hinglish use karo
3. Student friendly tone

👉 Tips:
Easy hacks do

👉 Final Result:
Kya output milega
"""

        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "system", "content": system_prompt}]
        )

        reply = response.choices[0].message.content

        chat_memory[user_id].append({"role": "assistant", "content": reply})

        return reply

    # ================= NORMAL CHAT =================
    system_prompt = f"""
You are AI Kaushal Guru 🤖

User:
Name: {users[user_id]['name']}
Class: {users[user_id]['class']}
Interest: {users[user_id]['interest']}

Rules:
- Hinglish me reply karo
- Friendly teacher tone
- Short and clear answer
"""

    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[{"role": "system", "content": system_prompt}] + chat_memory[user_id][-5:]
    )

    reply = response.choices[0].message.content

    chat_memory[user_id].append({"role": "assistant", "content": reply})

    return reply


# ================= ROUTES =================
@app.route("/")
def home():
    return render_template("index.html")

@app.route("/chat", methods=["POST"])
def chat():
    data = request.json
    user_id = data.get("user_id", "user1")
    msg = data.get("message")

    return generate_response(user_id, msg)

# ================= ADMIN =================
@app.route("/admin")
def admin():
    return jsonify({
        "made_by": "ADITYA AHIRWAR",
        "guided_by": "AMIT SIR",
        "total_users": len(users),
        "users": users,
        "used_ideas": used_ideas
    })

# ================= RUN =================
if __name__ == "__main__":
    print("🚀 Kaushal AI Guru Started")
    print("👨‍💻 Made by ADITYA AHIRWAR")
    print("🎓 Guided by AMIT SIR")

    app.run(host="0.0.0.0", port=5000, debug=True)