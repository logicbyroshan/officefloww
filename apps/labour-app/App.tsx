import React, { useState, useEffect } from "react";
import { View, Text, Button, FlatList, TextInput, StyleSheet } from "react-native";
import { OfficeFlowwClient } from "@officefloww/api-client";
import { Task, QuantityTransactionType } from "@officefloww/api-types";

const client = new OfficeFlowwClient({ baseUrl: "http://10.0.2.2:8000/api/v1" });

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [completedQty, setCompletedQty] = useState("500");
  const [statusMsg, setStatusMsg] = useState("");

  useEffect(() => {
    loginAndFetchLabourTasks();
  }, []);

  const loginAndFetchLabourTasks = async () => {
    try {
      await client.auth.login({
        email: "packingop@officefloww.com",
        password: "OfficeFloww@2026",
      });
      const taskList = await client.tasks.list({ status: "READY" as any });
      setTasks(taskList);
      setStatusMsg(`Connected. Found ${taskList.length} labour tasks available.`);
    } catch (err: any) {
      setStatusMsg(`Connection error: ${err.message}`);
    }
  };

  const handleSubmitPieceWork = async () => {
    if (!selectedTask) return;
    try {
      const qty = parseInt(completedQty, 10);
      // Log COMPLETED piece-rate units in Quantity Ledger
      await client.quantities.record({
        order_id: selectedTask.order_id,
        order_item_id: selectedTask.order_item_id,
        transaction_type: QuantityTransactionType.COMPLETED,
        quantity: qty,
        reason: "Piece-rate batch finished by worker",
      });

      // Complete task
      await client.tasks.complete(selectedTask.id, `Finished ${qty} units`);
      setStatusMsg(`Successfully submitted ${qty} units for piece payment.`);
      setSelectedTask(null);
      loginAndFetchLabourTasks();
    } catch (err: any) {
      setStatusMsg(`Error submitting work: ${err.message}`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>OfficeFloww Labour App</Text>
      <Text style={styles.status}>{statusMsg}</Text>

      {selectedTask ? (
        <View style={styles.card}>
          <Text style={styles.title}>Job: {selectedTask.title}</Text>
          <Text>Job Code: {selectedTask.task_code}</Text>

          <Text style={styles.label}>Total Units Finished (Piece Work):</Text>
          <TextInput
            style={styles.input}
            value={completedQty}
            keyboardType="numeric"
            onChangeText={setCompletedQty}
          />

          <View style={{ marginTop: 12 }}>
            <Button title="Submit Finished Work" onPress={handleSubmitPieceWork} color="#16a34a" />
            <View style={{ marginTop: 8 }} />
            <Button title="Cancel" color="#64748b" onPress={() => setSelectedTask(null)} />
          </View>
        </View>
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={(item: Task) => item.id}
          renderItem={({ item }: { item: Task }) => (
            <View style={styles.taskItem}>
              <Text style={styles.title}>{item.title}</Text>
              <Text>Code: {item.task_code}</Text>
              <Button title="Log Work" onPress={() => setSelectedTask(item)} />
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f1f5f9" },
  header: { fontSize: 22, fontWeight: "bold", marginBottom: 10, color: "#0f172a" },
  status: { color: "#0284c7", marginBottom: 15 },
  card: { backgroundColor: "#fff", padding: 15, borderRadius: 8, elevation: 2 },
  taskItem: { backgroundColor: "#fff", padding: 12, marginBottom: 10, borderRadius: 6 },
  title: { fontSize: 16, fontWeight: "600", marginBottom: 4 },
  label: { marginTop: 10, fontSize: 14, color: "#475569" },
  input: { borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 4, padding: 8, marginTop: 4 },
});
