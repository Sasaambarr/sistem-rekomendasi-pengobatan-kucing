async function simpanPasien() {
  let data = {
    nama_pemilik: document.getElementById("nama_pemilik").value,
    nama_kucing: document.getElementById("nama_kucing").value,
    jenis: document.getElementById("jenis").value,
    umur: document.getElementById("umur").value
  };

  let res = await fetch("/pasien", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    credentials: "include",
    body: JSON.stringify(data)
  });

  let hasil = await res.json();

  // simpan ID pasien yang baru dibuat
  localStorage.setItem("pasien_id", hasil.id);

  window.location.href = "/";
}