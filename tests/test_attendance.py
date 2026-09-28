import pytest
from modules.attendance.service import AttendanceService

class FakePersistence:
    async def record_attendance_presence(self, **kwargs):
        return {"event_type":"arrival","session":{"id":"s1"}, "identity_ref":kwargs["identity_ref"]}

@pytest.mark.asyncio
async def test_attendance_ignores_unrecognized():
    service=AttendanceService(FakePersistence())
    assert await service.process_event({"type":"face.unrecognized","subject_id":None}) is None

@pytest.mark.asyncio
async def test_attendance_records_recognized_event():
    service=AttendanceService(FakePersistence())
    result=await service.process_event({
        "type":"face.recognized","subject_id":"emp-1",
        "occurred_at":"2026-01-01T08:00:00+00:00",
        "metadata":{"tenant_id":"default"}
    })
    assert result["event_type"]=="arrival"
