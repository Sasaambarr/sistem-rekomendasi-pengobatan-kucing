let semuaGejala = [];
let currentPage = 0;
let perPage = 7;
let jawaban = {};

async function loadGejala() {
  let res = await fetch("/gejala", {
    credentials: "include"
  });

  semuaGejala = await res.json();
  render();
}

function render() {
  let container = document.getElementById("gejala-container");
  container.innerHTML = "";

  let start = currentPage * perPage;
  let end = start + perPage;

  let pageGejala = semuaGejala.slice(start, end);

  pageGejala.forEach(g => {
    let status = jawaban[g];

    container.innerHTML += `
      <div class="row">
        <div class="gejala">${g}</div>
        <div class="opsi">
          <button class="btn-opsi ${status === 'ya' ? 'active-ya' : ''}" onclick="pilih('${g}','ya', this)">Ya</button>
          <button class="btn-opsi ${status === 'tidak' ? 'active-tidak' : ''}" onclick="pilih('${g}','tidak', this)">Tidak</button>
        </div>
      </div>
    `;
  });

  document.querySelector(".prev").style.display =
    currentPage === 0 ? "none" : "inline-block";

  document.querySelector(".next").style.display =
    (currentPage + 1) * perPage >= semuaGejala.length ? "none" : "inline-block";
}

function pilih(gejala, value, el) {
  jawaban[gejala] = value;

  let parent = el.parentElement;
  parent.querySelectorAll("button").forEach(btn =>
    btn.classList.remove("active-ya", "active-tidak")
  );

  if (value === "ya") el.classList.add("active-ya");
  else el.classList.add("active-tidak");
}

function nextPage() {
  currentPage++;
  render();
}

function prevPage() {
  currentPage--;
  render();
}

function resetForm() {
  jawaban = {};
  currentPage = 0;
  render();
}

async function predict() {
  let gejalaYa = Object.keys(jawaban).filter(g => jawaban[g] === "ya");

  if (gejalaYa.length === 0) {
    alert("Pilih minimal 1 gejala YA");
    return;
  }

  let res = await fetch("/predict", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    credentials: "include",
    body: JSON.stringify({ gejala: gejalaYa })
  });

  let data = await res.json();

  let tanggal = new Date().toISOString();

  let hasil = {
    penyakit: data.penyakit,
    obat: data.obat,
    gejala: gejalaYa,
    top3: data.top3,
    tanggal: tanggal
  };

  // simpan hasil ke localStorage
  localStorage.setItem("hasil", JSON.stringify(hasil));

  // simpan ke database
  let pasien_id = localStorage.getItem("pasien_id");

  if (pasien_id) {
    await fetch("/simpan_riwayat", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        pasien_id: pasien_id,
        penyakit: data.penyakit,
        obat: data.obat,
        tanggal: tanggal
      })
    });
  }

  // pindah ke halaman hasil
  window.location.href = "/hasil";
}

async function logout() {
  await fetch("/logout", {
    method: "GET",
    credentials: "include"
  });

  window.location.href = "/";
}

async function loadPasien() {
  let id = localStorage.getItem("pasien_id");

  if (!id) return;

  let res = await fetch("/get_pasien_by_id/" + id);
  let data = await res.json();

  let el = document.getElementById("info-pasien");
  if (el) {
    el.innerText =
      `Pasien: ${data.nama_kucing} (${data.jenis}) - Pemilik: ${data.nama_pemilik}`;
  }
}

// jalankan saat halaman dibuka
function render() {
    let container = document.getElementById("gejala-container");

    if (!container) return;

    container.innerHTML = "";
}