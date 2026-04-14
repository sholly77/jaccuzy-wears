<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$db = getDB();

switch($method) {
    case 'GET':
        $stmt = $db->prepare("SELECT * FROM subscribers ORDER BY subscribed_at DESC");
        $stmt->execute();
        $result = $stmt->get_result();
        $subscribers = [];
        while ($row = $result->fetch_assoc()) {
            $subscribers[] = $row;
        }
        sendResponse($subscribers);
        break;

    case 'POST':
        $data = json_decode(file_get_contents('php://input'), true);
        $email = $data['email'];
        
        $stmt = $db->prepare("INSERT INTO subscribers (email) VALUES (?) ON DUPLICATE KEY UPDATE email=email");
        $stmt->bind_param("s", $email);
        
        if ($stmt->execute()) {
            sendResponse(['success' => true]);
        } else {
            sendResponse(['error' => 'Failed to subscribe'], 500);
        }
        break;
}

$db->close();
?>