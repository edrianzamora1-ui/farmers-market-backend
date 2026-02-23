const db = require("../db");

// Get Chat History
exports.getChatHistory = (req, res) => {
    const userId = req.user.id;
    const { otherUserId } = req.params;

    const sql = `
    SELECT * FROM messages 
    WHERE (sender_id = ? AND receiver_id = ?) 
       OR (sender_id = ? AND receiver_id = ?)
    ORDER BY created_at ASC
  `;

    db.query(sql, [userId, otherUserId, otherUserId, userId], (err, results) => {
        if (err) return res.status(500).json({ message: "Database error" });
        res.json(results);
    });
};

// Save Message (called via Socket.io usually, but good to have API too)
exports.saveMessage = (req, res) => {
    const senderId = req.user.id;
    const { receiverId, message } = req.body;

    const sql = "INSERT INTO messages (sender_id, receiver_id, message) VALUES (?, ?, ?)";
    db.query(sql, [senderId, receiverId, message], (err, result) => {
        if (err) return res.status(500).json({ message: "Database error" });
        res.status(201).json({ message: "Message sent", id: result.insertId });
    });
};
