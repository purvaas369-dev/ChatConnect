import json
import asyncio
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.utils import timezone
from .models import ChatRoom, ChatMessage, TypingStatus
from django.contrib.auth import get_user_model
from payments.models import ChatAccess

User = get_user_model()

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        print("🚀 ===== WEBSOCKET HIT! =====")
        print(f"📍 Path: {self.scope['path']}")
        print(f"🔍 Room: {self.scope['url_route']['kwargs']}")
        print(f"🔍 Query: {self.scope['query_string'].decode()}")
        print(f"👤 User: {self.scope['user']}")
        print("🎉 1. CONNECT START")
        self.user = self.scope["user"]
        print(f"👤 RESOLVED: {getattr(self.user, 'username', 'Anonymous')}")
        self.room_id = str(self.scope['url_route']['kwargs']['room_id'])  # 👈 Force string
        self.room_group_name = f'chat_{self.room_id}'
        
        
        print(f"👤 2. User: {self.user.username if self.user.is_authenticated else 'Anonymous'}")
        print(f"📱 3. Room ID: '{self.room_id}' (type: {type(self.room_id)})")
        
        if self.user.is_anonymous:
            print("🚫 ANONYMOUS → REJECT 4001")
            await self.close(code=4001)
            return
        
        await self.ensure_room_exists()
        
        # ✅ FIXED: Check room exists FIRST
        if not await self.room_exists():
            print(f"❌ 5. Room {self.room_id} doesn't exist - closing")
            await self.close(code=4004)
            return
        
        # ✅ USER IN ROOM (MOST IMPORTANT!)
        if not await self.user_in_room():
            print(f"🚫 USER {self.user.id} NOT IN ROOM {self.room_id}")
            await self.close(code=4003)
            return
        
        # ✅ JOIN & ACCEPT
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()
        print(f"✅ CONNECTED: {self.user.username} -> room {self.room_id}")

        self.ping_task = asyncio.create_task(self.keepalive_ping())

        

        # Online status
        await self.set_online(True)

    @database_sync_to_async
    def room_exists(self):
        print(f"🔍 Checking room {self.room_id}...")
        try:
           # from .models import ChatRoom
            exists =ChatRoom.objects.filter(id=int(self.room_id)).exists()
            print(f"✅ Room exists: {exists}")
            return exists
        except Exception as e:
            print(f"❌ Room error: {e}")
            return False
    @database_sync_to_async
    def user_in_room(self):
        try:
            room = ChatRoom.objects.get(id=int(self.room_id))
            in_room = self.user in room.participants.all()
            print(f"👤 {self.user.username} in room? {in_room}")
            return in_room
        except Exception as e:
            print(f"❌ User check error: {e}")
            return False
        
    @database_sync_to_async
    def set_online(self, is_online):
        try:
            self.user.is_online = is_online
            self.user.last_seen = timezone.now()
            self.user.save(update_fields=['is_online', 'last_seen'])
        except:
            pass

    @database_sync_to_async
    def ensure_room_exists(self):
        """🆕 Create if missing"""
        from .models import ChatRoom
        try:
            room = ChatRoom.objects.get(id=int(self.room_id))
            return room
        except ChatRoom.DoesNotExist:
            room = ChatRoom.objects.create(id=int(self.room_id), is_paid=False)
            print(f"🆕 Created room {self.room_id}")
            return room
        except ValueError:
            print(f"❌ Invalid room_id: {self.room_id}")
            return None

    async def disconnect(self, close_code):
        print(f"🔌 DISCONNECT {close_code}")
        try:
            await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
            await self.set_online(False)
        except:
            pass

    async def keepalive_ping(self):
            while True:
                try:
                    await asyncio.sleep(20)
                    await self.send(text_data=json.dumps({
                        "type":"pong",
                        "timestamp":asyncio.get_event_loop().time()}))
                except (asyncio.CancelledError,ConnectionError):
                    print("Ping task cancelled")
                    break
                except Exception as e:
                    print(f"Ping error : {e}")
                    break
    

    async def receive(self, text_data=None, bytes_data=None):
        data = json.loads(text_data)
        action = data.get("action")

        if action == "message":
            await self.handle_message(data)
        elif action == "typing":
            await self.handle_typing(data)
        elif action == "read":
            await self.handle_read(data)
        elif action == "webrtc":
            await self.handle_webrtc(data)

    # ---------------- YOUR ORIGINAL METHODS (UNCHANGED) ----------------
    async def handle_message(self, data):
        message_text = data.get("message", "")
        file_url = data.get("file")

        can_send = await self.check_message_limit()
        if not can_send:
            await self.send(json.dumps({"error": "Payment required"}))
            return

        chat_msg = await self.create_message(self.user, message_text, file_url)

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "chat_message",
                "message": {
                    "id": chat_msg.id,
                    "sender": chat_msg.sender.id,
                    "username": chat_msg.sender.username,
                    "profile_picture": chat_msg.sender.profile_picture.url if chat_msg.sender.profile_picture else None,
                    "message": chat_msg.message,
                    "file": chat_msg.file.url if chat_msg.file else file_url,
                    "timestamp": str(chat_msg.timestamp),
                    "is_seen": chat_msg.is_seen,
                },
            }
        )

    async def handle_typing(self, data):
        typing = data.get("typing", False)
        await self.set_typing_status(self.user.id, typing)
        await self.channel_layer.group_send(
            self.room_group_name,
            {"type": "typing_message", "user": self.user.id, "typing": typing}
        )

    async def handle_read(self, data):
        message_ids = data.get("message_ids", [])
        await self.mark_messages_as_seen(message_ids)
        await self.channel_layer.group_send(
            self.room_group_name,
            {"type": "read_receipt", "message_ids": message_ids}
        )

    async def handle_webrtc(self, data):
        await self.channel_layer.group_send(
            self.room_group_name,
            {"type": "webrtc_signal", "data": data}
        )

    # ---------------- EVENTS ----------------
    async def chat_message(self, event):
        await self.send(json.dumps({"action": "message", "data": event["message"]}))

    async def typing_message(self, event):
        await self.send(json.dumps({"action": "typing", "data": event}))

    async def read_receipt(self, event):
        await self.send(json.dumps({"action": "read", "data": event}))

    async def webrtc_signal(self, event):
        await self.send(json.dumps({"action": "webrtc", "data": event["data"]}))

    # ---------------- FIXED DB METHODS ----------------
    @database_sync_to_async
    def room_exists(self):
        """✅ NEW: Safe room check"""
        try:
            ChatRoom.objects.get(id=self.room_id)
            return True
        except ChatRoom.DoesNotExist:
            return False

    @database_sync_to_async
    def create_message(self, user, message, file_url):
        """✅ FIXED: Safe room get"""
        try:
            room = ChatRoom.objects.get(id=self.room_id)
            msg = ChatMessage.objects.create(room=room, sender=user, message=message)
            return msg
        except ChatRoom.DoesNotExist:
            return None

    @database_sync_to_async
    def check_message_limit(self):
        """🚫 BLOCK AT 10 MESSAGES - CHECK PAYMENT"""
        try:
            from payments.models import ChatAccess
            room = ChatRoom.objects.get(id=int(self.room_id))
        
        # Count messages
            count = room.chatmessage_set.count()
        
        # Check if unlocked OR under limit
            access = ChatAccess.objects.filter(room=room).first()
            is_unlocked = access.is_chat_unlocked if access else False
        
            can_send = is_unlocked or count < 10
        
            print(f"📊 Room {self.room_id}: {count}/10 messages | Unlocked: {is_unlocked}")
        
            return can_send
        
        except Exception as e:
            print(f"❌ Limit check error: {e}")
            return False

    @database_sync_to_async
    def mark_messages_as_seen(self, message_ids):
        ChatMessage.objects.filter(id__in=message_ids).update(is_seen=True)

    @database_sync_to_async
    def set_typing_status(self, user_id, is_typing):
        try:
            room = ChatRoom.objects.get(id=self.room_id)
            user = User.objects.get(id=user_id)
            obj, _ = TypingStatus.objects.get_or_create(room=room, user=user)
            obj.is_typing = is_typing
            obj.save()
        except:
            pass  # Silent fail

    @database_sync_to_async
    def set_user_online(self, user_id, is_online):
        try:
            user = User.objects.get(id=user_id)
            user.is_online = is_online
            user.last_seen = timezone.now()
            user.save()
        except:
            pass

    @database_sync_to_async
    def is_user_in_room(self, user):
        """✅ FIXED: No user1/user2 fields"""
        return self.room_exists()
    
    # ✅ ADD THIS INSIDE CLASS (before closing )
    async def chat_unlocked(self, event):
        """🎉 Payment success notification"""
        await self.send(json.dumps({
            "action": "chat_unlocked",
            "message": "✅ Chat unlocked!",
            "count": event.get("count", 0)
        }))

# ---------------- DISCOVER CONSUMER (SIMPLIFIED) ----------------
class DiscoverConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        if self.scope["user"].is_anonymous:
            await self.close(code=4001)
            return
        
        self.user = self.scope["user"]
        self.room_id = self.scope['url_route']['kwargs'].get('chat_id') or self.scope['url_route']['kwargs'].get('room_id', 'global')
        self.room_group_name = f'discover_{self.room_id}'
        
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

    async def receive(self, text_data):
        data = json.loads(text_data)
        await self.channel_layer.group_send(
            self.room_group_name,
            {"type": "discover_message", "data": data}
        )

    async def discover_message(self, event):
        await self.send(text_data=json.dumps(event["data"]))

class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]
        if self.user.is_anonymous:
            await self.close()
            return
        
        self.room_group_name = f'notifications_{self.user.id}'
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()
        print(f"🔔 Notification WS: {self.user.username}")

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def new_notification(self, event):
        """Send new notification to user"""
        await self.send(text_data=json.dumps({
            'action': 'new_notification',
            'count': event['count']
        }))
        