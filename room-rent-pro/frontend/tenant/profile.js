// frontend/tenant/profile.js

document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("tenant_token");
  if (!token) {
    alert("กรุณาเข้าสู่ระบบก่อน");
    return window.location.href = "login.html";
  }

  const form = document.getElementById("profileForm");
  const msg  = document.getElementById("msg");
  const API    = "http://localhost:5000/api/tenants/me";

  // โหลดข้อมูลโปรไฟล์
  try {
    const res = await fetch(API, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error("ไม่สามารถโหลดข้อมูลโปรไฟล์ได้");
    const data = await res.json();
    document.getElementById("name").value  = data.name;
    document.getElementById("phone").value = data.phone || "";
    document.getElementById("email").value = data.email || "";
  } catch (error) {
    console.error("❌ Error loading profile:", error);
    msg.style.color = "red";
    msg.textContent = error.message;
  }

  // บันทึกการเปลี่ยนแปลง
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    msg.textContent = "";
    try {
      const payload = {
        name:  document.getElementById("name").value.trim(),
        phone: document.getElementById("phone").value.trim(),
        email: document.getElementById("email").value.trim()
      };
      const res = await fetch(API, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "ไม่สามารถบันทึกข้อมูลได้");
      msg.style.color = "green";
      msg.textContent = result.message || "บันทึกเรียบร้อย";
    } catch (error) {
      console.error("❌ Error updating profile:", error);
      msg.style.color = "red";
      msg.textContent = error.message;
    }
  });
});
