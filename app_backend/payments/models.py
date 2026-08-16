
from django.db import models
from django.conf import settings
from chat.models import ChatRoom

User = settings.AUTH_USER_MODEL


# -------------------------------
# PAYMENT MODEL
# -------------------------------
class Payment(models.Model):

    STATUS_CHOICES = (
        ("created", "Created"),
        ("success", "Success"),
        ("failed", "Failed"),
    )

    PAYMENT_TYPE_CHOICES = (
        ("chat_unlock", "Chat Unlock"),
        ("call_unlock", "Call Unlock"),
        ("subscription", "Subscription"),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="payments")
    room = models.ForeignKey(ChatRoom, on_delete=models.CASCADE, related_name="room_payments", null=True, blank=True)

    # Razorpay details
    razorpay_order_id = models.CharField(max_length=255, blank=True, null=True)
    razorpay_payment_id = models.CharField(max_length=255, blank=True, null=True)
    razorpay_signature = models.CharField(max_length=255, blank=True, null=True)

    amount = models.FloatField(default=0.0)
    currency = models.CharField(max_length=10, default="INR")

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="created")
    payment_type = models.CharField(max_length=20, choices=PAYMENT_TYPE_CHOICES)

    created_at = models.DateTimeField(auto_now_add=True)
    paid_at = models.DateTimeField(blank=True, null=True)

    def __str__(self):
        return f"{self.user} - {self.payment_type} - {self.status}"


# -------------------------------
# CHAT ACCESS CONTROL
# -------------------------------
class ChatAccess(models.Model):
    """
    Controls whether users can chat / call after payment
    """

    room = models.OneToOneField(ChatRoom, on_delete=models.CASCADE, related_name="access")
    is_chat_unlocked = models.BooleanField(default=False)
    is_call_unlocked = models.BooleanField(default=False)

    unlocked_at = models.DateTimeField(blank=True, null=True)

    def __str__(self):
        return f"Room {self.room.id} Access"


# -------------------------------
# OPTIONAL: SUBSCRIPTION MODEL
# -------------------------------
class Subscription(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="subscriptions")

    PLAN_CHOICES = (
        ("basic", "Basic"),
        ("premium", "Premium"),
    )

    plan = models.CharField(max_length=20, choices=PLAN_CHOICES)
    price = models.FloatField()

    start_date = models.DateTimeField(auto_now_add=True)
    end_date = models.DateTimeField()

    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.user} - {self.plan}"

# Create your models here.
