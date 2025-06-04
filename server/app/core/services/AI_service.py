from openai import OpenAI, AuthenticationError, RateLimitError, APIError, APIConnectionError
from django.conf import settings
from core.models import SystemContext
from asgiref.sync import sync_to_async

class AIService:
    @staticmethod
    async def get_ai_response(conversation_state, recent_messages):
        print("Starting AI response generation...")
        client = OpenAI(api_key=settings.OPENAI_API_KEY)

        if not settings.OPENAI_API_KEY:
            raise ValueError("OPENAI_API_KEY is not set in settings")

        system_contexts = await sync_to_async(lambda: list(
            SystemContext.objects.filter(is_active=True)[:50] 
        ))()

        context = (
            "Bạn là trợ lý AI của ký túc xá cho sinh viên. Mục tiêu của bạn là hỗ trợ sinh viên trong việc giải đáp thắc mắc và cung cấp thông tin hữu ích. Hãy trả lời ngắn gọn, lịch sự và chuyên nghiệp.\n"
            "Chỉ sử dụng các quy định dưới đây để trả lời câu hỏi của sinh viên. Ưu tiên câu hỏi mới nhất trong lịch sử tin nhắn.\n"
            "Nếu câu hỏi không liên quan hoặc không tìm thấy thông tin trong quy định, phải trả lời: 'Xin vui lòng chờ quản trị viên phản hồi.'\n\n"
            "Các quy định của ký túc xá:\n"
        )
        if system_contexts:
            context += "\n".join([f"- {ctx.content}" for ctx in system_contexts])
        else:
            context += "Không có quy định cụ thể."

        filtered_messages = []
        recent_messages = recent_messages[:5]  
        for msg in reversed(recent_messages):  
            content = msg.content.strip()
            if len(content) < 3 or content.lower() in ["ok", "vui", "nhanh", "nói"]:
                continue
            role = "assistant" if msg.is_from_ai else "user"
            filtered_messages.insert(0, {"role": role, "content": content})  

        messages_for_ai = [{"role": "system", "content": context}]
        messages_for_ai.extend(reversed(filtered_messages)) 

        print("Messages sent to AI:", messages_for_ai)

        try:
            response = await sync_to_async(client.chat.completions.create)(
                model="gpt-4-turbo",
                messages=messages_for_ai,
                max_tokens=4096,
                temperature=0.3,
                top_p=0.9,
            )
            ai_response = response.choices[0].message.content.strip()
            print("AI response generated successfully.", ai_response)
            return ai_response
        except Exception as e:
            print(f"Unexpected Error in AI response: {str(e)}")
            return "Hệ thống bị lỗi. Xin vui lòng chờ quản trị viên phản hồi."