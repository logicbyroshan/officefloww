import React, { useState } from "react";
import { ClientCreate } from "@officefloww/api-types";
import { ClientsService } from "../../api/services";
import { Modal } from "../../design-system/components/Modal";
import { Input, Textarea } from "../../design-system/components/Input";
import { Button } from "../../design-system/components/Button";
import { useToast } from "../../design-system/components/Toast";

export interface NewClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClientCreated: () => void;
}

export const NewClientModal: React.FC<NewClientModalProps> = ({
  isOpen,
  onClose,
  onClientCreated,
}) => {
  const { success, error: toastError } = useToast();
  const [clientCode, setClientCode] = useState("");
  const [orgName, setOrgName] = useState("");
  const [taxIdentifier, setTaxIdentifier] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactDesignation, setContactDesignation] = useState("Principal / Director");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientCode.trim() || !orgName.trim()) {
      toastError("Validation Error", "Client Code and Organization Name are required.");
      return;
    }

    setLoading(true);
    try {
      const payload: ClientCreate = {
        client_code: clientCode.trim().toUpperCase(),
        organization_name: orgName.trim(),
        tax_identifier: taxIdentifier.trim() || undefined,
        billing_address: billingAddress.trim() || undefined,
        delivery_address: deliveryAddress.trim() || undefined,
        contacts: contactName
          ? [
              {
                name: contactName.trim(),
                email: contactEmail.trim() || undefined,
                phone: contactPhone.trim() || undefined,
                designation: contactDesignation.trim() || undefined,
                is_primary: true,
              },
            ]
          : [],
      };

      await ClientsService.create(payload);
      success("Client Onboarded", `Client ${orgName} registered successfully.`);
      onClientCreated();
      onClose();
    } catch (err: any) {
      toastError("Failed to Create Client", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Onboard New Commercial Client"
      subtitle="Register institutional client details, GSTIN tax identifiers, and primary contacts"
      width={560}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={loading}>
            Register Client
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "10px" }}>
          <Input
            label="Client Code"
            placeholder="CLI-DPS-01"
            value={clientCode}
            onChange={(e) => setClientCode(e.target.value)}
            required
          />
          <Input
            label="Organization Name"
            placeholder="Delhi Public School"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            required
          />
        </div>

        <Input
          label="GSTIN / Tax Identifier"
          placeholder="27AAACS1234F1Z5"
          value={taxIdentifier}
          onChange={(e) => setTaxIdentifier(e.target.value)}
        />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          <Textarea
            label="Billing Address"
            placeholder="Campus address for GST invoices..."
            value={billingAddress}
            onChange={(e) => setBillingAddress(e.target.value)}
            rows={2}
          />
          <Textarea
            label="Delivery Address"
            placeholder="Dispatch location for packaged boxes..."
            value={deliveryAddress}
            onChange={(e) => setDeliveryAddress(e.target.value)}
            rows={2}
          />
        </div>

        {/* Primary Contact */}
        <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "12px", display: "flex", flexDirection: "column", gap: "10px" }}>
          <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)" }}>
            Primary Contact Person
          </span>
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "10px" }}>
            <Input
              label="Contact Name"
              placeholder="Dr. Rajesh Sharma"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
            />
            <Input
              label="Designation"
              placeholder="Principal / Admin Officer"
              value={contactDesignation}
              onChange={(e) => setContactDesignation(e.target.value)}
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <Input
              label="Email"
              type="email"
              placeholder="principal@school.edu"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
            />
            <Input
              label="Phone Number"
              placeholder="+91 98200 11223"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
            />
          </div>
        </div>
      </form>
    </Modal>
  );
};
