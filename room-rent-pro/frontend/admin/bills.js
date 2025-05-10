document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("admin_token");
  if (!token) {
    alert("กรุณาเข้าสู่ระบบก่อน");
    return window.location.href = "login.html";
  }

  const BILL_API = "http://localhost:5000/api/bills";
  const tbody = document.getElementById("billTableBody");
  const totalAmountDiv = document.getElementById("totalAmount");
  const currentPageDisplay = document.getElementById("currentPageDisplay");

  let allBills = [];
  let currentPage = 1;
  const rowsPerPage = 10;

  async function loadBills() {
    tbody.innerHTML = "";
    totalAmountDiv.textContent = "🔄 กำลังโหลด...";

    try {
      const res = await fetch(BILL_API, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("ไม่สามารถดึงข้อมูลบิลได้");
      allBills = await res.json();

      if (!allBills.length) {
        tbody.innerHTML = `<tr><td colspan="10" style="text-align:center;">ไม่มีรายการบิล</td></tr>`;
        totalAmountDiv.textContent = "";
        return;
      }

      renderPage();
    } catch (err) {
      console.error("❌ loadBills error:", err);
      tbody.innerHTML = `<tr><td colspan="10" style="color:red">${err.message}</td></tr>`;
      totalAmountDiv.textContent = "";
    }
  }

  function renderPage() {
    tbody.innerHTML = "";
    const start = (currentPage - 1) * rowsPerPage;
    const paginatedBills = allBills.slice(start, start + rowsPerPage);
    let total = 0;

    paginatedBills.forEach((b, idx) => {
      const tr = document.createElement("tr");

      const statusColor = {
        "ยังไม่จ่าย": "#f8d7da",
        "รออนุมัติ": "#fff3cd",
        "จ่ายแล้ว": "#d4edda"
      };
      tr.style.backgroundColor = statusColor[b.status] || "transparent";

      const statusIcon = {
        "ยังไม่จ่าย": "⏳ ยังไม่จ่าย",
        "รออนุมัติ": "🕒 รออนุมัติ",
        "จ่ายแล้ว": "✅ จ่ายแล้ว"
      };
      const statusText = statusIcon[b.status] || b.status;

      tr.innerHTML = `
        <td>${b.id}</td>
        <td>${start + idx + 1}</td>
        <td>${b.billing_month}</td>
        <td>${b.room_name}</td>
        <td>${b.tenant_name}</td>
        <td>${Number(b.amount).toLocaleString()} บาท</td>
        <td>${statusText}</td>
        <td>${b.due_date?.slice(0, 10) || "-"}</td>
        <td>${b.paid_at?.slice(0, 10) || "-"}</td>
      `;

      const actionTd = document.createElement("td");
      if (b.status === "ยังไม่จ่าย" || b.status === "รออนุมัติ") {
        const btn = document.createElement("button");
        btn.textContent = "✔️ ทำเครื่องหมายจ่ายแล้ว";
        btn.addEventListener("click", async () => {
          if (!confirm(`ยืนยันว่าบิล #${b.id} จ่ายแล้ว?`)) return;
          btn.disabled = true;
          try {
            const resp = await fetch(`${BILL_API}/${b.id}/pay`, {
              method: "PUT",
              headers: { Authorization: `Bearer ${token}` }
            });
            if (!resp.ok) {
              const err = await resp.json();
              throw new Error(err.error || "อัปเดตสถานะไม่สำเร็จ");
            }
            showToast("อัปเดตสถานะเรียบร้อย ✅");
            loadBills();
          } catch (error) {
            alert("❌ " + error.message);
            btn.disabled = false;
          }
        });
        actionTd.appendChild(btn);
      } else {
        actionTd.textContent = "-";
      }
      tr.appendChild(actionTd);

      const receiptTd = document.createElement("td");
      if (b.status === "จ่ายแล้ว") {
        const viewBtn = document.createElement("button");
        viewBtn.textContent = "📄 ดูใบเสร็จ";
        viewBtn.addEventListener("click", async () => {
          try {
            const res = await fetch(`${BILL_API}/${b.id}/receipt-admin`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) {
              const err = await res.json();
              throw new Error(err.error || "ไม่สามารถโหลดใบเสร็จได้");
            }
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            window.open(url, "_blank");
          } catch (err) {
            alert("❌ " + err.message);
          }
        });
        receiptTd.appendChild(viewBtn);
      } else {
        receiptTd.textContent = "-";
      }
      tr.appendChild(receiptTd);

      tbody.appendChild(tr);
      total += Number(b.amount || 0);
    });

    totalAmountDiv.textContent = `💰 รวมทั้งหมด: ${total.toLocaleString()} บาท`;
    currentPageDisplay.textContent = `หน้า ${currentPage}`;
  }

  window.nextPage = () => {
    if (currentPage * rowsPerPage < allBills.length) {
      currentPage++;
      renderPage();
    }
  };

  window.prevPage = () => {
    if (currentPage > 1) {
      currentPage--;
      renderPage();
    }
  };

  window.filterBills = () => {
    const selectedMonth = document.getElementById("filterMonth").value;
    if (!selectedMonth) return;

    const allRows = tbody.querySelectorAll("tr");
    let total = 0;

    allRows.forEach(row => {
      const billMonth = row.children[2]?.textContent?.trim();
      const amountText = row.children[5]?.textContent?.replace(/[^\d.]/g, '') || "0";
      const amount = parseFloat(amountText);
      const match = billMonth === selectedMonth;

      row.style.display = match ? "" : "none";
      if (match) total += amount;
    });

    totalAmountDiv.textContent = `💰 รวมทั้งหมด: ${total.toLocaleString()} บาท`;
  };

  window.resetFilter = () => {
    document.getElementById("filterMonth").value = "";
    const allRows = tbody.querySelectorAll("tr");
    allRows.forEach(row => row.style.display = "");
    renderPage();
  };

  window.exportCSV = async () => {
    try {
      const res = await fetch(BILL_API, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const bills = await res.json();

      if (!bills.length) {
        alert("ไม่มีข้อมูลบิลให้ดาวน์โหลด");
        return;
      }

      const csvHeader = ["รหัสบิล", "เดือน", "ห้อง", "ผู้เช่า", "จำนวน", "สถานะ", "วันครบกำหนด", "วันจ่าย"];
      const csvRows = [
        csvHeader,
        ...bills.map(b => [
          b.id,
          b.billing_month,
          b.room_name,
          b.tenant_name,
          b.amount,
          b.status,
          b.due_date?.slice(0, 10) || "-",
          b.paid_at?.slice(0, 10) || "-"
        ])
      ];

      const csvContent = csvRows.map(r => r.join(",")).join("\n");
      const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `bills-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("❌ ไม่สามารถส่งออก CSV ได้");
      console.error(err);
    }
  };

  window.logout = () => {
    localStorage.removeItem("admin_token");
    window.location.href = "login.html";
  };

  window.showToast = function (message) {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.style.display = "block";
    setTimeout(() => {
      toast.style.display = "none";
    }, 3000);
  };

  window.searchBills = () => {
    const keyword = document.getElementById("searchInput").value.toLowerCase();
    const rows = tbody.querySelectorAll("tr");
    let total = 0;

    rows.forEach(row => {
      const idText = row.children[0]?.textContent?.toLowerCase() || "";
      const nameText = row.children[4]?.textContent?.toLowerCase() || "";
      const amountText = row.children[5]?.textContent?.replace(/[^\d.]/g, '') || "0";
      const amount = parseFloat(amountText);

      const match = idText.includes(keyword) || nameText.includes(keyword);
      row.style.display = match ? "" : "none";
      if (match) total += amount;
    });

    totalAmountDiv.textContent = `💰 รวมทั้งหมด: ${total.toLocaleString()} บาท`;
  };

  loadBills();
});
