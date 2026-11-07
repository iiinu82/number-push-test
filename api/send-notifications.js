export default function handler(req, res) {
  res.status(200).json({
    success: true,
    message: "Notification API is working!",
  });
}
