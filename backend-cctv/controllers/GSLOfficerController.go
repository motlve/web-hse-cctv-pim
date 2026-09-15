package controllers

import (
	"backend/config"
	"backend/models"
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"github.com/gorilla/mux"
)

// =====================================
// GET ALL GSL OFFICER
// =====================================

func GetAllGSLOfficer(w http.ResponseWriter, r *http.Request) {

	var officers []models.GSLOfficerModel

	if err := config.DB.Find(&officers).Error; err != nil {
		http.Error(w, "Gagal mengambil data petugas GSL", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(officers)
}

// =====================================
// CREATE GSL OFFICER
// =====================================

func CreateGSLOfficer(w http.ResponseWriter, r *http.Request) {

	var req struct {
		NameOfficer string `json:"nameOfficer"`
		Gender      string `json:"gender"`
		Role        string `json:"role"`
		Status      string `json:"status"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	req.NameOfficer = strings.TrimSpace(req.NameOfficer)

	if req.NameOfficer == "" {
		http.Error(w, "Nama petugas wajib diisi", http.StatusBadRequest)
		return
	}

	now := time.Now()

	officer := models.GSLOfficerModel{
		NameOfficer:   req.NameOfficer,
		Gender:        req.Gender,
		Role:          req.Role,
		Status:        req.Status,
		TanggalStatus: &now,
	}

	if err := config.DB.Create(&officer).Error; err != nil {
		http.Error(w, "Gagal menyimpan petugas GSL", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Petugas GSL berhasil ditambahkan",
		"data":    officer,
	})
}

// =====================================
// UPDATE STATUS GSL OFFICER
// =====================================

func UpdateStatusGSLOfficer(w http.ResponseWriter, r *http.Request) {

	id := mux.Vars(r)["id"]

	var officer models.GSLOfficerModel
	if err := config.DB.First(&officer, id).Error; err != nil {
		http.Error(w, "Petugas GSL tidak ditemukan", http.StatusNotFound)
		return
	}

	var req struct {
		Status string `json:"status"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	if req.Status == "" {
		http.Error(w, "Status wajib diisi", http.StatusBadRequest)
		return
	}

	now := time.Now()

	officer.Status = req.Status
	officer.TanggalStatus = &now

	if err := config.DB.Save(&officer).Error; err != nil {
		http.Error(w, "Gagal update status petugas GSL", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Status petugas GSL berhasil diupdate",
		"data":    officer,
	})
}

// =====================================
// UPDATE GSL OFFICER
// =====================================

func UpdateGSLOfficer(w http.ResponseWriter, r *http.Request) {

	id := mux.Vars(r)["id"]

	var officer models.GSLOfficerModel
	if err := config.DB.First(&officer, id).Error; err != nil {
		http.Error(w, "Petugas GSL tidak ditemukan", http.StatusNotFound)
		return
	}

	var req struct {
		NameOfficer string `json:"nameOfficer"`
		Gender      string `json:"gender"`
		Role        string `json:"role"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	req.NameOfficer = strings.TrimSpace(req.NameOfficer)

	if req.NameOfficer == "" {
		http.Error(w, "Nama petugas wajib diisi", http.StatusBadRequest)
		return
	}

	officer.NameOfficer = req.NameOfficer
	officer.Gender = req.Gender
	officer.Role = req.Role

	if err := config.DB.Save(&officer).Error; err != nil {
		http.Error(w, "Gagal update petugas GSL", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Petugas GSL berhasil diupdate",
		"data":    officer,
	})
}

// =====================================
// DELETE GSL OFFICER
// =====================================

func DeleteGSLOfficer(w http.ResponseWriter, r *http.Request) {

	id := mux.Vars(r)["id"]

	var officer models.GSLOfficerModel
	if err := config.DB.First(&officer, id).Error; err != nil {
		http.Error(w, "Petugas GSL tidak ditemukan", http.StatusNotFound)
		return
	}

	var usageCount int64
	config.DB.Model(&models.ComplaintRecord{}).Where("gsl_officer_id = ?", id).Count(&usageCount)

	if usageCount > 0 {
		http.Error(w, "Petugas GSL masih dipakai di data komplain, tidak bisa dihapus", http.StatusBadRequest)
		return
	}

	if err := config.DB.Delete(&officer).Error; err != nil {
		http.Error(w, "Gagal menghapus petugas GSL", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Petugas GSL berhasil dihapus",
	})
}