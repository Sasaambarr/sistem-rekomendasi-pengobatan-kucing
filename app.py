from flask import Flask, request, jsonify, session, render_template
from flask_cors import CORS
from datetime import datetime
import pytz
import joblib
import os
import mysql.connector

db = mysql.connector.connect(
    host=os.getenv("MYSQLHOST"),
    user=os.getenv("MYSQLUSER"),
    password=os.getenv("MYSQLPASSWORD"),
    database=os.getenv("MYSQLDATABASE"),
    port=int(os.getenv("MYSQLPORT", 3306))
)

app = Flask(__name__)

# 🔥 WAJIB untuk session
app.secret_key = "secret123"

# 🔥 WAJIB untuk login/logout pakai fetch
CORS(app, supports_credentials=True)

model = joblib.load("model.pkl")
fitur = joblib.load("fitur.pkl")
mapping_obat = joblib.load("mapping_obat.pkl")

@app.route("/")
def home():
    session.clear()  
    return render_template("login.html")

@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json()
    
    gejala_input = [g.strip().lower() for g in data["gejala"]]

    input_data = [1 if col in gejala_input else 0 for col in fitur]

    hasil = model.predict([input_data])[0]
    obat = mapping_obat.get(hasil.lower(), "Tidak ditemukan")

    # probabilitas
    proba = model.predict_proba([input_data])[0]
    classes = model.classes_

    top = sorted(
        zip(classes, proba),
        key=lambda x: x[1],
        reverse=True
    )[:3]

    top3 = [
        {
            "penyakit": p,
            "persen": round(prob * 100, 2)
        }
        for p, prob in top
    ]

    return jsonify({
        "penyakit": hasil,
        "obat": obat,
        "top3": top3
    })
@app.route("/login", methods=["POST"])
def login():
    data = request.get_json()

    username = data.get("username")
    password = data.get("password")

    # 🔥 admin
    if username == "admin" and password == "123":
        session["user"] = username
        session["role"] = "admin"
        return jsonify({"status": "success", "role": "admin"})

    # 🔥 user biasa
    elif username == "user" and password == "123":
        session["user"] = username
        session["role"] = "user"
        return jsonify({"status": "success", "role": "user"})

    else:
        return jsonify({"status": "fail"})
    
@app.route("/logout", methods=["GET"])
def logout():
    session.clear()
    return jsonify({"message": "Logout berhasil"})

@app.route("/admin")
def admin():
    if session.get("role") != "admin":
        return render_template("login.html")
    return render_template("index.html")

@app.route("/hasil")
def hasil():
    return render_template("hasil.html")

@app.route("/form_pasien")
def form_pasien():
    if "user" not in session:
        return render_template("login.html")
    return render_template("form_pasien.html")

@app.route("/gejala")
def get_gejala():
    return jsonify(fitur)

@app.route("/index")
def index():
    if session.get("role") != "admin":
        return render_template("login.html")
    return render_template("index.html")

@app.route("/tambah_pasien", methods=["POST"])
def tambah_pasien():
    data = request.get_json()

    cursor = db.cursor()

    sql = "INSERT INTO pasien (nama_pemilik, nama_kucing, jenis, umur, alamat) VALUES (%s, %s, %s, %s, %s)"
    
    val = (
        data["nama_pemilik"],
        data["nama_kucing"],
        data["jenis"],
        data["umur"],
        data["alamat"]
    )

    cursor.execute(sql, val)
    db.commit()

    return jsonify({
        "status": "success",
        "id": cursor.lastrowid  # 🔥 penting buat lanjut ke diagnosa
    })

@app.route("/get_pasien")
def get_pasien():
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT * FROM pasien")
    data = cursor.fetchall()
    return jsonify(data)

@app.route("/get_pasien_by_id/<int:id>")
def get_pasien_by_id(id):
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT * FROM pasien WHERE id=%s", (id,))
    data = cursor.fetchone()
    return jsonify(data)

@app.route("/get_riwayat")
def get_riwayat():
    cursor = db.cursor(dictionary=True)

    cursor.execute("""
        SELECT pasien.id, pasien.nama_kucing, pasien.nama_pemilik, pasien.jenis,
               riwayat.penyakit, riwayat.obat, riwayat.tanggal
        FROM pasien
        LEFT JOIN riwayat ON pasien.id = riwayat.pasien_id
        ORDER BY pasien.id DESC
    """)

    data = cursor.fetchall()
    return jsonify(data)

@app.route("/simpan_riwayat", methods=["POST"])
def simpan_riwayat():
    data = request.get_json()
    cursor = db.cursor()
    
      # 🔥 WIB timezone
    tz = pytz.timezone('Asia/Jakarta')
    tanggal = datetime.now(tz)

    # 🔥 ambil data pasien dulu
    cursor.execute("SELECT nama_pemilik, nama_kucing FROM pasien WHERE id=%s", (data.get("pasien_id"),))
    pasien = cursor.fetchone()

    nama_pemilik = pasien[0]
    nama_kucing = pasien[1]

    # 🔥 insert ke diagnosa
    sql = """
    INSERT INTO diagnosa 
    (pasien_id, nama_pemilik, nama_kucing, penyakit, obat, tanggal) 
    VALUES (%s, %s, %s, %s, %s, %s)
    """

    val = (
        data.get("pasien_id"),
        nama_pemilik,
        nama_kucing,
        data.get("penyakit"),
        data.get("obat"),
        data.get("tanggal")
    )

    cursor.execute(sql, val)
    db.commit()

    return jsonify({"status": "success"})


if __name__ == "__main__":
    app.run(debug=True)