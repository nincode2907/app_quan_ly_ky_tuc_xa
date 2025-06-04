import openai
from django.conf import settings
from core.models import SystemContext, Message
from asgiref.sync import sync_to_async

class AIService:
    @staticmethod
    async def get_ai_response(conversation_state, recent_messages):
        openai.api_key = settings.OPENAI_API_KEY

        system_contexts = await sync_to_async(lambda: list(
            SystemContext.objects.filter(is_active=True)
        ))()

        context = "Bạn là trợ lý AI của ký túc xá. Hãy trả lời lịch sự và chuyên nghiệp.\n"
        if system_contexts:
            context += "Đây là các ngữ cảnh, quy định, nội quy của ký túc xá:\n" + "\n".join(
                [f"- {ctx.content}" for ctx in system_contexts]
            ) + "\nNếu không tìm thấy thông tin, trả lời: 'Xin vui lòng chờ quản trị viên phản hồi.'"
        else:
            context += "Nếu không tìm thấy thông tin, trả lời: 'Xin vui lòng chờ quản trị viên phản hồi.'"

        messages_for_ai = [{"role": "system", "content": context}]
        for msg in recent_messages:
            role = "assistant" if msg.is_from_ai else "user"
            messages_for_ai.append({"role": role, "content": msg.content})

        try:
            response = await sync_to_async(openai.ChatCompletion.create)(
                model="gpt-3.5-turbo",
                messages=messages_for_ai,
                max_tokens=500,
                temperature=0.7,
            )
            return response.choices[0].message['content'].strip()
        except Exception as e:
            print(f"Error in AI response: {str(e)}")
            return None