async function predict() {
  let gejalaYa = Object.keys(jawaban).filter(g => jawaban[g] === "ya");

  let res = await fetch("/predict", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ gejala: gejalaYa })
  });

  let data = await res.json();

  let tanggal = new Date().toISOString().slice(0,19).replace("T"," ");

  // simpan ke local
  localStorage.setItem("hasil", JSON.stringify({
    penyakit: data.penyakit,
    obat: data.obat,
    gejala: gejalaYa,
    top3: data.top3,
    tanggal: tanggal
  }));

  let pasien_id = localStorage.getItem("pasien_id");

  console.log("ID pasien:", pasien_id); // 🔥 penting

  // 🔥 INI YANG NYIMPAN KE DATABASE
  if (pasien_id) {
    let res2 = await fetch("/simpan_riwayat", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        pasien_id: pasien_id,
        penyakit: data.penyakit,
        obat: data.obat,
        tanggal: tanggal
      })
    });

    let result = await res2.json();
    console.log("simpan:", result);
  }

  window.location.href = "/hasil";
}