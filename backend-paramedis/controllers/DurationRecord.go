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

func GetAllRecordingDuration(w http.ResponseWriter, r *http.Request) {

	var recordings []models.RecordingDuration

	if err := config.DB.
		Order("id DESC").
		Find(&recordings).Error; err != nil {

		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(recordings)
}

//
// ===================== GET BY ID =====================
//

func GetRecordingDurationByID(w http.ResponseWriter, r *http.Request) {

	id := mux.Vars(r)["id"]

	var recording models.RecordingDuration

	if err := config.DB.
		Where("id = ?", id).
		First(&recording).Error; err != nil {

		http.Error(w, "Data tidak ditemukan", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(recording)
}

//
// ===================== CREATE =====================
//

func CreateRecordingDuration(w http.ResponseWriter, r *http.Request) {

	var input models.RecordingDuration

	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}


	if input.NoDVRNVR == "" {
		http.Error(w, "No DVR/NVR wajib diisi", http.StatusBadRequest)
		return
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
		"data": input,
	})
}

//
// ===================== UPDATE =====================
//

func UpdateRecordingDuration(w http.ResponseWriter, r *http.Request) {

	id := mux.Vars(r)["id"]

	var recording models.RecordingDuration


	if err := config.DB.
		Where("id = ?", id).
		First(&recording).Error; err != nil {

		http.Error(w, "Data tidak ditemukan", http.StatusNotFound)
		return
	}


	var input models.RecordingDuration


	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}


	recording.NoDVRNVR = input.NoDVRNVR
	recording.JenisKamera = input.JenisKamera
	recording.DurasiRekamanHari = input.DurasiRekamanHari
	recording.KapasitasTB = input.KapasitasTB
	recording.Keterangan = input.Keterangan

	recording.UpdatedAt = time.Now()


	if err := config.DB.Save(&recording).Error; err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}


	w.Header().Set("Content-Type", "application/json")

	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "Data berhasil diperbarui",
		"data": recording,
	})
}

//
// ===================== DELETE =====================
//

func DeleteRecordingDuration(w http.ResponseWriter, r *http.Request) {

	id := mux.Vars(r)["id"]


	var recording models.RecordingDuration


	if err := config.DB.
		Where("id = ?", id).
		First(&recording).Error; err != nil {

		http.Error(w, "Data tidak ditemukan", http.StatusNotFound)
		return
	}


	if err := config.DB.Delete(&recording).Error; err != nil {

		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}


	w.Header().Set("Content-Type", "application/json")


	json.NewEncoder(w).Encode(map[string]string{
		"message": "Data berhasil dihapus",
	})
}