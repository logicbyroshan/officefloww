import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_product_and_bom_lifecycle(client: AsyncClient, admin_headers: dict):
    # 1. Create product
    prod_res = await client.post(
        "/api/v1/products",
        headers=admin_headers,
        json={
            "code": "PRD-TEST-CARD",
            "name": "Testing PVC ID Card",
            "unit": "PCS",
            "description": "Standard test card product",
            "metadata_json": {"thickness": "0.76mm"},
        },
    )
    assert prod_res.status_code == 200
    prod_data = prod_res.json()["data"]
    prod_id = prod_data["id"]
    assert prod_data["code"] == "PRD-TEST-CARD"

    # 2. Add Bill of Materials (BOM)
    bom_res = await client.post(
        f"/api/v1/products/{prod_id}/boms",
        headers=admin_headers,
        json={
            "version": 1,
            "notes": "Test BOM specification",
            "items": [
                {
                    "component_name": "PVC Card Blank",
                    "quantity_per_unit": 1.0,
                    "unit": "PCS",
                    "wastage_percentage": 2.5,
                    "is_mandatory": True,
                },
                {
                    "component_name": "Metal Clip",
                    "quantity_per_unit": 1.0,
                    "unit": "PCS",
                    "wastage_percentage": 0.5,
                    "is_mandatory": True,
                },
            ],
        },
    )
    assert bom_res.status_code == 200
    bom_data = bom_res.json()["data"]
    assert bom_data["version"] == 1
    assert len(bom_data["items"]) == 2
    assert bom_data["items"][0]["component_name"] == "PVC Card Blank"
    assert bom_data["items"][0]["wastage_percentage"] == 2.5

    # 3. Retrieve product and verify nested BOM
    get_res = await client.get(f"/api/v1/products/{prod_id}", headers=admin_headers)
    assert get_res.status_code == 200
    fetched_data = get_res.json()["data"]
    assert len(fetched_data["boms"]) == 1
    assert len(fetched_data["boms"][0]["items"]) == 2
