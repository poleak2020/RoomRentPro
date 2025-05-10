// frontend/admin/login.js
document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
  
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
  
    try {
      const res = await fetch("http://localhost:5000/api/auth/login/admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, password })
      });
  
      const data = await res.json();
  
      if (res.ok) {
        localStorage.setItem("admin_token", data.token);
        window.location.href = "rooms.html"; // ✅ เปลี่ยนหน้าเมื่อ login สำเร็จ
      } else {
        document.getElementById("error").textContent = data.error || "เข้าสู่ระบบไม่สำเร็จ";
      }
    } catch (err) {
      console.error("❌ login error:", err);
      document.getElementById("error").textContent = "เกิดข้อผิดพลาดจากระบบ";
    }
  });
  