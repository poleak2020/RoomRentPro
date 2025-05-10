// frontend/admin/tenants.js
document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("admin_token");
  if (!token) {
    alert("กรุณาเข้าสู่ระบบก่อน");
    return window.location.href = "login.html";
  }

  const TENANT_API = "http://localhost:5000/api/tenants";
  const ROOM_API   = "http://localhost:5000/api/rooms";
  const tbody      = document.getElementById("tenantTableBody");
  const form       = document.getElementById("tenantForm");
  const nameInput  = document.getElementById("tName");
  const nidInput   = document.getElementById("tNationalId");
  const phoneInput = document.getElementById("tPhone");
  const emailInput = document.getElementById("tEmail");
  const passInput  = document.getElementById("tPassword");

  async function loadTenants() {
    tbody.innerHTML = "";
    // ดึง tenants + rooms
    const [tRes, rRes] = await Promise.all([
      fetch(TENANT_API, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(ROOM_API,   { headers: { Authorization: `Bearer ${token}` } })
    ]);
    const tenants = await tRes.json();
    const rooms   = await rRes.json();

    // สร้าง map tenantId -> [room names]
    const roomsByTenant = {};
    rooms.forEach(r => {
      if (r.tenant_id) {
        roomsByTenant[r.tenant_id] ||= [];
        roomsByTenant[r.tenant_id].push(r.name);
      }
    });

    tenants.forEach(t => {
      const tr = document.createElement("tr");
      const rented = roomsByTenant[t.id]?.join(", ") || "-";
      tr.innerHTML = `
        <td>${t.name}</td>
        <td>${t.national_id}</td>
        <td>${t.phone || "-"}</td>
        <td>${t.email || "-"}</td>
        <td>${new Date(t.created_at).toLocaleDateString()}</td>
        <td>${rented}</td>
      `;

      // ปุ่ม edit
      const editBtn = document.createElement("button");
      editBtn.textContent = "✏️";
      editBtn.addEventListener("click", () => {
        nameInput.value  = t.name;
        nidInput.value   = t.national_id;
        phoneInput.value = t.phone;
        emailInput.value = t.email;
        passInput.value  = "";              // ไม่แสดงพาสเวิร์ดเดิม
        form.dataset.editId = t.id;
      });

      // ปุ่ม delete
      const delBtn = document.createElement("button");
      delBtn.textContent = "🗑️";
      delBtn.addEventListener("click", async () => {
        if (!confirm("ยืนยันการลบผู้เช่านี้?")) return;
        await fetch(`${TENANT_API}/${t.id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` }
        });
        loadTenants();
      });

      const toolCell = document.createElement("td");
      toolCell.append(editBtn, delBtn);
      tr.appendChild(toolCell);
      tbody.appendChild(tr);
    });
  }

  // ฟอร์ม submit
  form.addEventListener("submit", async e => {
    e.preventDefault();
    const id     = form.dataset.editId;
    const method = id ? "PUT" : "POST";
    const url    = id ? `${TENANT_API}/${id}` : TENANT_API;

    const payload = {
      name:        nameInput.value.trim(),
      phone:       phoneInput.value.trim(),
      national_id: nidInput.value.trim(),
      email:       emailInput.value.trim(),
    };
    // ถ้าเป็นสร้างใหม่ ให้ใส่รหัสผ่าน
    if (!id) payload.password = passInput.value;

    await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    form.reset();
    delete form.dataset.editId;
    loadTenants();
  });

  // Logout
  window.logout = () => {
    localStorage.removeItem("admin_token");
    window.location.href = "login.html";
  };

  loadTenants();
});
