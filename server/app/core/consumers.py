from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import User
from .models import Message
import json


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope['user']
        self.group_name = f'user_{self.user.id}'
        
        # Thêm user vào group
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )
        
        # Kiểm tra nếu user là admin
        self.is_admin = await self._is_admin()
        if self.is_admin:
            # Thêm admin vào group chung của admin
            await self.channel_layer.group_add(
                'admin_group',
                self.channel_name
            )

        await self.accept()
        
    async def disconnect(self, close_code):
        # Rời group khi ngắt kết nối
        await self.channel_layer.group_discard(
            self.group_name,
            self.channel_name
        )
        if self.is_admin:
            await self.channel_layer.group_discard(
                'admin_group',
                self.channel_name
            )
            
    async def receive(self, text_data):
        data = json.loads(text_data)
        message_content = data['message']

        if not self.is_admin:
            # Sinh viên gửi tin nhắn
            # Lưu tin nhắn vào DB
            message = await self._save_message(self.user, message_content)

            # Thử để AI xử lý
            ai_response = await self._process_with_ai(message_content)
            if ai_response:
                # AI trả lời được, gửi lại cho sinh viên
                await self._save_message(None, ai_response, receiver=self.user, is_from_admin=False)
                await self.channel_layer.group_send(
                    self.group_name,
                    {
                        'type': 'chat_message',
                        'message': ai_response,
                        'sender': 'AI'
                    }
                )
            else:
                # AI không trả lời được, đánh dấu chờ admin và thông báo cho admin
                await self._update_message_status(message, 'PENDING_ADMIN')
                await self._notify_admins(message)
        else:
            # Admin gửi tin nhắn
            student_id = data['student_id']
            student = await self._get_user(student_id)
            if student:
                # Lưu tin nhắn từ admin
                message = await self._save_message(self.user, message_content, receiver=student, is_from_admin=True)
                await self._update_message_status(message, 'RESOLVED')

                # Gửi tin nhắn tới sinh viên qua group của sinh viên
                await self.channel_layer.group_send(
                    f'user_{student_id}',
                    {
                        'type': 'chat_message',
                        'message': message_content,
                        'sender': self.user.email
                    }
                )
                
    async def chat_message(self, event):
        # Gửi tin nhắn tới WebSocket client
        await self.send(text_data=json.dumps({
            'message': event['message'],
            'sender': event['sender']
        }))
        
    @database_sync_to_async
    def _save_message(self, sender, content, receiver=None, is_from_admin=False):
        return Message.objects.create(
            sender=sender if sender else User.objects.get(username='system'),
            receiver=receiver,
            content=content,
            is_from_admin=is_from_admin
        )
        
    @database_sync_to_async
    def _update_message_status(self, message, status):
        message.status = status
        message.save()
        
    @database_sync_to_async
    def _get_user(self, user_id):
        try:
            return User.objects.get(id=user_id)
        except User.DoesNotExist:
            return None
        
    @database_sync_to_async
    def _is_admin(self):
        return self.user.is_admin
    
    async def _process_with_ai(self, message_content):
        # Mô phỏng AI xử lý (có thể tích hợp AI thực tế như Grok sau này)
        if "hello" in message_content.lower():
            return "Hi! How can I help you today?"
        return None  # AI không trả lời được
    
    async def _notify_admins(self, message):
        # Gửi thông báo tới tất cả admin đang online
        await self.channel_layer.group_send(
            'admin_group',
            {
                'type': 'admin_notification',
                'message': f"New message from {message.sender.email}: {message.content}",
                'student_id': message.sender.id
            }
        )
        
    async def admin_notification(self, event):
        # Gửi thông báo tới admin qua WebSocket
        await self.send(text_data=json.dumps({
            'type': 'admin_notification',
            'message': event['message'],
            'student_id': event['student_id']
        }))