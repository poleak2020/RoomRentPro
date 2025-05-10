// frontend/tenant/bills.js

/**
 * หน้าแสดงรายการบิลย้อนหลังของผู้เช่า
 * ผู้เช่าไม่สามารถจ่ายบิลเอง ต้องให้ Admin จัดการ
 */
document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("tenant_token");
  if (!token) {
    alert("กรุณาเข้าสู่ระบบก่อน");
    window.location.href = "login.html";
    return;
  }

  const API_URL = "http://localhost:5000/api/bills/my";
  const tbody   = document.getElementById("billTableBody");

  async function loadBills() {
    tbody.innerHTML = "";
    try {
      const res = await fetch(API_URL, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("ไม่สามารถดึงข้อมูลบิลได้");
      const bills = await res.json();

      if (!bills.length) {
        tbody.innerHTML = `
          <tr>
            <td colspan="6" style="text-align:center;">ไม่มีรายการบิล</td>
          </tr>`;
        return;
      }

      bills.forEach(bill => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${bill.billing_month}</td>
          <td>${bill.room_name}</td>
          <td>${bill.amount} บาท</td>
          <td>${bill.status}</td>
          <td>${bill.due_date?.slice(0,10) || "-"}</td>
          <td></td>
        `;

        const toolTd = tr.querySelector('td:last-child');
        if (bill.status === "จ่ายแล้ว") {
          const btnView = document.createElement("button");
          btnView.textContent = "📄 ดูใบเสร็จ";
          btnView.addEventListener("click", () => viewReceipt(bill.id));
          toolTd.appendChild(btnView);
        } else {
          // สำหรับบิลที่ยังไม่จ่าย 
          toolTd.textContent = "ชำระได้ที่ office";
        }

        tbody.appendChild(tr);
      });
    } catch (err) {
      console.error("❌ loadBills error:", err);
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="color:red;">${err.message}</td>
        </tr>`;
    }
  }

  // ดูใบเสร็จ PDF
  window.viewReceipt = async (id) => {
    try {
      const res = await fetch(`http://localhost:5000/api/bills/${id}/receipt`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "ไม่สามารถดูใบเสร็จได้");
      }
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      window.open(url, "_blank");
    } catch (err) {
      console.error("❌ viewReceipt error:", err);
      alert(err.message);
    }
  };

  // Logout
  window.logout = () => {
    localStorage.removeItem("tenant_token");
    window.location.href = "login.html";
  };

  loadBills();
});
