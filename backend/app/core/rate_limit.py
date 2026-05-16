"""
Rate Limiter — merkezi modül
Circular import'u önlemek için main.py'den ayrıldı.
auth.py, chat.py gibi route modülleri buradan import eder.
"""
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
