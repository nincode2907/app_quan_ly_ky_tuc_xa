import uuid
import hmac
import hashlib
import requests
import logging
from decouple import config
from django.conf import settings
from django.utils import timezone
from core.models import PaymentMethod, PaymentTransaction

logger = logging.getLogger(__name__)
class PaymentService:
    _services = {}
    
    @classmethod
    def register_service(cls, payment_method, service):
        cls._services[payment_method.lower()] = service
        
    @staticmethod
    def get_service(payment_method):
        method_name = payment_method.lower()
        service_class = PaymentService._services.get(method_name)
        if not service_class:
            raise ValueError(f"Payment method '{payment_method}' is not supported.")
        return service_class
    
class MoMoService:
    @staticmethod
    def create_payment(bill):
        if bill.status != "UNPAID":
            raise ValueError("Hóa đơn đã được thanh toán hoặc không hợp lệ.")
        payment_method, _ = PaymentMethod.objects.get_or_create(name="MoMo")
        transaction_id = f"MOMO{uuid.uuid4().hex}"
        
        payment_transaction = PaymentTransaction.objects.create(
            bill=bill,
            payment_method=payment_method,
            transaction_id=transaction_id,
            amount=bill.amount,
            status="PENDING"
        )
        
        if payment_transaction.amount != bill.amount:
            payment_transaction.status = "FAILED"
            payment_transaction.save()
            raise ValueError("Số tiền giao dịch không khớp với hóa đơn.")
        
        request_data = {
            "partnerCode": config("SANDBOX_PARTNER_CODE"),
            "requestId": transaction_id,
            "amount": bill.amount,
            "orderId": transaction_id,
            "orderInfo": f"Thanh toán hóa đơn {bill.id} cho {bill.student.full_name}",
            "redirectUrl": settings.SANDBOX_REDIRECT_URL,
            "ipnUrl": settings.SANDBOX_IPN_URL,
            "requestType": config('SANDBOX_REQUEST_TYPE'),
            "extraData": "",
            "lang": "vi",
        }
        
        raw_signature = (
            f"accessKey={config('SANDBOX_ACCESS_KEY')}&amount={request_data['amount']}"
            f"&extraData={request_data['extraData']}&ipnUrl={request_data['ipnUrl']}"
            f"&orderId={request_data['orderId']}&orderInfo={request_data['orderInfo']}"
            f"&partnerCode={request_data['partnerCode']}&redirectUrl={request_data['redirectUrl']}"
            f"&requestId={request_data['requestId']}&requestType={request_data['requestType']}"
        )
        
        signature = hmac.new(
            config('SANDBOX_SECRET_KEY').encode('utf-8'),
            raw_signature.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        
        request_data["signature"] = signature
        
        try:
            response = requests.post(config('SANDBOX_MOMO_DOMAIN'), json=request_data)
            response_data = response.json()
            logger.info(f"MoMo create_payment response: {response_data}")
            
            payment_transaction.response_data = response_data
            payment_transaction.save()
            
            if response_data.get('resultCode') == 0:
                return response_data['payUrl']
            else:
                payment_transaction.status = "FAILED"
                payment_transaction.save()
                raise Exception(f"MoMo API error: {response_data.get('message')}")
        except requests.RequestException as e:
            logger.error(f"MoMo API request failed: {str(e)}")
            payment_transaction.status = "FAILED"
            payment_transaction.save()
            raise Exception(f"MoMo API request failed: {str(e)}")
        
    @staticmethod
    def handle_callback(data):
        raw_signature = (
            f"accessKey={config('SANDBOX_ACCESS_KEY')}&amount={data['amount']}"
            f"&extraData={data['extraData']}&message={data['message']}"
            f"&orderId={data['orderId']}&orderInfo={data['orderInfo']}"
            f"&orderType={data['orderType']}&partnerCode={data['partnerCode']}"
            f"&payType={data['payType']}&requestId={data['requestId']}"
            f"&responseTime={data['responseTime']}&resultCode={data['resultCode']}"
            f"&transId={data['transId']}"
        )
        
        signature = hmac.new(
            config('SANDBOX_SECRET_KEY').encode('utf-8'),
            raw_signature.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        
        if signature != data['signature']:
            logger.error(f"Invalid MoMo signature for orderId: {data['orderId']}")
            raise ValueError("Invalid signature")
        
        try:
            transaction = PaymentTransaction.objects.get(transaction_id=data["orderId"])
        except PaymentTransaction.DoesNotExist:
            logger.error(f"Transaction not found for orderId: {data['orderId']}")
            raise ValueError("Transaction not found")
        
        if transaction.status in ["SUCCESS", "FAILED"]:
            logger.warning(f"Transaction {data['orderId']} already processed with status {transaction.status}")
            return transaction.status == "SUCCESS"
        
        if data['resultCode'] == 0:
            transaction.status = 'SUCCESS'
            transaction.bill.status = 'PAID'
            transaction.bill.paid_date = timezone.now()
            logger.info(f"Payment successful for transaction: {transaction.transaction_id}")
            logger.info(f"Payment successful for transaction: {data['orderId']}")
        else:
            transaction.status = 'FAILED'
            logger.info(f"Payment failed for transaction: {data['orderId']}")
            
        transaction.response_data = data
        transaction.save()
        transaction.bill.save()
        
        return transaction.status == 'SUCCESS'
    
PaymentService.register_service('momo', MoMoService)