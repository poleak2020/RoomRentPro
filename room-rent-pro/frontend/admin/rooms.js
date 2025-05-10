document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("admin_token");
  if (!token) {
    alert("กรุณาเข้าสู่ระบบก่อน");
    return window.location.href = "login.html";
  }

  const API_URL = "http://localhost:5000/api/rooms";
  const tbody   = document.getElementById("roomTableBody");

  async function loadRooms() {
    tbody.innerHTML = "";
    try {
      const res = await fetch(API_URL, { headers: { Authorization: `Bearer ${token}` } });
      const rooms = await res.json();

      rooms.forEach(room => {
        const tr = document.createElement("tr");
        const availability = room.tenant_id ? "มีผู้เช่า" : "ว่าง";

        tr.innerHTML = `
          <td>${room.name}</td>
          <td>${room.floor}</td>
          <td>${room.rent_price}</td>
          <td>${availability}</td>
          <td>${room.tenant_id ?? "-"}</td>
        `;

        const editBtn = document.createElement("button");
        editBtn.textContent = "✏️";
        editBtn.addEventListener("click", () => {
          document.getElementById("roomName").value = room.name;
          document.getElementById("roomFloor").value = room.floor;
          document.getElementById("roomPrice").value = room.rent_price;
          document.getElementById("addRoomForm").dataset.editId = room.id;
        });

        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "🗑️";
        deleteBtn.addEventListener("click", async () => {
          if (!confirm("ยืนยันการลบห้องนี้?")) return;
          await fetch(`${API_URL}/${room.id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` }
          });
          loadRooms();
        });

        // ✅ ปุ่มเช่าห้อง
        const rentBtn = document.createElement("button");
        if (!room.tenant_id) {
          rentBtn.textContent = "🏠 เช่าห้อง";
          rentBtn.addEventListener("click", async () => {
            const tenantId = prompt("กรอกรหัสผู้เช่า (tenant_id):");
            if (!tenantId) return;

            const res = await fetch(`${API_URL}/${room.id}/rent`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({ tenant_id: tenantId })
            });

            const data = await res.json();
            if (res.ok) {
              alert("เช่าห้องเรียบร้อยแล้ว");
              loadRooms();
            } else {
              alert(data.error || "เกิดข้อผิดพลาด");
            }
          });
        }

        // ✅ ปุ่มคืนห้อง
        const checkoutBtn = document.createElement("button");
        if (room.tenant_id) {
          checkoutBtn.textContent = "🔄 คืนห้อง";
          checkoutBtn.addEventListener("click", async () => {
            if (!confirm("ยืนยันการคืนห้องนี้?")) return;
            const res = await fetch(`${API_URL}/${room.id}/checkout`, {
              method: "POST",
              headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
              alert("คืนห้องสำเร็จ");
              loadRooms();
            } else {
              alert(data.error || "เกิดข้อผิดพลาด");
            }
          });
        }

        const toolCell = document.createElement("td");
        toolCell.appendChild(editBtn);
        toolCell.appendChild(deleteBtn);
        if (!room.tenant_id) toolCell.appendChild(rentBtn);
        if (room.tenant_id) toolCell.appendChild(checkoutBtn);

        tr.appendChild(toolCell);
        tbody.appendChild(tr);
      });
    } catch (err) {
      console.error("❌ loadRooms error:", err);
      tbody.innerHTML = `<tr><td colspan="6" style="color:red;">ไม่สามารถโหลดข้อมูลห้องได้</td></tr>`;
    }
  }

  document.getElementById("addRoomForm").addEventListener("submit", async e => {
    e.preventDefault();
    const form = e.target;
    const name  = document.getElementById("roomName").value.trim();
    const floor = Number(document.getElementById("roomFloor").value);
    const rent_price = Number(document.getElementById("roomPrice").value);
    const editId     = form.dataset.editId;

    const method = editId ? "PUT" : "POST";
    const url    = editId ? `${API_URL}/${editId}` : API_URL;

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name, floor, rent_price })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "เกิดข้อผิดพลาด");
      form.reset();
      delete form.dataset.editId;
      loadRooms();
    } catch (err) {
      console.error("❌ add/edit room error:", err);
      alert(err.message);
    }
  });

  window.logout = () => {
    localStorage.removeItem("admin_token");
    window.location.href = "login.html";
  };

  loadRooms();
});
