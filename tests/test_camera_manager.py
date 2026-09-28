import asyncio
from modules.camera.manager import CameraManager


class FakePipeline:
    async def process(self, frame, camera_id, tenant_id):
        class Event:
            def model_dump(self, mode="json"):
                return {"type": "face.recognized", "camera_id": camera_id}
        return Event(), {"ok": True}


def test_phone_ingest_keeps_latest_frame():
    async def run():
        manager = CameraManager(pipeline=FakePipeline(), analysis_interval=0)
        result = await manager.ingest("cam-phone", b"jpeg", "phone", "default")
        await asyncio.sleep(0)
        assert result["camera_id"] == "cam-phone"
        assert manager.jpeg("cam-phone") == b"jpeg"
        assert manager.status("cam-phone")["frames"] == 1
    asyncio.run(run())


def test_stop_is_idempotent():
    async def run():
        manager = CameraManager()
        first = await manager.stop("unknown")
        second = await manager.stop("unknown")
        assert first["online"] is False
        assert second["running"] is False
    asyncio.run(run())
