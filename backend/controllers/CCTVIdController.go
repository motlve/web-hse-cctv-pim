package controllers

import (
	"backend/config"
	"backend/models"
	"encoding/json"
	"net/http"
	"sort"
	"strconv"

	"github.com/gorilla/mux"
)

// Fungsi bantu untuk cari ID terkecil yang kosong
func getNextAvailableID() (uint, error) {
	var ids []uint
	if err := config.DB.Model(&models.IDCCTVModels{}).Pluck("id", &ids).Error; err != nil {
		return 0, err
	}

	sort.Slice(ids, func(i, j int) bool { return ids[i] < ids[j] })

	nextID := uint(1)
	for _, id := range ids {
		if id == nextID {
			nextID++
		} else if id > nextID {
			break
		}
	}

	return nextID, nil
}

// GET semua data CCTV
func GetAllCCTV(w http.ResponseWriter, r *http.Request) {
	var cctvs []models.IDCCTVModels
	if err := config.DB.Find(&cctvs).Error; err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(cctvs)
}

// GET CCTV by ID
func GetCCTVByID(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.Atoi(mux.Vars(r)["id"])
	var cctv models.IDCCTVModels
	if err := config.DB.First(&cctv, id).Error; err != nil {
		http.Error(w, "CCTV not found", http.StatusNotFound)
		return
	}
	json.NewEncoder(w).Encode(cctv)
}

// POST CCTV baru dengan ID otomatis terkecil yang kosong
func CreateCCTV(w http.ResponseWriter, r *http.Request) {
	var cctv models.IDCCTVModels
	if err := json.NewDecoder(r.Body).Decode(&cctv); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Ambil ID terkecil yang kosong
	nextID, err := getNextAvailableID()
	if err != nil {
		http.Error(w, "Failed to determine next available ID: "+err.Error(), http.StatusInternalServerError)
		return
	}
	cctv.ID = nextID

	// Simpan ke DB
	if err := config.DB.Create(&cctv).Error; err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Hitung ulang statistik
	_ = cctv.RecalculateStats()

	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "CCTV created successfully",
		"data":    cctv,
	})
}

// PUT update CCTV (misal update area/kondisi)
func UpdateCCTV(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.Atoi(mux.Vars(r)["id"])
	var cctv models.IDCCTVModels

	if err := config.DB.First(&cctv, id).Error; err != nil {
		http.Error(w, "CCTV not found", http.StatusNotFound)
		return
	}

	if err := json.NewDecoder(r.Body).Decode(&cctv); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	config.DB.Save(&cctv)

	// hitung ulang statistik setelah update
	_ = cctv.RecalculateStats()

	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "CCTV updated successfully",
		"data":    cctv,
	})
}

// DELETE CCTV (hard delete)
func DeleteCCTV(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.Atoi(mux.Vars(r)["id"])

	// gunakan Unscoped() supaya benar-benar dihapus
	if err := config.DB.Unscoped().Delete(&models.IDCCTVModels{}, id).Error; err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]string{"message": "CCTV deleted successfully"})
}
