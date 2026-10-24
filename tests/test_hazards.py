"""
Unit tests for Hazard Simulation and Environmental Progression Model on DIT Campus.
Validates severity escalation, diffusion, impassable threshold blocking, and hazard clearing.
"""

import pytest
from app.models.schemas import HazardEvent, HazardType
from app.services.building_service import BuildingGraphService
from app.simulation.hazards import HazardManager


@pytest.fixture
def hazard_setup():
    service = BuildingGraphService()
    service.reload()
    manager = HazardManager(service)
    return service, manager


def test_apply_hazard_updates_node_state(hazard_setup):
    """Applying a fire event increases node hazard level and logs event."""
    service, manager = hazard_setup
    fire = HazardEvent(
        hazard_id="test_fire_01",
        hazard_type=HazardType.FIRE,
        location_type="node",
        target_id="CENTRAL_PLAZA",
        severity=85.0,
        is_passable=False,
    )
    logs = manager.apply_hazard(fire)
    assert len(logs) > 0

    node = service.get_node("CENTRAL_PLAZA")
    assert node.hazard_level == 85.0
    assert node.is_blocked is True


def test_hazard_step_progression_escalates_severity(hazard_setup):
    """Step progression deterministically increases active hazard severity."""
    service, manager = hazard_setup
    smoke = HazardEvent(
        hazard_id="test_smoke_01",
        hazard_type=HazardType.SMOKE,
        location_type="node",
        target_id="PATH_WEST_VEDANTA",
        severity=50.0,
        spread_rate=10.0,
        is_passable=True,
    )
    manager.apply_hazard(smoke)

    # Advance 1 step
    manager.step_progression()
    assert smoke.severity == 60.0
    assert service.get_node("PATH_WEST_VEDANTA").hazard_level == 60.0

    # Advance 2 more steps -> should hit >= 75 and become impassable
    manager.step_progression()
    manager.step_progression()
    assert smoke.severity == 80.0
    assert smoke.is_passable is False
    assert service.get_node("PATH_WEST_VEDANTA").is_blocked is True


def test_clear_hazard_restores_clean_state(hazard_setup):
    """Clearing a hazard resets node hazard level to 0 and unblocks it."""
    service, manager = hazard_setup
    fire = HazardEvent(
        hazard_id="test_fire_02",
        hazard_type=HazardType.FIRE,
        location_type="node",
        target_id="VEDANTA_HALL",
        severity=90.0,
        is_passable=False,
    )
    manager.apply_hazard(fire)
    assert service.get_node("VEDANTA_HALL").is_blocked is True

    # Clear
    success = manager.clear_hazard("test_fire_02")
    assert success is True
    node = service.get_node("VEDANTA_HALL")
    assert node.hazard_level == 0.0
    assert node.is_blocked is False
