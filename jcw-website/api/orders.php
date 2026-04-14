<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$db = getDB();

switch($method) {
    case 'GET':
        // Get all orders
        $status = isset($_GET['status']) ? $_GET['status'] : null;
        
        if ($status && $status !== 'all') {
            $stmt = $db->prepare("SELECT * FROM orders WHERE status = ? ORDER BY created_at DESC");
            $stmt->bind_param("s", $status);
        } else {
            $stmt = $db->prepare("SELECT * FROM orders ORDER BY created_at DESC");
        }
        
        $stmt->execute();
        $result = $stmt->get_result();
        $orders = [];
        
        while ($row = $result->fetch_assoc()) {
            // Get order items
            $itemsStmt = $db->prepare("SELECT * FROM order_items WHERE order_id = ?");
            $itemsStmt->bind_param("s", $row['order_id']);
            $itemsStmt->execute();
            $itemsResult = $itemsStmt->get_result();
            $items = [];
            while ($item = $itemsResult->fetch_assoc()) {
                $items[] = $item;
            }
            $row['items'] = $items;
            $orders[] = $row;
        }
        
        sendResponse($orders);
        break;

    case 'POST':
        // Create new order
        $data = json_decode(file_get_contents('php://input'), true);
        
        $orderId = 'ORD-' . time() . rand(1000, 9999);
        
        $stmt = $db->prepare("INSERT INTO orders (order_id, customer_name, customer_email, customer_phone, customer_address, total_amount, status) VALUES (?, ?, ?, ?, ?, ?, 'pending')");
        $stmt->bind_param("sssssd",
            $orderId,
            $data['customer']['name'],
            $data['customer']['email'],
            $data['customer']['phone'],
            $data['customer']['address'],
            $data['total']
        );
        
        if ($stmt->execute()) {
            // Insert order items
            foreach ($data['items'] as $item) {
                $itemStmt = $db->prepare("INSERT INTO order_items (order_id, product_id, product_name, quantity, price) VALUES (?, ?, ?, ?, ?)");
                $itemStmt->bind_param("sisid",
                    $orderId,
                    $item['id'],
                    $item['name'],
                    $item['quantity'],
                    $item['price']
                );
                $itemStmt->execute();
                
                // Update stock
                $stockStmt = $db->prepare("UPDATE products SET stock = stock - ? WHERE id = ?");
                $stockStmt->bind_param("ii", $item['quantity'], $item['id']);
                $stockStmt->execute();
            }
            
            sendResponse(['success' => true, 'order_id' => $orderId]);
        } else {
            sendResponse(['error' => 'Failed to create order'], 500);
        }
        break;

    case 'PUT':
        // Update order status
        parse_str(file_get_contents("php://input"), $data);
        $orderId = $data['order_id'];
        $status = $data['status'];
        
        $stmt = $db->prepare("UPDATE orders SET status = ? WHERE order_id = ?");
        $stmt->bind_param("ss", $status, $orderId);
        
        if ($stmt->execute()) {
            sendResponse(['success' => true]);
        } else {
            sendResponse(['error' => 'Failed to update order'], 500);
        }
        break;
}

$db->close();
?>