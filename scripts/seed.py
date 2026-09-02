"""Comprehensive seed script for OfficeFloww Phase 1.
Populates:
- 10 Core Users with realistic roles
- 5 Commercial Clients with primary contacts, GST/tax info, delivery addresses
- 5 Core Products with realistic BOMs (ID Card, MPL, Acrylic Badge, Invitation, Marksheet)
- Configurable Workflow Templates with parallel DAG steps (ID Card template with parallel Data & Photography)
- 1 Multi-Product Order (St. Xavier's High School: 2,500 ID Cards + 2,500 Lanyards) with independent workflows
"""

import asyncio
import os
import sys
import uuid
from datetime import datetime, timezone, timedelta

# Ensure project root is in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")


from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.app.core.database import AsyncSessionLocal, Base, engine
from apps.api.app.core.security import get_password_hash
from apps.api.app.users.models import User, UserRole
from apps.api.app.clients.models import Client, ClientContact
from apps.api.app.products.models import Product, ProductCategory, BillOfMaterials, BOMItem
from apps.api.app.workflows.models import (
    WorkflowTemplate,
    WorkflowStepTemplate,
    WorkflowStepDependency,
    StepType,
)
from apps.api.app.orders.models import OrderPriority
from apps.api.app.orders.schemas import OrderCreate, OrderItemCreate
from apps.api.app.orders.service import OrderService


async def seed():
    print("🌱 Starting OfficeFloww database seeding...")
    async with AsyncSessionLocal() as db:
        # Check if users already exist
        existing_user = await db.scalar(select(User).where(User.email == "admin@officefloww.com"))
        if existing_user:
            print("Database already seeded. Skipping.")
            return

        # ----------------------------------------------------
        # 1. USERS
        # ----------------------------------------------------
        print("Creating Users & Roles...")
        default_pwd = get_password_hash("OfficeFloww@2026")
        users_data = [
            ("owner@officefloww.com", "Vikram Malhotra", UserRole.OWNER, "+91 98200 11001"),
            ("admin@officefloww.com", "Rohan Sharma", UserRole.ADMIN, "+91 98200 11002"),
            ("manager@officefloww.com", "Priya Nair", UserRole.MANAGER, "+91 98200 11003"),
            ("sales@officefloww.com", "Arjun Kapoor", UserRole.SALES, "+91 98200 11004"),
            ("designer@officefloww.com", "Sneha Roy", UserRole.DESIGNER, "+91 98200 11005"),
            ("dataop@officefloww.com", "Amit Verma", UserRole.DATA_OPERATOR, "+91 98200 11006"),
            ("prodmgr@officefloww.com", "Rajesh Gupta", UserRole.PRODUCTION_MANAGER, "+91 98200 11007"),
            ("machineop@officefloww.com", "Dinesh Kumar", UserRole.MACHINE_OPERATOR, "+91 98200 11008"),
            ("packingop@officefloww.com", "Sunil Yadav", UserRole.PACKING_OPERATOR, "+91 98200 11009"),
            ("accounts@officefloww.com", "Ananya Deshmukh", UserRole.ACCOUNTS, "+91 98200 11010"),
        ]

        created_users = {}
        for email, name, role, phone in users_data:
            user = User(
                email=email,
                hashed_password=default_pwd,
                full_name=name,
                role=role,
                phone=phone,
                is_active=True,
            )
            db.add(user)
            created_users[role] = user

        await db.flush()
        admin_user = created_users[UserRole.ADMIN]

        # ----------------------------------------------------
        # 2. CLIENTS & CONTACTS (5 Real Clients)
        # ----------------------------------------------------
        print("Creating Clients & Contacts...")
        clients_info = [
            {
                "client_code": "CLI-STX-01",
                "org": "St. Xavier's High School",
                "billing": "St. Xavier's Campus, Fort, Mumbai - 400001",
                "delivery": "St. Xavier's Admin Building, Fort, Mumbai - 400001",
                "gst": "27AAACS1234F1Z5",
                "contacts": [
                    ("Fr. Francis Pinto", "+91 98201 22334", "principal@stxaviers.edu", "Principal", True),
                    ("Sister Mary", "+91 98201 22335", "admin@stxaviers.edu", "Admin Officer", False),
                ],
            },
            {
                "client_code": "CLI-APX-02",
                "org": "Apex Corporate Solutions Pvt Ltd",
                "billing": "Level 8, Infinity IT Tower, Mindspace, Malad (W), Mumbai - 400064",
                "delivery": "Level 8, Infinity IT Tower, Mindspace, Malad (W), Mumbai - 400064",
                "gst": "27AABCA5678K1Z2",
                "contacts": [
                    ("Rahul Mehra", "+91 98199 44556", "rahul.m@apexcorp.in", "Head of HR", True),
                    ("Kavita Shah", "+91 98199 44557", "procurement@apexcorp.in", "Procurement Specialist", False),
                ],
            },
            {
                "client_code": "CLI-HTC-03",
                "org": "Horizon Tech Conference 2026",
                "billing": "Jio World Convention Centre, BKC, Bandra (E), Mumbai - 400051",
                "delivery": "JWCC Hall 3 Receiving, BKC, Mumbai - 400051",
                "gst": "27AAACH9012M1Z8",
                "contacts": [
                    ("Deepak Chawla", "+91 97690 12345", "deepak@horizonconf.org", "Event Director", True),
                ],
            },
            {
                "client_code": "CLI-MDL-04",
                "org": "Metro Diagnostic Labs Network",
                "billing": "Building 4, MIDC Central Road, Andheri (E), Mumbai - 400093",
                "delivery": "Central Warehouse, MIDC, Andheri (E), Mumbai - 400093",
                "gst": "27AAACM3456L1Z4",
                "contacts": [
                    ("Dr. Suresh Kulkarni", "+91 98212 98765", "suresh.k@metrolabs.com", "Operations Lead", True),
                ],
            },
            {
                "client_code": "CLI-RHB-05",
                "org": "Royal Heritage Banquets & Club",
                "billing": "Plot 12, Senapati Bapat Marg, Lower Parel, Mumbai - 400013",
                "delivery": "Royal Heritage Banquets, Lower Parel, Mumbai - 400013",
                "gst": "27AAACR7890N1Z9",
                "contacts": [
                    ("Manish Singhania", "+91 98333 45678", "manish@royalheritage.in", "Managing Director", True),
                ],
            },
        ]

        created_clients = []
        for c in clients_info:
            client = Client(
                client_code=c["client_code"],
                organization_name=c["org"],
                billing_address=c["billing"],
                delivery_address=c["delivery"],
                tax_identifier=c["gst"],
                is_active=True,
            )
            for c_name, c_phone, c_email, c_desig, c_primary in c["contacts"]:
                contact = ClientContact(
                    name=c_name,
                    phone=c_phone,
                    email=c_email,
                    designation=c_desig,
                    is_primary=c_primary,
                    is_active=True,
                )
                client.contacts.append(contact)
            db.add(client)
            created_clients.append(client)

        await db.flush()

        # ----------------------------------------------------
        # 3. WORKFLOW TEMPLATES (ID Card & MPL)
        # ----------------------------------------------------
        print("Creating Configurable Workflow Templates...")

        # A) ID Card Workflow Template with PARALLEL Data & Photography
        tmpl_idcard = WorkflowTemplate(
            code="WF-ID-CARD-STANDARD",
            name="Standard Student/Corporate ID Card Workflow",
            description="Parallel Data Collection & Photography leading to Design, Approval, Print, Fitting, Packing, and Dispatch.",
            is_active=True,
        )
        db.add(tmpl_idcard)
        await db.flush()

        step_data = WorkflowStepTemplate(
            template_id=tmpl_idcard.id,
            name="Data Verification & Entry",
            step_type=StepType.DATA,
            sequence_order=1,
            required_role=UserRole.DATA_OPERATOR,
            estimated_duration_minutes=120,
            instructions="Verify student/employee names, blood groups, IDs against client excel list.",
        )
        step_photo = WorkflowStepTemplate(
            template_id=tmpl_idcard.id,
            name="Photo Collection & Cropping",
            step_type=StepType.PHOTOGRAPHY,
            sequence_order=1,  # Parallel! Same sequence order
            required_role=UserRole.DATA_OPERATOR,
            estimated_duration_minutes=180,
            instructions="Crop and normalize portraits with aspect ratio 35mm x 45mm at 300 DPI.",
        )
        step_design = WorkflowStepTemplate(
            template_id=tmpl_idcard.id,
            name="ID Card Artwork Merging",
            step_type=StepType.DESIGN,
            sequence_order=2,
            required_role=UserRole.DESIGNER,
            estimated_duration_minutes=90,
            instructions="Variable data print (VDP) layout merge in InDesign/Corel.",
        )
        step_appr = WorkflowStepTemplate(
            template_id=tmpl_idcard.id,
            name="Sample Proof Client Approval",
            step_type=StepType.APPROVAL,
            sequence_order=3,
            required_role=UserRole.MANAGER,
            estimated_duration_minutes=60,
            instructions="Get signed proof PDF from client or authorized manager.",
        )
        step_print = WorkflowStepTemplate(
            template_id=tmpl_idcard.id,
            name="Thermal / UV PVC Card Printing",
            step_type=StepType.PRINTING,
            sequence_order=4,
            required_role=UserRole.MACHINE_OPERATOR,
            estimated_duration_minutes=240,
            instructions="Thermal re-transfer / UV flatbed print with scratch-resistant overlay.",
        )
        step_fit = WorkflowStepTemplate(
            template_id=tmpl_idcard.id,
            name="Card Insertion into Holder & Clipping",
            step_type=StepType.FITTING,
            sequence_order=5,
            required_role=UserRole.PACKING_OPERATOR,
            estimated_duration_minutes=180,
            instructions="Insert each printed card into clear acrylic/PVC holder and attach metal clip.",
        )
        step_pack = WorkflowStepTemplate(
            template_id=tmpl_idcard.id,
            name="Class/Dept Sorting & Packing",
            step_type=StepType.PACKING,
            sequence_order=6,
            required_role=UserRole.PACKING_OPERATOR,
            estimated_duration_minutes=120,
            instructions="Pack cards sequentially by division with printed roll-call checklists.",
        )
        step_disp = WorkflowStepTemplate(
            template_id=tmpl_idcard.id,
            name="Final Dispatch & Delivery",
            step_type=StepType.DISPATCH,
            sequence_order=7,
            required_role=UserRole.PRODUCTION_MANAGER,
            estimated_duration_minutes=60,
            instructions="Generate delivery challan and handover to client logistics.",
        )
        step_bill = WorkflowStepTemplate(
            template_id=tmpl_idcard.id,
            name="Invoice Generation",
            step_type=StepType.BILLING,
            sequence_order=8,
            required_role=UserRole.ACCOUNTS,
            estimated_duration_minutes=30,
            instructions="Create GST tax invoice against confirmed delivery challan.",
        )
        step_pay = WorkflowStepTemplate(
            template_id=tmpl_idcard.id,
            name="Payment Collection",
            step_type=StepType.PAYMENT,
            sequence_order=9,
            required_role=UserRole.ACCOUNTS,
            estimated_duration_minutes=30,
            instructions="Track bank NEFT/RTGS settlement and close order balance.",
        )

        db.add_all([step_data, step_photo, step_design, step_appr, step_print, step_fit, step_pack, step_disp, step_bill, step_pay])
        await db.flush()

        # Wire ID Card DAG Dependencies:
        # DESIGN depends on DATA and PHOTOGRAPHY (parallel convergence)
        db.add(WorkflowStepDependency(step_id=step_design.id, depends_on_step_id=step_data.id))
        db.add(WorkflowStepDependency(step_id=step_design.id, depends_on_step_id=step_photo.id))
        # APPROVAL depends on DESIGN
        db.add(WorkflowStepDependency(step_id=step_appr.id, depends_on_step_id=step_design.id))
        # PRINTING depends on APPROVAL
        db.add(WorkflowStepDependency(step_id=step_print.id, depends_on_step_id=step_appr.id))
        # FITTING depends on PRINTING
        db.add(WorkflowStepDependency(step_id=step_fit.id, depends_on_step_id=step_print.id))
        # PACKING depends on FITTING
        db.add(WorkflowStepDependency(step_id=step_pack.id, depends_on_step_id=step_fit.id))
        # DISPATCH depends on PACKING
        db.add(WorkflowStepDependency(step_id=step_disp.id, depends_on_step_id=step_pack.id))
        # BILLING depends on DISPATCH
        db.add(WorkflowStepDependency(step_id=step_bill.id, depends_on_step_id=step_disp.id))
        # PAYMENT depends on BILLING
        db.add(WorkflowStepDependency(step_id=step_pay.id, depends_on_step_id=step_bill.id))
        await db.flush()

        # B) MPL Workflow Template
        tmpl_mpl = WorkflowTemplate(
            code="WF-MPL-STANDARD",
            name="Multicolor Printed Lanyards (MPL) Workflow",
            description="Sublimation design proofing, thermal transfer printing, ultrasonic cutting, and hook fitting.",
            is_active=True,
        )
        db.add(tmpl_mpl)
        await db.flush()

        mpl_design = WorkflowStepTemplate(template_id=tmpl_mpl.id, name="Lanyard Artwork & Repeat Setup", step_type=StepType.DESIGN, sequence_order=1, required_role=UserRole.DESIGNER)
        mpl_appr = WorkflowStepTemplate(template_id=tmpl_mpl.id, name="Lanyard Mockup Approval", step_type=StepType.APPROVAL, sequence_order=2, required_role=UserRole.MANAGER)
        mpl_print = WorkflowStepTemplate(template_id=tmpl_mpl.id, name="Rotary Sublimation Ribbon Printing", step_type=StepType.PRINTING, sequence_order=3, required_role=UserRole.MACHINE_OPERATOR)
        mpl_fit = WorkflowStepTemplate(template_id=tmpl_mpl.id, name="Ultrasonic Cutting & Dog Hook Riveting", step_type=StepType.FITTING, sequence_order=4, required_role=UserRole.MACHINE_OPERATOR)
        mpl_pack = WorkflowStepTemplate(template_id=tmpl_mpl.id, name="Bundle Bundling (50s) & Boxing", step_type=StepType.PACKING, sequence_order=5, required_role=UserRole.PACKING_OPERATOR)
        mpl_disp = WorkflowStepTemplate(template_id=tmpl_mpl.id, name="Lanyard Dispatch", step_type=StepType.DISPATCH, sequence_order=6, required_role=UserRole.PRODUCTION_MANAGER)
        mpl_bill = WorkflowStepTemplate(template_id=tmpl_mpl.id, name="Billing", step_type=StepType.BILLING, sequence_order=7, required_role=UserRole.ACCOUNTS)
        mpl_pay = WorkflowStepTemplate(template_id=tmpl_mpl.id, name="Payment Settlement", step_type=StepType.PAYMENT, sequence_order=8, required_role=UserRole.ACCOUNTS)

        db.add_all([mpl_design, mpl_appr, mpl_print, mpl_fit, mpl_pack, mpl_disp, mpl_bill, mpl_pay])
        await db.flush()

        db.add(WorkflowStepDependency(step_id=mpl_appr.id, depends_on_step_id=mpl_design.id))
        db.add(WorkflowStepDependency(step_id=mpl_print.id, depends_on_step_id=mpl_appr.id))
        db.add(WorkflowStepDependency(step_id=mpl_fit.id, depends_on_step_id=mpl_print.id))
        db.add(WorkflowStepDependency(step_id=mpl_pack.id, depends_on_step_id=mpl_fit.id))
        db.add(WorkflowStepDependency(step_id=mpl_disp.id, depends_on_step_id=mpl_pack.id))
        db.add(WorkflowStepDependency(step_id=mpl_bill.id, depends_on_step_id=mpl_disp.id))
        db.add(WorkflowStepDependency(step_id=mpl_pay.id, depends_on_step_id=mpl_bill.id))
        await db.flush()

        # ----------------------------------------------------
        # 4. CATEGORIES, PRODUCTS & REALISTIC BOMS (5 Products)
        # ----------------------------------------------------
        print("Creating Products with Bill of Materials...")
        cat_id = ProductCategory(code="CAT-ID", name="Identity & Badges", description="Cards, Badges, and Passes")
        cat_lan = ProductCategory(code="CAT-LAN", name="Lanyards & Accessories", description="Printed ribbons and hooks")
        cat_print = ProductCategory(code="CAT-SEC", name="Security & Stationery", description="Certificates, Invitations, Marksheets")
        db.add_all([cat_id, cat_lan, cat_print])
        await db.flush()

        # Product 1: ID Card
        prod_idcard = Product(
            code="PRD-IDC-001",
            name="Thermal Printed PVC Student ID Card",
            category_id=cat_id.id,
            unit="PCS",
            description="Durable 760-micron PVC card with edge-to-edge full colour thermal printing.",
            default_workflow_template_id=tmpl_idcard.id,
            is_active=True,
        )
        db.add(prod_idcard)
        await db.flush()

        bom_idcard = BillOfMaterials(product_id=prod_idcard.id, version=1, notes="Standard PVC BOM")
        db.add(bom_idcard)
        await db.flush()
        db.add_all([
            BOMItem(bom_id=bom_idcard.id, component_name="Blank CR80 PVC Sheet/Card", quantity_per_unit=1.0, unit="PCS", wastage_percentage=2.0, is_mandatory=True),
            BOMItem(bom_id=bom_idcard.id, component_name="Transparent Rigid Card Holder", quantity_per_unit=1.0, unit="PCS", wastage_percentage=1.0, is_mandatory=True),
            BOMItem(bom_id=bom_idcard.id, component_name="Crocodile Metal Clip", quantity_per_unit=1.0, unit="PCS", wastage_percentage=0.5, is_mandatory=True),
            BOMItem(bom_id=bom_idcard.id, component_name="Thermal Re-transfer Ribbon Panel", quantity_per_unit=0.002, unit="ROLL", wastage_percentage=3.0, is_mandatory=True),
        ])

        # Product 2: Multicolor Printed Lanyard (MPL)
        prod_mpl = Product(
            code="PRD-MPL-002",
            name="Multicolor Printed Satin Lanyard (16mm)",
            category_id=cat_lan.id,
            unit="PCS",
            description="16mm double-side heat transfer sublimation polyester lanyard with metal dog hook and plastic breakaway clamp.",
            default_workflow_template_id=tmpl_mpl.id,
            is_active=True,
        )
        db.add(prod_mpl)
        await db.flush()

        bom_mpl = BillOfMaterials(product_id=prod_mpl.id, version=1, notes="16mm Satin Lanyard BOM")
        db.add(bom_mpl)
        await db.flush()
        db.add_all([
            BOMItem(bom_id=bom_mpl.id, component_name="16mm White Satin Polyester Ribbon", quantity_per_unit=0.92, unit="METERS", wastage_percentage=4.0, is_mandatory=True),
            BOMItem(bom_id=bom_mpl.id, component_name="Metal Dog Hook (360 swivel)", quantity_per_unit=1.0, unit="PCS", wastage_percentage=1.0, is_mandatory=True),
            BOMItem(bom_id=bom_mpl.id, component_name="Plastic Safety Breakaway Clamp", quantity_per_unit=1.0, unit="PCS", wastage_percentage=0.5, is_mandatory=True),
            BOMItem(bom_id=bom_mpl.id, component_name="Sublimation Inks (Cyan/Magenta/Yellow/Black)", quantity_per_unit=0.001, unit="LITERS", wastage_percentage=5.0, is_mandatory=True),
        ])

        # Product 3: Acrylic Badge
        prod_acrylic = Product(
            code="PRD-ACR-003",
            name="Laser-Cut Acrylic Magnet Badge",
            category_id=cat_id.id,
            unit="PCS",
            description="3mm clear cast acrylic with reverse UV digital print and dual-magnet fastener.",
            default_workflow_template_id=tmpl_idcard.id,
            is_active=True,
        )
        db.add(prod_acrylic)
        await db.flush()

        bom_acrylic = BillOfMaterials(product_id=prod_acrylic.id, version=1, notes="Acrylic Badge BOM")
        db.add(bom_acrylic)
        await db.flush()
        db.add_all([
            BOMItem(bom_id=bom_acrylic.id, component_name="3mm Cast Acrylic Sheet", quantity_per_unit=0.004, unit="SQ_METERS", wastage_percentage=5.0, is_mandatory=True),
            BOMItem(bom_id=bom_acrylic.id, component_name="Dual Neodymium Magnet Backing", quantity_per_unit=1.0, unit="PCS", wastage_percentage=0.5, is_mandatory=True),
            BOMItem(bom_id=bom_acrylic.id, component_name="UV Direct Primer & Ink", quantity_per_unit=0.0005, unit="LITERS", wastage_percentage=4.0, is_mandatory=True),
        ])

        # Product 4: Premium Invitation Card
        prod_invitation = Product(
            code="PRD-INV-004",
            name="Embossed Foil Invitation Cards with Envelope",
            category_id=cat_print.id,
            unit="SETS",
            description="350 GSM matte laminated art card with gold foil hot-stamping and custom matching envelope.",
            default_workflow_template_id=tmpl_mpl.id,
            is_active=True,
        )
        db.add(prod_invitation)
        await db.flush()

        bom_inv = BillOfMaterials(product_id=prod_invitation.id, version=1, notes="Invitation Set BOM")
        db.add(bom_inv)
        await db.flush()
        db.add_all([
            BOMItem(bom_id=bom_inv.id, component_name="350 GSM Natural White Art Board", quantity_per_unit=1.1, unit="SHEETS", wastage_percentage=6.0, is_mandatory=True),
            BOMItem(bom_id=bom_inv.id, component_name="Gold Stamping Foil (120mm width)", quantity_per_unit=0.2, unit="METERS", wastage_percentage=8.0, is_mandatory=True),
            BOMItem(bom_id=bom_inv.id, component_name="140 GSM Die-cut Peel & Seal Envelope", quantity_per_unit=1.0, unit="PCS", wastage_percentage=2.0, is_mandatory=True),
        ])

        # Product 5: Security Marksheet
        prod_marksheet = Product(
            code="PRD-MRK-005",
            name="Anti-Counterfeit Holographic Marksheet",
            category_id=cat_print.id,
            unit="SHEETS",
            description="Non-tearable waterproof synthetic paper with registered 3D security hologram and micro-text guilloche borders.",
            default_workflow_template_id=tmpl_idcard.id,
            is_active=True,
        )
        db.add(prod_marksheet)
        await db.flush()

        bom_mrk = BillOfMaterials(product_id=prod_marksheet.id, version=1, notes="Security Marksheet BOM")
        db.add(bom_mrk)
        await db.flush()
        db.add_all([
            BOMItem(bom_id=bom_mrk.id, component_name="200 Micron Waterproof Synthetic Paper", quantity_per_unit=1.02, unit="SHEETS", wastage_percentage=2.0, is_mandatory=True),
            BOMItem(bom_id=bom_mrk.id, component_name="Hot Stamped 25mm 3D Kinetic Hologram", quantity_per_unit=1.0, unit="PCS", wastage_percentage=1.0, is_mandatory=True),
            BOMItem(bom_id=bom_mrk.id, component_name="Invisible UV Fluorescent Security Ink", quantity_per_unit=0.0003, unit="LITERS", wastage_percentage=3.0, is_mandatory=True),
        ])

        await db.commit()

        # ----------------------------------------------------
        # 5. REALISTIC MULTI-PRODUCT ORDER
        # St. Xavier's High School ordering 2,500 ID Cards + 2,500 Lanyards
        # ----------------------------------------------------
        print("Creating Multi-Product Order for St. Xavier's High School (2,500 ID Cards + 2,500 Lanyards)...")
        st_xaviers = created_clients[0]

        order_data = OrderCreate(
            order_number="ORD-2026-0001",
            client_id=st_xaviers.id,
            priority=OrderPriority.HIGH,
            promised_delivery_date=datetime.now(timezone.utc) + timedelta(days=14),
            billing_address=st_xaviers.billing_address,
            delivery_address=st_xaviers.delivery_address,
            notes="Annual academic session student kit. Requires class-wise bundle packaging.",
            items=[
                OrderItemCreate(
                    product_id=prod_idcard.id,
                    quantity=2500,
                    unit_price=45.0,
                    specifications_json={
                        "card_type": "Student Pass",
                        "grades": "Nursery to Grade 12",
                        "finish": "Gloss Lamination with QR Code",
                    },
                ),
                OrderItemCreate(
                    product_id=prod_mpl.id,
                    quantity=2500,
                    unit_price=28.0,
                    specifications_json={
                        "ribbon_color": "Navy Blue & Gold",
                        "text": "ST. XAVIER'S HIGH SCHOOL - MUMBAI",
                        "attachment": "Dog Hook + Breakaway Clip",
                    },
                ),
            ],
        )

        created_order = await OrderService.create_order(db, order_data, admin_user.id)
        print(f"✅ Multi-product order created: {created_order.order_number}")
        print(f"   Items count: {len(created_order.items)}")
        print(f"   Total Value: INR {created_order.total_amount:,.2f}")
        for idx, itm in enumerate(created_order.items):
            print(f"   Item {idx+1}: {itm.quantity} units, Workflow Instance: {itm.workflow_instance_id}")

        # ----------------------------------------------------
        # 6. PHASE 2 PHYSICAL OPERATIONAL SEED DATA
        # ----------------------------------------------------
        print("\n📦 Seeding Phase 2 Physical Operational Layer...")
        from apps.api.app.stock.models import StockLocation, StockLocationType, StockItem, StockLot
        from apps.api.app.purchasing.models import Supplier, SupplierContact
        from apps.api.app.production.models import Machine, MachineStatus
        from apps.api.app.labour.models import Labourer, LabourType, LabourRate
        from apps.api.app.assets.models import AssetType, Asset, AssetCondition
        from apps.api.app.dispatch.models import TransportProvider, TransportType

        # 6.1 Stock Locations
        print("  Creating Stock Locations...")
        loc_main = StockLocation(code="LOC-MAIN", name="Central Main Store", location_type=StockLocationType.MAIN_STORE)
        loc_prod = StockLocation(code="LOC-PROD", name="Printing Press Floor", location_type=StockLocationType.PRODUCTION)
        loc_labour = StockLocation(code="LOC-LABOUR", name="Outside Labour Depot", location_type=StockLocationType.OUTSIDE_LABOUR)
        db.add_all([loc_main, loc_prod, loc_labour])
        await db.flush()

        # 6.2 Raw Material Stock Items
        print("  Creating Stock Items & Initial Physical Lots...")
        item_pvc = StockItem(code="MAT-PVC-01", name="PVC White Core 0.76mm", unit="SHEETS", cost_price=12.50, min_stock_level=1000)
        item_ribbon = StockItem(code="MAT-RIB-16", name="Satin Ribbon 16mm Navy", unit="METERS", cost_price=1.80, min_stock_level=5000)
        item_hook = StockItem(code="MAT-HOK-16", name="Metal Dog Hook 16mm", unit="PCS", cost_price=1.20, min_stock_level=5000)
        db.add_all([item_pvc, item_ribbon, item_hook])
        await db.flush()

        # Seed initial lots
        db.add(StockLot(stock_item_id=item_pvc.id, location_id=loc_main.id, lot_number="LOT-PVC-INIT", initial_quantity=10000, current_quantity=10000, cost_per_unit=12.50))
        db.add(StockLot(stock_item_id=item_ribbon.id, location_id=loc_main.id, lot_number="LOT-RIB-INIT", initial_quantity=50000, current_quantity=50000, cost_per_unit=1.80))
        db.add(StockLot(stock_item_id=item_hook.id, location_id=loc_main.id, lot_number="LOT-HOK-INIT", initial_quantity=40000, current_quantity=40000, cost_per_unit=1.20))

        # 6.3 Suppliers
        print("  Creating Suppliers...")
        supp_ribbon = Supplier(code="SUPP-NAT-01", name="National Ribbon Mills Ltd", contact_person="Vipin Singhal", phone="+91 98765 43210", tax_identifier="23AAACN1234F1Z5")
        supp_poly = Supplier(code="SUPP-APX-02", name="Apex Polymers India Pvt Ltd", contact_person="Ramesh Jain", phone="+91 98765 43211", tax_identifier="23AABCA5678G2Z1")
        db.add_all([supp_ribbon, supp_poly])
        await db.flush()

        # 6.4 Machines
        print("  Creating Production Machines...")
        mach1 = Machine(code="MCH-ZEBRA-01", name="Zebra ZXP Thermal Card Press #1", machine_type="THERMAL_PRESS", location_id=loc_prod.id, status=MachineStatus.IDLE)
        mach2 = Machine(code="MCH-EPSON-01", name="Epson SureColor Sublimation #1", machine_type="SUBLIMATION", location_id=loc_prod.id, status=MachineStatus.IDLE)
        db.add_all([mach1, mach2])

        # 6.5 Labourers & Rates
        print("  Creating Labourers and Piece Rates...")
        labourer1 = Labourer(code="LAB-RAMESH", name="Ramesh Kumar", phone="+91 91234 56780", labour_type=LabourType.OUTSIDE_CONTRACT)
        labourer2 = Labourer(code="LAB-SURESH", name="Suresh Patel", phone="+91 91234 56781", labour_type=LabourType.OUTSIDE_CONTRACT)
        db.add_all([labourer1, labourer2])
        await db.flush()

        rate_mpl = LabourRate(product_id=prod_mpl.id, operation_name="MPL_FITTING", rate_per_unit=0.80)
        rate_punch = LabourRate(product_id=prod_idcard.id, operation_name="CARD_PUNCHING", rate_per_unit=0.35)
        db.add_all([rate_mpl, rate_punch])

        # 6.6 Assets & Tools
        print("  Creating Asset Types & Assets...")
        ast_type = AssetType(code="TOOL-CUTTER", name="Ultrasonic Ribbon Cutter")
        db.add(ast_type)
        await db.flush()
        db.add(Asset(asset_code="AST-CUT-001", asset_type_id=ast_type.id, name="Ultrasonic Cutter Unit #1", condition=AssetCondition.EXCELLENT, location_id=loc_prod.id))

        # 6.7 Transport Providers
        print("  Creating Transport Providers...")
        db.add(TransportProvider(code="BUS-HANS", name="Hans Travels Night Bus Service", provider_type=TransportType.BUS, contact_phone="+91 98260 55555"))
        db.add(TransportProvider(code="COURIER-DTDC", name="DTDC Express Courier", provider_type=TransportType.DTDC, contact_phone="1800 209 6677"))
        db.add(TransportProvider(code="PORTER-LOCAL", name="Porter Intra-City Mini-Trucks", provider_type=TransportType.PORTER, contact_phone="+91 80 4411 4411"))

        await db.commit()
        print("✨ OfficeFloww Database (Phase 1 & Phase 2) Seeded Successfully!")


if __name__ == "__main__":
    asyncio.run(seed())
