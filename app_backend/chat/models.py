import os
import uuid
from django.db import models
from django.utils import timezone
from django.contrib.auth import get_user_model


User = get_user_model()

def chat_file_upload_path(instance, filename):
    ext = filename.split('.')[-1]
    return os.path.join(
        "chat_files",
        f"{uuid.uuid4().hex}.{ext}"
    )

# -------------------------------
# CHAT ROOM
# -------------------------------
class ChatRoom(models.Model):
    participants = models.ManyToManyField(User, related_name="chatrooms")
    created_at = models.DateTimeField(auto_now_add=True)
    is_paid = models.BooleanField(default=False)

    def __str__(self):
        return f"Room {self.id}"

    def message_count(self):
        return self.chatmessage_set.count()

    class Meta:
        ordering = ["-created_at"]


# -------------------------------
# CHAT MESSAGE
# -------------------------------
class ChatMessage(models.Model):

    MESSAGE_TYPE_CHOICES = (
        ("text", "Text"),
        ("image", "Image"),
        ("video", "Video"),
        ("audio", "Audio"),
    )

    room = models.ForeignKey(ChatRoom, related_name="chatmessage_set", on_delete=models.CASCADE)
    sender = models.ForeignKey(User, related_name="sent_messages", on_delete=models.CASCADE)
    message = models.TextField(blank=True, null=True)
    file = models.FileField(upload_to=chat_file_upload_path, blank=True, null=True)
    message_type = models.CharField(max_length=10, choices=MESSAGE_TYPE_CHOICES, default="text")
    timestamp = models.DateTimeField(auto_now_add=True)
    is_seen = models.BooleanField(default=False)

    class Meta:
        ordering = ['timestamp']
        indexes = [
            models.Index(fields=["room"]),
            models.Index(fields=["timestamp"]),
        ]

    def __str__(self):
        text = self.message if self.message else "File"
        return f"{self.sender.username}: {text[:20]}"


# -------------------------------
# TYPING INDICATOR
# -------------------------------
class TypingStatus(models.Model):
    room = models.ForeignKey(ChatRoom, on_delete=models.CASCADE, related_name="typing_status")
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    is_typing = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("room", "user")


# -------------------------------
# CHAT PAYMENT
# -------------------------------
class ChatPayment(models.Model):
    room = models.ForeignKey(ChatRoom, on_delete=models.CASCADE, related_name="chat_payments")
    payer = models.ForeignKey(User, on_delete=models.CASCADE)
    amount = models.FloatField(default=0.0)
    paid_on = models.DateTimeField(auto_now_add=True)
    razorpay_order_id = models.CharField(max_length=100, blank=True, null=True)
    razorpay_payment_id = models.CharField(max_length=100, blank=True, null=True)
    razorpay_signature = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        return f"Room {self.room.id} Paid by {self.payer.username}"


# -------------------------------
# LAST SEEN
# -------------------------------
class UserLastSeen(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="last_seen_info")
    last_seen = models.DateTimeField(default=timezone.now)
    is_online = models.BooleanField(default=False)

    def update_last_seen(self):
        self.last_seen = timezone.now()
        self.save()

class Notification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name='sent_notifications')  # ✅ ADD
    room = models.ForeignKey('ChatRoom', on_delete=models.CASCADE, null=True, blank=True)  # ✅ ADD (for chat button)
    message = models.TextField()
    type = models.CharField(max_length=50, default='general')
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        ordering = ['-created_at']

from django.db.models.signals import post_save
from django.dispatch import receiver


@receiver(post_save, sender=ChatRoom)
def create_chat_access(sender, instance, created, **kwargs):
    if created:
        try:
            from payments.models import ChatAccess
            ChatAccess.objects.create(room=instance)
        except:
            pass