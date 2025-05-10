document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("admin_token");
  if (!token) {
    alert("กรุณาเข้าสู่ระบบก่อน");
    return window.location.href = "login.html";
  }

  const ROOM_API = "http://localhost:5000/api/rooms";
  const BILL_API = "http://localhost:5000/api/bills";
  const roomSelect = document.getElementById("room");
  const monthInput = document.getElementById("billing_month");
  const dueInput = document.getElementById("due_date");
  const form = document.getElementById("billForm");
  const msg = document.getElementById("msg");
  const roomCountDiv = document.getElementById("roomCount");

  const today = new Date();
  const currMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const ym = `${currMonth.getFullYear()}-${String(currMonth.getMonth() + 1).padStart(2, '0')}`;
  monthInput.value = ym;
  monthInput.disabled = true;

  const lastDay = new Date(currMonth.getFullYear(), currMonth.getMonth() + 1, 0)
    .toISOString().slice(0, 10);
  dueInput.min = `${ym}-01`;
  dueInput.max = lastDay;
  dueInput.value = `${ym}-01`;

  const day = today.getDate();
  if (day < 1 || day > 30) {
    roomSelect.innerHTML = "<option>-- หมดช่วงสร้างบิลเดือนนี้ --</option>";
    roomSelect.disabled = true;
    form.querySelector("button").disabled = true;
    msg.style.color = "orange";
    msg.textContent = `สร้างบิลได้เฉพาะวันที่ 1–30 ของเดือนนี้ (${ym})`;
    return;
  }

  const [rooms, bills] = await Promise.all([
    fetch(ROOM_API, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .catch(() => []),
    fetch(BILL_API, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .catch(() => [])
  ]);

  const billedRoomSet = new Set(
    bills.filter(b => b.billing_month === ym).map(b => String(b.room_id))
  );

  

  // สร้าง dropdown
  roomSelect.innerHTML = "<option value=''>-- เลือกห้อง --</option>";
  rooms.forEach(r => {
    const opt = document.createElement("option");
    opt.value = r.id;
    opt.textContent = `${r.name} (ชั้น ${r.floor})`;

    if (!r.tenant_id) {
      opt.disabled = true;
      opt.textContent += " — ไม่มีผู้เช่า";
    } else if (billedRoomSet.has(String(r.id))) {
      opt.disabled = true;
      opt.textContent += " — ออกบิลแล้ว";
    }

    roomSelect.appendChild(opt);
  });

  form.addEventListener("submit", async e => {
    e.preventDefault();
    msg.textContent = "";

    const room_id = roomSelect.value;
    if (!room_id) {
      msg.style.color = "red";
      msg.textContent = "⚠️ กรุณาเลือกห้องก่อน";
      return;
    }

    const isDuplicate = bills.some(
      b => String(b.room_id) === String(room_id) && b.billing_month === ym
    );

    if (isDuplicate) {
      msg.style.color = "red";
      msg.textContent = "⚠️ ห้องนี้มีบิลของเดือนนี้สำหรับห้องนี้อยู่แล้ว";
      return;
    }

    try {
      const res = await fetch(BILL_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          room_id,
          billing_month: ym,
          due_date: dueInput.value
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "สร้างบิลไม่สำเร็จ");

      msg.style.color = "green";
      msg.textContent = "สร้างบิลสำเร็จ 🎉";
      form.reset();
      setTimeout(() => location.reload(), 800);
    } catch (err) {
      msg.style.color = "red";
      msg.textContent = err.message;
    }
  });
});

function logout() {
  localStorage.removeItem("admin_token");
  window.location.href = "login.html";
}
