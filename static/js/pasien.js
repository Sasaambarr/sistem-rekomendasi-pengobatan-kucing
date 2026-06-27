async function simpanPasien() {
  let data = {
    nama_pemilik: document.getElementById("nama_pemilik").value,
    nama_kucing: document.getElementById("nama_kucing").value,
    jenis: document.getElementById("jenis").value,
    umur: document.getElementById("umur").value
  };

  await fetch("/pasien", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    credentials: "include",
    body: JSON.stringify(data)
  });

  window.location.href = "/";
}