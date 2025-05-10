document.getElementById("changePasswordForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const token = localStorage.getItem("tenant_token");
  if (!token) {
    alert("กรุณาเข้าสู่ระบบก่อน");
    window.location.href = "login.html";
    return;
  }

  const old_password = document.getElementById("old_password").value;
  const new_password = document.getElementById("new_password").value;
  const confirm_password = document.getElementById("confirm_password").value;

  const msg = document.getElementById("message");

  // ✅ ตรวจสอบว่ารหัสผ่านใหม่กับยืนยันตรงกันไหม
  if (new_password !== confirm_password) {
    msg.style.color = "red";
    msg.textContent = "รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน";
    return;
  }

  try {
    const response = await fetch("http://localhost:5000/api/tenants/change-password", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        currentPassword: old_password,
        newPassword: new_password
      })
    });

    const data = await response.json();

    if (response.ok) {
      msg.style.color = "green";
      msg.textContent = "เปลี่ยนรหัสผ่านเรียบร้อยแล้ว";
      setTimeout(() => {
        location.reload(); // 🔄 รีเฟรชหน้าหลังจาก 1.5 วินาที
      }, 500);
    } else {
      msg.style.color = "red";
      msg.textContent = data.error || "ไม่สามารถเปลี่ยนรหัสผ่านได้";
    }
  } catch (err) {
    console.error("❌ เปลี่ยนรหัสผ่านล้มเหลว:", err);
    msg.style.color = "red";
    msg.textContent = "เกิดข้อผิดพลาด";
  }
});


function logout() {
  localStorage.removeItem("tenant_token");
  window.location.href = "login.html";
}
