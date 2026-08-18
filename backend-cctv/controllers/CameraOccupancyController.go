package controllers

import (
	"backend/config"
	"backend/models"
	"encoding/json"
	"net/http"
	"time"

	"github.com/gorilla/mux"
)

//
// ===================== GET ALL =====================
//

func GetAllCameraOccupancy(w http.ResponseWriter, r *http.Request) {

	var occupancies []models.CameraOccupancy

	if err := config.DB.
		Order("id DESC").
		Find(&occupancies).Error; err != nil {

		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(occupancies)
}

//
// ===================== GET BY ID =====================
//

func GetCameraOccupancyByID(w http.ResponseWriter, r *http.Request) {

	id := mux.Vars(r)["id"]

	var occupancy models.CameraOccupancy

	if err := config.DB.
		Where("id = ?", id).
		First(&occupancy).Error; err != nil {

		http.Error(w, "Data tidak ditemukan", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(occupancy)
}

//
// ===================== CREATE =====================
//

func CreateCameraOccupancy(w http.ResponseWriter, r *http.Request) {

	var input models.CameraOccupancy

	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if input.Area == "" {
		http.Error(w, "Area wajib diisi", http.StatusBadRequest)
		return
	}

	// ==========================
	// Hitung Persentase
	// ==========================

	if input.TotalKamera > 0 {
		input.PersentaseIP = (float64(input.IP) / float64(input.TotalKamera)) * 100
		input.PersentaseAnalog = (float64(input.Analog) / float64(input.TotalKamera)) * 100
	} else {
		input.PersentaseIP = 0
		input.PersentaseAnalog = 0
	}

	now := time.Now()

	input.CreatedAt = now
	input.UpdatedAt = now

	if err := config.DB.Create(&input).Error; err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")

	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "Data berhasil ditambahkan",
		"data":    input,
	})
}

//
// ===================== UPDATE =====================
//

func UpdateCameraOccupancy(w http.ResponseWriter, r *http.Request) {

	id := mux.Vars(r)["id"]

	var occupancy models.CameraOccupancy

	if err := config.DB.
		Where("id = ?", id).
		First(&occupancy).Error; err != nil {

		http.Error(w, "Data tidak ditemukan", http.StatusNotFound)
		return
	}

	var input models.CameraOccupancy

	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	occupancy.Area = input.Area
	occupancy.TotalKamera = input.TotalKamera
	occupancy.IP = input.IP
	occupancy.Analog = input.Analog
	occupancy.JumlahKameraTambahan = input.JumlahKameraTambahan
	occupancy.Keterangan = input.Keterangan

	// ==========================
	// Hitung Persentase
	// ==========================

	if occupancy.TotalKamera > 0 {
		occupancy.PersentaseIP =
			(float64(occupancy.IP) / float64(occupancy.TotalKamera)) * 100

		occupancy.PersentaseAnalog =
			(float64(occupancy.Analog) / float64(occupancy.TotalKamera)) * 100
	} else {
		occupancy.PersentaseIP = 0
		occupancy.PersentaseAnalog = 0
	}

	occupancy.UpdatedAt = time.Now()

	if err := config.DB.Save(&occupancy).Error; err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")

	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "Data berhasil diperbarui",
		"data":    occupancy,
	})
}

//
// ===================== DELETE =====================
//

func DeleteCameraOccupancy(w http.ResponseWriter, r *http.Request) {

	id := mux.Vars(r)["id"]

	var occupancy models.CameraOccupancy

	if err := config.DB.
		Where("id = ?", id).
		First(&occupancy).Error; err != nil {

		http.Error(w, "Data tidak ditemukan", http.StatusNotFound)
		return
	}

	if err := config.DB.Delete(&occupancy).Error; err != nil {

		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")

	json.NewEncoder(w).Encode(map[string]string{
		"message": "Data berhasil dihapus",
	})
}