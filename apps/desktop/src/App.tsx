import React, { useState, useEffect } from "react";
import { OfficeFlowwClient } from "@officefloww/api-client";
import { User, Order, Task, Client, FileFolder, Approval } from "@officefloww/api-types";

const client = new OfficeFlowwClient({ baseUrl: "http://localhost:8000/api/v1" });

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [email, setEmail] = useState("admin@officefloww.com");
  const [password, setPassword] = useState("OfficeFloww@2026");
  const [activeTab, setActiveTab] = useState<"dashboard" | "clients" | "orders" | "tasks" | "files">("dashboard");

  // Domain states
  const [orders, setOrders] = useState<Order[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await client.auth.login({ email, password });
      setCurrentUser(res.user);
      loadDashboardData();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to login");
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [oList, tList, cList, aList] = await Promise.all([
        client.orders.list(),
        client.tasks.list(),
        client.clients.list(),
        client.approvals.list(),
      ]);
      setOrders(oList);
      setTasks(tList);
      setClients(cList);
      setApprovals(aList);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      await client.tasks.complete(taskId, "Completed from desktop UI stub");
      await loadDashboardData();
    } catch (err: any) {
      alert(`Error completing task: ${err.message}`);
    }
  };

  const handleApprove = async (approvalId: string) => {
    try {
      await client.approvals.approve(approvalId, "Approved via desktop interface stub");
      await loadDashboardData();
    } catch (err: any) {
      alert(`Error approving: ${err.message}`);
    }
  };

  if (!currentUser) {
    return (
      <div style={{ maxWidth: 400, margin: "100px auto" }} className="card">
        <h2>OfficeFloww Desktop Login</h2>
        {errorMsg && <p style={{ color: "#ef4444" }}>{errorMsg}</p>}
        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div>
            <label>Email: </label>
            <input style={{ width: "100%" }} value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label>Password: </label>
            <input style={{ width: "100%" }} type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <button type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2>OfficeFloww Production OS</h2>
        <div>
          <span>Logged in as: <strong>{currentUser.full_name} ({currentUser.role})</strong> </span>
          <button onClick={() => setCurrentUser(null)} style={{ background: "#475569", marginLeft: 10 }}>Logout</button>
        </div>
      </header>

      <div className="nav">
        <button onClick={() => setActiveTab("dashboard")}>Dashboard ({orders.length} Orders)</button>
        <button onClick={() => setActiveTab("clients")}>Clients ({clients.length})</button>
        <button onClick={() => setActiveTab("orders")}>Orders</button>
        <button onClick={() => setActiveTab("tasks")}>Task Queue ({tasks.length})</button>
        <button onClick={() => setActiveTab("files")}>Approvals ({approvals.length})</button>
        <button onClick={loadDashboardData} style={{ background: "#059669", marginLeft: "auto" }}>Refresh Live Data</button>
      </div>

      {loading && <p>Loading operational data...</p>}
      {errorMsg && <p style={{ color: "#ef4444" }}>{errorMsg}</p>}

      {/* DASHBOARD TAB */}
      {activeTab === "dashboard" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
            <div className="card"><h3>Active Orders</h3><p style={{ fontSize: 28, margin: 0 }}>{orders.length}</p></div>
            <div className="card"><h3>Pending Tasks</h3><p style={{ fontSize: 28, margin: 0 }}>{tasks.filter(t => t.status !== "COMPLETED").length}</p></div>
            <div className="card"><h3>Clients</h3><p style={{ fontSize: 28, margin: 0 }}>{clients.length}</p></div>
            <div className="card"><h3>Pending Approvals</h3><p style={{ fontSize: 28, margin: 0 }}>{approvals.filter(a => a.status === "PENDING").length}</p></div>
          </div>
        </div>
      )}

      {/* ORDERS TAB */}
      {activeTab === "orders" && (
        <div className="card">
          <h3>Production Orders</h3>
          <table>
            <thead>
              <tr><th>Order #</th><th>Client ID</th><th>Status</th><th>Priority</th><th>Total Amount</th></tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td><strong>{o.order_number}</strong></td>
                  <td>{o.client_id}</td>
                  <td>{o.status}</td>
                  <td>{o.priority}</td>
                  <td>INR {o.total_amount.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TASKS TAB */}
      {activeTab === "tasks" && (
        <div className="card">
          <h3>Active Shop-Floor Tasks</h3>
          <table>
            <thead>
              <tr><th>Task Code</th><th>Title</th><th>Role</th><th>Status</th><th>Action</th></tr>
            </thead>
            <tbody>
              {tasks.map((t) => (
                <tr key={t.id}>
                  <td><code>{t.task_code}</code></td>
                  <td>{t.title}</td>
                  <td>{t.assigned_role || "Unassigned"}</td>
                  <td>{t.status}</td>
                  <td>
                    {t.status !== "COMPLETED" && (
                      <button onClick={() => handleCompleteTask(t.id)}>Mark Complete</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* APPROVALS TAB */}
      {activeTab === "files" && (
        <div className="card">
          <h3>Artwork & Sample Approvals</h3>
          <table>
            <thead>
              <tr><th>Approval ID</th><th>Order ID</th><th>Status</th><th>Comments</th><th>Action</th></tr>
            </thead>
            <tbody>
              {approvals.map((a) => (
                <tr key={a.id}>
                  <td><code>{a.id.slice(0, 8)}</code></td>
                  <td>{a.order_id}</td>
                  <td>{a.status}</td>
                  <td>{a.comments || "-"}</td>
                  <td>
                    {a.status === "PENDING" && (
                      <button onClick={() => handleApprove(a.id)} style={{ background: "#16a34a" }}>Approve</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* CLIENTS TAB */}
      {activeTab === "clients" && (
        <div className="card">
          <h3>Registered Clients</h3>
          <table>
            <thead>
              <tr><th>Client Code</th><th>Organization</th><th>Tax / GST</th><th>Contacts</th></tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.id}>
                  <td><strong>{c.client_code}</strong></td>
                  <td>{c.organization_name}</td>
                  <td>{c.tax_identifier || "-"}</td>
                  <td>{c.contacts?.length || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
