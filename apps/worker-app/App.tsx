import React, { useState, useEffect } from "react";
import { View, Text, Button, FlatList, TextInput, StyleSheet } from "react-native";
import { OfficeFlowwClient } from "@officefloww/api-client";
import { Task, QuantityTransactionType } from "@officefloww/api-types";

const client = new OfficeFlowwClient({ baseUrl: "http://10.0.2.2:8000/api/v1" });

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [producedQty, setProducedQty] = useState("100");
  const [rejectedQty, setRejectedQty] = useState("2");
  const [statusMsg, setStatusMsg] = useState("");

  useEffect(() => {
    loginAndFetchTasks();
  }, []);

  const loginAndFetchTasks = async () => {
    try {
      await client.auth.login({
        email: "machineop@officefloww.com",
        password: "OfficeFloww@2026",
      });
      const taskList = await client.tasks.list({ status: "READY" as any });
      setTasks(taskList);
      setStatusMsg(`Connected. Loaded ${taskList.length} active tasks.`);
    } catch (err: any) {
      setStatusMsg(`Error: ${err.message}`);
    }
  };

  const handleRecordProduction = async () => {
    if (!selectedTask) return;
    try {
      // 1. Record Good Units
      await client.quantities.record({
        order_id: selectedTask.order_id,
        order_item_id: selectedTask.order_item_id,
        transaction_type: QuantityTransactionType.PRODUCED,
        quantity: parseInt(producedQty, 10),
      });

      // 2. Record Defect Scrap
      if (parseInt(rejectedQty, 10) > 0) {
        await client.quantities.record({
          order_id: selectedTask.order_id,
          order_item_id: selectedTask.order_item_id,
          transaction_type: QuantityTransactionType.REJECTED,
          quantity: parseInt(rejectedQty, 10),
          reason: "Thermal print head streak defect",
        });
      }

      // 3. Mark task completed
      await client.tasks.complete(selectedTask.id, "Batch printed and inspected on shop floor");
      setStatusMsg(`Successfully logged production for ${selectedTask.task_code}`);
      setSelectedTask(null);
      loginAndFetchTasks();
    } catch (err: any) {
      setStatusMsg(`Failed to record: ${err.message}`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>OfficeFloww Worker App</Text>
      <Text style={styles.status}>{statusMsg}</Text>

      {selectedTask ? (
        <View style={styles.card}>
          <Text style={styles.title}>Task: {selectedTask.title}</Text>
          <Text>Code: {selectedTask.task_code}</Text>

          <Text style={styles.label}>Good Quantity Produced:</Text>
          <TextInput
            style={styles.input}
            value={producedQty}
            keyboardType="numeric"
            onChangeText={setProducedQty}
          />

          <Text style={styles.label}>Rejected Scrap Quantity:</Text>
          <TextInput
            style={styles.input}
            value={rejectedQty}
            keyboardType="numeric"
            onChangeText={setRejectedQty}
          />

          <View style={{ marginTop: 10 }}>
            <Button title="Submit & Complete Task" onPress={handleRecordProduction} />
            <View style={{ marginTop: 6 }} />
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
              <Text>Code: {item.task_code} | Status: {item.status}</Text>
              <Button title="Select Task" onPress={() => setSelectedTask(item)} />
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f8fafc" },
  header: { fontSize: 22, fontWeight: "bold", marginBottom: 10 },
  status: { color: "#2563eb", marginBottom: 15 },
  card: { backgroundColor: "#fff", padding: 15, borderRadius: 8, elevation: 2 },
  taskItem: { backgroundColor: "#fff", padding: 12, marginBottom: 10, borderRadius: 6 },
  title: { fontSize: 16, fontWeight: "600", marginBottom: 4 },
  label: { marginTop: 8, fontSize: 14, color: "#334155" },
  input: { borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 4, padding: 8, marginTop: 4 },
});
