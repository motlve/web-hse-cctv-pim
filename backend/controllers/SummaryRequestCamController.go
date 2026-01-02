package controllers

import (
	"backend/config"
	"backend/models"
	"encoding/json"
	"net/http"
	"time"

	"github.com/gorilla/mux"
)

// ===================== HELPERS =====================

// Hitung jumlah hari antara request dan pemasangan
func calcProgressDays(request, pemasangan *time.Time) int {
	if request == nil || pemasangan == nil {
		return 0
	}
	return int(pemasangan.Sub(*request).Hours() / 24)
}

// Tentukan status otomatis
func determineStatus(request time.Time, pemasangan *time.Time) string {
	if pemasangan == nil || pemasangan.IsZero() {
		return "Request"
	}
	return "Success"
}

// ===================== HANDLERS =====================

// GET /api/summary-request-camera
func GetAllSummaryRequestCamera(w http.ResponseWriter, r *http.Request) {
	var summaries []models.SummaryRequestCamera
	if err := config.DB.Find(&summaries).Error; err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Hitung ProgressDays & Status untuk setiap data
	for i := range summaries {
		summaries[i].ProgressDays = calcProgressDays(&summaries[i].TanggalRequest, summaries[i].TanggalPemasangan)
		summaries[i].Status = determineStatus(summaries[i].TanggalRequest, summaries[i].TanggalPemasangan)
	}

	json.NewEncoder(w).Encode(summaries)
}

// GET /api/summary-request-camera/{id_camera}
func GetSummaryRequestCameraByID(w http.ResponseWriter, r *http.Request) {
	idCamera := mux.Vars(r)["id_camera"]
	var summary models.SummaryRequestCamera

	if err := config.DB.Where("id_camera = ?", idCamera).First(&summary).Error; err != nil {
		http.Error(w, "Data tidak ditemukan", http.StatusNotFound)
		return
	}

	// Hitung progress dan status
	summary.ProgressDays = calcProgressDays(&summary.TanggalRequest, summary.TanggalPemasangan)
	summary.Status = determineStatus(summary.TanggalRequest, summary.TanggalPemasangan)

	json.NewEncoder(w).Encode(summary)
}

// POST /api/summary-request-camera
func CreateSummaryRequestCamera(w http.ResponseWriter, r *http.Request) {
	var input models.SummaryRequestCamera
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Tentukan status & progress days otomatis
	input.Status = determineStatus(input.TanggalRequest, input.TanggalPemasangan)
	input.ProgressDays = calcProgressDays(&input.TanggalRequest, input.TanggalPemasangan)
	input.CreatedAt = time.Now()
	input.UpdatedAt = time.Now()

	if err := config.DB.Create(&input).Error; err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "Data berhasil ditambahkan",
		"data":    input,
	})
}

// PUT /api/summary-request-camera/{id_camera}
func UpdateSummaryRequestCamera(w http.ResponseWriter, r *http.Request) {
	idCamera := mux.Vars(r)["id_camera"]
	var summary models.SummaryRequestCamera

	if err := config.DB.Where("id_camera = ?", idCamera).First(&summary).Error; err != nil {
		http.Error(w, "Data tidak ditemukan", http.StatusNotFound)
		return
	}

	var input models.SummaryRequestCamera
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	summary.Lokasi = input.Lokasi
	summary.LokasiDetail = input.LokasiDetail
	summary.TanggalRequest = input.TanggalRequest
	summary.TanggalPemasangan = input.TanggalPemasangan
	summary.IDCamera = input.IDCamera
	summary.InputDatabase = input.InputDatabase
	summary.Keterangan = input.Keterangan

	// Hitung otomatis
	summary.Status = determineStatus(summary.TanggalRequest, summary.TanggalPemasangan)
	summary.ProgressDays = calcProgressDays(&summary.TanggalRequest, summary.TanggalPemasangan)
	summary.UpdatedAt = time.Now()

	if err := config.DB.Save(&summary).Error; err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "Data berhasil diperbarui",
		"data":    summary,
	})
}

// DELETE /api/summary-request-camera/{id_camera}
func DeleteSummaryRequestCamera(w http.ResponseWriter, r *http.Request) {
	idCamera := mux.Vars(r)["id_camera"]

	if err := config.DB.Unscoped().Where("id_camera = ?", idCamera).Delete(&models.SummaryRequestCamera{}).Error; err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]string{
		"message": "Data berhasil dihapus",
	})
}
