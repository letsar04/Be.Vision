from modules.policies.engine import PolicyEngine

def test_policy_matches_outside_schedule():
    event={"type":"face.recognized","occurred_at":"2026-01-01T22:00:00+00:00","subject_id":"emp-1","signals":{}}
    result=PolicyEngine().evaluate_definition(event,{"schedule":{"start_hour":8,"end_hour":18}})
    assert result["matched"] is True
    assert "outside_schedule" in result["reasons"]

def test_policy_accepts_observable_signal():
    event={"type":"person.detected","occurred_at":"2026-01-01T10:00:00+00:00","signals":{"face_obscured":True}}
    result=PolicyEngine().evaluate_definition(event,{"required_signals":["face_obscured"]})
    assert result["matched"] is False
