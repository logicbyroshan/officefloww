# 18 — Print & Hardware Peripherals UX

PrintFlow interfaces with factory shop-floor hardware:

---

## 1. Hardware Integration Profile

| Device Class | Model / Protocol | UX Touchpoint in PrintFlow |
| :--- | :--- | :--- |
| **Thermal Label Printer** | Zebra ZD220 / TSPL / ESC-POS | One-click carton barcode label printing from `Tasks` (Packing stage) |
| **Barcode / QR Scanner** | Honeywell / Datalogic USB HID | Instant order / ticket lookup via global search shortcut |
| **Electronic Precision Scale** | Serial RS-232 / USB HID | Real-time bundle count verification in Packing modal |
| **Industrial Press Controllers** | Modbus TCP / MQTT | Real-time temperature and cycle telemetry displayed in `Settings` (Machines) |
