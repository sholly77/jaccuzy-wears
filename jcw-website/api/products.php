<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$db = getDB();

switch($method) {
    case 'GET':
        // Get all products or single product
        if (isset($_GET['id'])) {
            $id = intval($_GET['id']);
            $stmt = $db->prepare("SELECT * FROM products WHERE id = ?");
            $stmt->bind_param("i", $id);
            $stmt->execute();
            $result = $stmt->get_result();
            $product = $result->fetch_assoc();
            sendResponse($product ?: ['error' => 'Product not found']);
        } else {
            $category = isset($_GET['category']) ? $_GET['category'] : null;
            if ($category && $category !== 'all') {
                $stmt = $db->prepare("SELECT * FROM products WHERE category = ? ORDER BY created_at DESC");
                $stmt->bind_param("s", $category);
            } else {
                $stmt = $db->prepare("SELECT * FROM products ORDER BY created_at DESC");
            }
            $stmt->execute();
            $result = $stmt->get_result();
            $products = [];
            while ($row = $result->fetch_assoc()) {
                $products[] = $row;
            }
            sendResponse($products);
        }
        break;

    case 'POST':
        // Add new product (with image upload)
        $data = $_POST;
        
        // Handle image upload
        $imageName = 'default.jpg';
        if (isset($_FILES['image']) && $_FILES['image']['error'] === 0) {
            $uploadDir = '../images/products/';
            if (!file_exists($uploadDir)) {
                mkdir($uploadDir, 0777, true);
            }
            
            $imageName = time() . '_' . basename($_FILES['image']['name']);
            $targetPath = $uploadDir . $imageName;
            
            // Validate image
            $allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
            if (!in_array($_FILES['image']['type'], $allowedTypes)) {
                sendResponse(['error' => 'Invalid image type. Only JPG, PNG, WEBP allowed'], 400);
            }
            
            if ($_FILES['image']['size'] > 5 * 1024 * 1024) {
                sendResponse(['error' => 'Image too large. Max 5MB'], 400);
            }
            
            if (!move_uploaded_file($_FILES['image']['tmp_name'], $targetPath)) {
                sendResponse(['error' => 'Failed to upload image'], 500);
            }
        }

        $stmt = $db->prepare("INSERT INTO products (name, category, price, original_price, badge, image, stock, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->bind_param("ssddssis", 
            $data['name'],
            $data['category'],
            $data['price'],
            $data['original_price'],
            $data['badge'],
            $imageName,
            $data['stock'],
            $data['description']
        );
        
        if ($stmt->execute()) {
            sendResponse(['success' => true, 'id' => $db->insert_id, 'image' => $imageName]);
        } else {
            sendResponse(['error' => 'Failed to add product'], 500);
        }
        break;

    case 'PUT':
        // Update product
        parse_str(file_get_contents("php://input"), $data);
        $id = intval($data['id']);
        
        $stmt = $db->prepare("UPDATE products SET name=?, category=?, price=?, original_price=?, badge=?, stock=?, description=? WHERE id=?");
        $stmt->bind_param("ssddssii",
            $data['name'],
            $data['category'],
            $data['price'],
            $data['original_price'],
            $data['badge'],
            $data['stock'],
            $data['description'],
            $id
        );
        
        if ($stmt->execute()) {
            sendResponse(['success' => true]);
        } else {
            sendResponse(['error' => 'Failed to update product'], 500);
        }
        break;

    case 'DELETE':
        // Delete product
        $id = intval($_GET['id']);
        
        // Get image name first
        $stmt = $db->prepare("SELECT image FROM products WHERE id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        $product = $result->fetch_assoc();
        
        if ($product && $product['image'] !== 'default.jpg') {
            $imagePath = '../images/products/' . $product['image'];
            if (file_exists($imagePath)) {
                unlink($imagePath);
            }
        }
        
        $stmt = $db->prepare("DELETE FROM products WHERE id = ?");
        $stmt->bind_param("i", $id);
        
        if ($stmt->execute()) {
            sendResponse(['success' => true]);
        } else {
            sendResponse(['error' => 'Failed to delete product'], 500);
        }
        break;
}

$db->close();
?>