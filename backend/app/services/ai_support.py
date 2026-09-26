import ollama


def generate_support_reply(
    customer_name,
    subject,
    message,
    order_info
):
    prompt = f"""
You are the AI Email Support Agent for ShopSphere, an e-commerce application.

Customer name: {customer_name}
Email subject: {subject}
Customer message: {message}

Customer order information:
{order_info}

Write a professional, friendly and concise customer support email.

Rules:
- Use the customer's name.
- Answer based only on the information provided.
- Do not invent order information.
- If the information is not available, clearly say so.
- Do not mention that you are an AI.
- Keep the response under 150 words.

Generate only the email reply.
"""

    response = ollama.chat(
        model="llama3.2:3b",
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ]
    )

    return response["message"]["content"]