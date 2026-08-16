from rest_framework import serializers
from .models import ChatRoom, ChatMessage, ChatPayment
from accounts.models import User
from chat.models import ChatMessage,Notification
import random


# -------------------------------
# USER MINI SERIALIZER (for chat)
# -------------------------------
class ChatUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "username", "profile_picture", "is_online", "last_seen")


# -------------------------------
# CHAT MESSAGE SERIALIZER
# -------------------------------
class ChatMessageSerializer(serializers.ModelSerializer):
    sender = ChatUserSerializer(read_only=True)
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = ChatMessage
        fields = (
            "id",
            "room",
            "sender",
            "message",
            "file",
            "file_url",
            "timestamp",
            "is_seen",
        )
        read_only_fields = ("id", "timestamp", "is_seen")

    def get_file_url(self, obj):
        request = self.context.get("request")
        if obj.file:
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None


# -------------------------------
# CHAT ROOM SERIALIZER
# -------------------------------
class ChatRoomSerializer(serializers.ModelSerializer):
    participants = ChatUserSerializer(many=True, read_only=True)
    last_message = serializers.SerializerMethodField()
    message_count = serializers.SerializerMethodField()

    class Meta:
        model = ChatRoom
        fields = (
            "id",
            "participants",
            "created_at",
            "is_paid",
            "last_message",
            "message_count",
        )

    def get_last_message(self, obj):
        last_msg = obj.chatmessage_set.order_by("-timestamp").first()
        if last_msg:
            return ChatMessageSerializer(last_msg).data
        return None

    def get_message_count(self, obj):
        return obj.chatmessage_set.count()


# -------------------------------
# CHAT PAYMENT SERIALIZER
# -------------------------------
class ChatPaymentSerializer(serializers.ModelSerializer):
    payer = ChatUserSerializer(read_only=True)

    class Meta:
        model = ChatPayment
        fields = (
            "id",
            "room",
            "payer",
            "amount",
            "paid_on",
            "razorpay_order_id",
            "razorpay_payment_id",
            "razorpay_signature",
        )
        read_only_fields = ("id", "paid_on")


# -------------------------------
# OPTIONAL: SIMPLE MESSAGE CREATE SERIALIZER
# -------------------------------
class SendMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = ("message", "file")

    def create(self, validated_data):
        request = self.context.get("request")
        room = self.context.get("room")
        user = request.user

        return ChatMessage.objects.create(
            room=room,
            sender=user,
            message=validated_data.get("message"),
            file=validated_data.get("file"),
        )
# UserSerializer (add to serializers.py)

class UserSerializer(serializers.ModelSerializer):
    age = serializers.SerializerMethodField()
    is_online_status = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'first_name', 'last_name', 
            'email', 'profile_picture', 'bio', 'age', 
            'is_online', 'is_online_status', 'last_seen'
        ]
    
    def get_age(self, obj):
        # Fake age or calculate from birth_date
        return random.randint(18, 35)
    
    def get_is_online_status(self, obj):
        if getattr(obj, 'is_online', False):
            return "Online"
        elif obj.last_seen:
            try:
                return f"Last seen {obj.last_seen.strftime('%-I:%M %p')}"
            except:
                return f"Last seen recently"
        return "Offline"
class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'message', 'type', 'is_read', 'created_at']