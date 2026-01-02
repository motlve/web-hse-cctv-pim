package controllers

import (
	"backend/config"
	"backend/models"
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
	// Pastikan gorm v2 diimpor jika Anda menggunakan GORM v2.
	// Jika tidak, Anda mungkin tidak perlu baris ini atau perlu versi yang sesuai.
	// "gorm.io/gorm" 
)

func GetAllIncident(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	var incidents []models.IncidentRecord
	
	// --- PERBAIKAN PENTING: Gunakan Unscoped() untuk mengabaikan soft delete ---
	// Ini akan mengambil semua record, termasuk yang mungkin dianggap "soft-deleted" oleh Gorm.
	// Jika ini berhasil menampilkan data Anda, maka masalahnya adalah soft delete.
	if err := config.DB.Unscoped().Find(&incidents).Error; err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to retrieve incidents: " + err.Error()})
		return
	}
	
	json.NewEncoder(w).Encode(incidents)
}

func CreateIncident(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	var incident models.IncidentRecord

	if err := json.NewDecoder(r.Body).Decode(&incident); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid request body: " + err.Error()})
		return
	}

	if err := config.DB.Create(&incident).Error; err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to save incident: " + err.Error()})
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(incident)
}

func DeleteIncident(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	params := mux.Vars(r)
	idStr := params["id"]
	id, err := strconv.Atoi(idStr)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid ID: " + err.Error()})
		return
	}

	var incident models.IncidentRecord
	if err := config.DB.First(&incident, id).Error; err != nil {
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]string{"error": "Incident not found"})
		return
	}

	// Gorm soft delete: kolom deleted_at akan diisi
	if err := config.DB.Delete(&incident).Error; err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to delete incident: " + err.Error()})
		return
	}

	json.NewEncoder(w).Encode(map[string]string{"message": "Incident successfully deleted"})
}

func UpdateIncident(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	params := mux.Vars(r)
	idStr := params["id"]
	id, err := strconv.Atoi(idStr)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid ID: " + err.Error()})
		return
	}

	var incident models.IncidentRecord
	if err := config.DB.First(&incident, id).Error; err != nil {
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]string{"error": "Incident not found"})
		return
	}

	var updated models.IncidentRecord
	if err := json.NewDecoder(r.Body).Decode(&updated); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid request body: " + err.Error()})
		return
	}

	// PERHATIAN: Updates(updated) hanya akan memperbarui field yang tidak zero-value di 'updated'.
	// Jika Anda ingin memperbarui semua field yang dikirim dari frontend, gunakan map.
	if err := config.DB.Model(&incident).Updates(updated).Error; err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to update incident: " + err.Error()})
		return
	}

	// Ambil data terbaru setelah update
	config.DB.First(&incident, id)
	json.NewEncoder(w).Encode(incident)
}
