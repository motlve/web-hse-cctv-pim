package controllers

import (
	"backend/config"
	"backend/models"
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"github.com/gorilla/mux"
)

// GetAllIncident mengambil semua data aktif secara langsung tanpa soft-delete
func GetAllIncident(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	var incidents []models.IncidentRecord

	// Mengambil semua data langsung dari tabel database asli Anda
	if err := config.DB.Order("id desc").Find(&incidents).Error; err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Gagal mengambil data insiden: " + err.Error()})
		return
	}

	json.NewEncoder(w).Encode(incidents)
}

// CreateIncident mencatat insiden baru dari lapangan
func CreateIncident(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	var incident models.IncidentRecord

	if err := json.NewDecoder(r.Body).Decode(&incident); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Request body tidak valid: " + err.Error()})
		return
	}

	if err := config.DB.Create(&incident).Error; err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Gagal menyimpan insiden: " + err.Error()})
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(incident)
}

// DeleteIncident melakukan HARD DELETE (Langsung hapus permanen dari MySQL)
func DeleteIncident(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	params := mux.Vars(r)
	id, err := strconv.Atoi(params["id"])
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "ID tidak valid"})
		return
	}

	var incident models.IncidentRecord
	if err := config.DB.First(&incident, id).Error; err != nil {
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]string{"error": "Data insiden tidak ditemukan"})
		return
	}

	// Menggunakan Unscoped().Delete() agar GORM menghapus baris data secara permanen dari MySQL
	if err := config.DB.Unscoped().Delete(&incident).Error; err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Gagal menghapus data insiden: " + err.Error()})
		return
	}

	json.NewEncoder(w).Encode(map[string]string{"message": "Data insiden berhasil dihapus permanen"})
}

// UpdateIncident memperbarui data sekaligus menghitung durasi otomatis jika insiden selesai
func UpdateIncident(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	params := mux.Vars(r)
	id, err := strconv.Atoi(params["id"])
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "ID tidak valid"})
		return
	}

	var incident models.IncidentRecord
	if err := config.DB.First(&incident, id).Error; err != nil {
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]string{"error": "Data insiden tidak ditemukan"})
		return
	}

	// Gunakan map untuk membaca data dinamis dari frontend agar field kosong/null bisa ikut terupdate
	var inputData map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&inputData); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Request body tidak valid: " + err.Error()})
		return
	}

	// LOGIKA OTOMATIS: Jika ada datetime_complete dari frontend, hitung durasinya langsung di Go
	if dtCompleteStr, ok := inputData["datetime_complete"].(string); ok && dtCompleteStr != "" {
		parsedTime, err := time.Parse("2006-01-02 15:04:05", dtCompleteStr)
		if err == nil {
			// Hitung selisih waktu antara Complete dan Incident
			durationDiff := parsedTime.Sub(incident.DatetimeOfIncident)
			
			// Ubah durasi menjadi teks yang mudah dipahami, contoh: "24h0m0s" atau "1h30m"
			inputData["duration"] = durationDiff.Round(time.Minute).String()
		}
	}

	// Update seluruh field ke database MySQL
	if err := config.DB.Model(&incident).Updates(inputData).Error; err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Gagal memperbarui data insiden: " + err.Error()})
		return
	}

	// Ambil data terbaru pasca update untuk dikembalikan ke frontend
	config.DB.First(&incident, id)
	json.NewEncoder(w).Encode(incident)
}