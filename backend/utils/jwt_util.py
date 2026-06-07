import base64
import hashlib
import hmac
import json
import time


def _base64url_encode(data):
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("utf-8")


def _base64url_decode(data):
    padding = "=" * (-len(data) % 4)
    return base64.urlsafe_b64decode((data + padding).encode("utf-8"))


def generate_token(payload, secret_key, expire_seconds=24 * 60 * 60):
    header = {"alg": "HS256", "typ": "JWT"}
    token_payload = dict(payload)
    token_payload["exp"] = int(time.time()) + expire_seconds

    header_part = _base64url_encode(json.dumps(header, separators=(",", ":")).encode("utf-8"))
    payload_part = _base64url_encode(json.dumps(token_payload, separators=(",", ":")).encode("utf-8"))
    unsigned_token = f"{header_part}.{payload_part}"

    signature = hmac.new(
        secret_key.encode("utf-8"),
        unsigned_token.encode("utf-8"),
        hashlib.sha256,
    ).digest()
    signature_part = _base64url_encode(signature)
    return f"{unsigned_token}.{signature_part}"


def verify_token(token, secret_key):
    try:
        header_part, payload_part, signature_part = token.split(".")
    except ValueError:
        return None

    unsigned_token = f"{header_part}.{payload_part}"
    expected_signature = hmac.new(
        secret_key.encode("utf-8"),
        unsigned_token.encode("utf-8"),
        hashlib.sha256,
    ).digest()

    actual_signature = _base64url_decode(signature_part)
    if not hmac.compare_digest(expected_signature, actual_signature):
        return None

    payload = json.loads(_base64url_decode(payload_part))
    if payload.get("exp", 0) < int(time.time()):
        return None
    return payload
