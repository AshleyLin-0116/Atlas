from py_vapid import Vapid
from cryptography.hazmat.primitives.serialization import Encoding, PublicFormat
import base64

vapid = Vapid()
vapid.generate_keys()

private_key_b64 = base64.urlsafe_b64encode(
    vapid.private_key.private_numbers().private_value.to_bytes(32, 'big')
).decode('utf-8').rstrip('=')

public_key_raw = vapid.public_key.public_bytes(
    encoding=Encoding.X962,
    format=PublicFormat.UncompressedPoint
)
public_key_b64 = base64.urlsafe_b64encode(public_key_raw).decode('utf-8').rstrip('=')

print("VAPID_PRIVATE_KEY =", private_key_b64)
print("VAPID_PUBLIC_KEY =", public_key_b64)