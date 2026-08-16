#from django.shortcuts import render
import razorpay
from django.conf import settings
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Payment, ChatAccess
from chat.models import ChatRoom


# -------------------------------
# RAZORPAY CLIENT
# -------------------------------
client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))


# -------------------------------
# CREATE ORDER
# -------------------------------
class CreateOrderView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        room_id = request.data.get("room_id")
        amount = request.data.get("amount", 499)  

        try:
            room = ChatRoom.objects.get(id=room_id)
        except ChatRoom.DoesNotExist:
            return Response({"error": "Room not found"}, status=404)

        # create razorpay order
        order_data = {
            "amount": int(amount) * 100,  # convert to paise
            "currency": "INR",
            "payment_capture": 1
        }

        razorpay_order = client.order.create(data=order_data)

        # save payment in DB
        payment = Payment.objects.create(
            user=user,
            room=room,
            amount=amount,
            razorpay_order_id=razorpay_order["id"],
            status="created",
            payment_type="chat_unlock"
        )

        return Response({
            "order_id": razorpay_order["id"],
            "amount": amount,
            "key": settings.RAZORPAY_KEY_ID
        })


# -------------------------------
# VERIFY PAYMENT
# -------------------------------
class VerifyPaymentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        data = request.data

        razorpay_order_id = data.get("razorpay_order_id")
        razorpay_payment_id = data.get("razorpay_payment_id")
        razorpay_signature = data.get("razorpay_signature")

        try:
            payment = Payment.objects.get(razorpay_order_id=razorpay_order_id)
        except Payment.DoesNotExist:
            return Response({"error": "Payment not found"}, status=404)

        # verify signature
        params_dict = {
            "razorpay_order_id": razorpay_order_id,
            "razorpay_payment_id": razorpay_payment_id,
            "razorpay_signature": razorpay_signature
        }

        try:
            client.utility.verify_payment_signature(params_dict)

            # ✅ SUCCESS
            payment.status = "success"
            payment.razorpay_payment_id = razorpay_payment_id
            payment.paid_at = timezone.now()
            payment.save()

            # 🔓 UNLOCK CHAT + CALL
            access,created = ChatAccess.objects.get(room=payment.room)
            if not created:
                access.is_chat_unlocked = True
                access.is_call_unlocked = True
                access.unlocked_at = timezone.now()
                access.save()

            # ALSO mark room as paid (optional)
            payment.room.is_paid = True
            payment.room.save()

            return Response({"message": "✅ Payment verified & chat unlocked!"})

        except Exception:
            payment.status = "failed"
            payment.save()

            return Response({"error": "Payment verification failed"}, status=400)


# -------------------------------
# FAKE PAYMENT (FOR DEVELOPMENT)
# -------------------------------
class FakePaymentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        room_id = request.data.get("room_id")

        try:
            room = ChatRoom.objects.get(id=room_id)
        except ChatRoom.DoesNotExist:
            return Response({"error": "Room not found"}, status=404)

        # create fake payment entry
        Payment.objects.create(
            user=user,
            room=room,
            amount=499,
            status="success",
            payment_type="fake_chat_unlock",
            paid_at=timezone.now()
        )

        # 🔓 UNLOCK CHAT + CALL
        access, created = ChatAccess.objects.get_or_create(room=room)
        if not created:
            access.is_chat_unlocked = True
            access.is_call_unlocked = True
            access.unlocked_at = timezone.now()
            access.save()

        # also mark room paid (optional)
        room.is_paid = True
        room.save()

        print(f"🧪 FAKE UNLOCK: {user.username} → Room {room_id}")
        return Response({"message": "🧪 Chat unlocked (FAKE payment)"})


# -------------------------------
# CHECK ACCESS (USED IN FRONTEND)
# -------------------------------
class CheckAccessView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, room_id):
        try:
            room = ChatRoom.objects.get(id=room_id)
            access = ChatAccess.objects.filter(room=room).first()

            return Response({
            "chat_unlocked": access.is_chat_unlocked if access else False,
            "call_unlocked": access.is_call_unlocked
        })
        except ChatRoom.DoesNotExist:
            return Response({"chat_unlocked": False})

        

        
