# Quick Fixes for Common Errors

## Database Connection Failed
**Error:** `Connection refused` or `could not connect to server`
**Fix:**
```bash
docker-compose restart postgres
# Wait 10 seconds, then:
alembic upgrade head
```

## Import Errors
**Error:** `ModuleNotFoundError: No module named 'app'`
**Fix:**
```bash
source venv/bin/activate  # Mac/Linux
# OR
venv\Scripts\activate  # Windows
pip install -r requirements.txt
```

## Migration Conflicts
**Error:** `Multiple head revisions`
**Fix:**
```bash
alembic heads  # Show all heads
alembic merge head1 head2 -m "merge migrations"
alembic upgrade head
```

---

*Add your own quick fixes as you encounter common issues!*
