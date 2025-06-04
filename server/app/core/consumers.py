from channels.generic.websocket import AsyncWebsocketConsumer
import json
from django.contrib.auth import get_user_model
from .models import Message, ConversationState, SystemContext
from .serializers import MessageSerializer
from asgiref.sync import sync_to_async
from oauth2_provider.models import AccessToken
from django.utils import timezone
import logging
from .services.AI_service import AIService
import asyncio

logger = logging.getLogger(__name__)
User = get_user_model()

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        query_string = self.scope['query_string'].decode('utf-8')
        token = None
        for param in query_string.split('&'):
            if param.startswith('token='):
                token = param.split('=')[1]
                break

        if not token:
            logger.error("No token provided in WebSocket connection")
            await self.close()
            return

        logger.info(f"Attempting to connect with token: {token}")
        access_token = await sync_to_async(AccessToken.objects.select_related('user').get)(
            token=token,
            expires__gt=timezone.now()
        )

        if not access_token:
            logger.error(f"Invalid or expired token: {token}")
            await self.close()
            return

        self.user = access_token.user
        self.room_group_name = f"chat_{self.user.id}"

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        if self.user.is_admin:
            await self.channel_layer.group_add("chat_admin", self.channel_name)

        logger.info(f"User {self.user.email} connected to room {self.room_group_name}")
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
        if self.user and self.user.is_admin:
            await self.channel_layer.group_discard("chat_admin", self.channel_name)
        logger.info(f"User disconnected with code {close_code}")

    async def receive(self, text_data):
        if not self.user:
            logger.warning("Unauthorized user tried to send message")
            return

        data = json.loads(text_data)
        conversation_state_id = data.get('conversation_state_id')
        content = data.get('content')

        if not conversation_state_id or not content:
            logger.error("Missing conversation_state_id or content in message")
            return

        try:
            conversation_state = await sync_to_async(ConversationState.objects.select_related('user').get)(
                id=conversation_state_id
            )
            
            sender = self.user
            message = await sync_to_async(Message.objects.create)(
                conversation_state=conversation_state,
                sender=sender,
                content=content,
                is_from_ai=False
            )

            conversation_state.last_message_at = message.created_at
            await sync_to_async(conversation_state.save)()

            student_user_id = conversation_state.user.id
            serialized_message = await sync_to_async(lambda: MessageSerializer(message).data)()

            await self.channel_layer.group_send(
                f"chat_{student_user_id}",
                {"type": "chat_message", "message": serialized_message}
            )
            await self.channel_layer.group_send(
                "chat_admin",
                {"type": "chat_message", "message": serialized_message}
            )

            if not self.user.is_admin and not conversation_state.is_admin_handling:
                await self.schedule_ai_response(conversation_state_id, student_user_id)
            else:
                print(f"Skipping AI response for conversation {conversation_state_id} because is_admin_handling={conversation_state.is_admin_handling}")

        except Exception as e:
            logger.error(f"Error sending message: {str(e)}")

    async def schedule_ai_response(self, conversation_state_id, student_user_id):
        conversation_state = await sync_to_async(ConversationState.objects.select_related('user').get)(
            id=conversation_state_id
        )
        last_message = await sync_to_async(Message.objects.filter(
            conversation_state=conversation_state
        ).order_by('-created_at').first)()

        if last_message and (timezone.now() - last_message.created_at).seconds >= 10:
            await self.handle_ai_response(conversation_state, student_user_id)

    async def handle_ai_response(self, conversation_state, student_user_id):
        recent_messages = await sync_to_async(lambda: list(
            Message.objects.filter(conversation_state=conversation_state).order_by('-created_at')[:10]
        ))()

        print(f"Handling AI response for conversation {conversation_state.id} with {len(recent_messages)} recent messages.")
        ai_response = await AIService.get_ai_response(conversation_state, recent_messages)

        if ai_response is None:
            conversation_state.is_admin_handling = True
            await sync_to_async(conversation_state.save)()
            ai_response = "Xin vui lòng chờ quản trị viên phản hồi."

        ai_message = await sync_to_async(Message.objects.create)(
            conversation_state=conversation_state,
            sender=None,
            content=ai_response,
            is_from_ai=True
        )

        if "Xin vui lòng chờ quản trị viên phản hồi" in ai_response:
            conversation_state.is_admin_handling = True
            ai_message.is_pending_admin = True
            await sync_to_async(ai_message.save)()
        else:
            conversation_state.is_admin_handling = False
            conversation_state.last_message_at = ai_message.created_at
        await sync_to_async(conversation_state.save)()

        serialized_message = await sync_to_async(lambda: MessageSerializer(ai_message).data)()
        await self.channel_layer.group_send(
            f"chat_{student_user_id}",
            {"type": "chat_message", "message": serialized_message}
        )
        await self.channel_layer.group_send(
            "chat_admin",
            {"type": "chat_message", "message": serialized_message}
        )

    async def chat_message(self, event):
        message = event['message']
        await self.send(text_data=json.dumps({'message': message}))