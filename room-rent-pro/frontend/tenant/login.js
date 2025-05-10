// frontend/tenant/login.js
document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
  
    const national_id = document.getElementById("national_id").value;
    const password = document.getElementById("password").value;
  
    try {
      const response = await fetch("http://localhost:5000/api/auth/login/tenant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ national_id, password })
      });
  
      const data = await response.json();
  
      if (response.ok) {
        localStorage.setItem("tenant_token", data.token);
        window.location.href = "profile.html";

      } else {
        document.getElementById("error").textContent = data.error || "เข้าสู่ระบบไม่สำเร็จ";
      }
    } catch (err) {
      console.error("❌ login error:", err);
      document.getElementById("error").textContent = "เกิดข้อผิดพลาด";
    }
  });
  