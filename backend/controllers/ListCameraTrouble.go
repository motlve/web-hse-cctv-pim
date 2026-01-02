package controllers

import (
	"backend/config"
	"backend/models"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/gorilla/mux"
)

// ===================== HELPERS =====================

// Hitung durasi antara dua waktu dalam format HH:MM:SS
func calcDuration(start, end time.Time) string {
	if start.IsZero() || end.IsZero() {
		return "00:00:00"
	}
	duration := end.Sub(start)
	h := int(duration.Hours())
	m := int(duration.Minutes()) % 60
	s := int(duration.Seconds()) % 60
	return fmt.Sprintf("%02d:%02d:%02d", h, m, s)
}

// Konversi menit ke HH:MM:SS
func minutesToHHMMSS(minutes float64) string {
	totalSeconds := int(minutes * 60)
	h := totalSeconds / 3600
	m := (totalSeconds % 3600) / 60
	s := totalSeconds % 60
	return fmt.Sprintf("%02d:%02d:%02d", h, m, s)
}

// Generate IDCamera numeric terkecil jika kosong
func getNextAvailableCameraID() (string, error) {
	var ids []string
	if err := config.DB.Model(&models.ListCameraTrouble{}).Pluck("id_camera", &ids).Error; err != nil {
		return "", err
	}

	nextID := 1
	exist := make(map[int]bool)
	for _, v := range ids {
		var num int
		fmt.Sscanf(v, "%d", &num)
		exist[num] = true
	}
	for exist[nextID] {
		nextID++
	}
	return fmt.Sprintf("%d", nextID), nil
}

// ===================== HANDLERS =====================

// GET /api/list-camera-trouble
func GetAllCameraTrouble(w http.ResponseWriter, r *http.Request) {
	var troubles []models.ListCameraTrouble
	if err := config.DB.Find(&troubles).Error; err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(troubles)
}

// GET /api/list-camera-trouble/{id_camera}
func GetCameraTroubleByID(w http.ResponseWriter, r *http.Request) {
	idCamera := mux.Vars(r)["id_camera"]
	var trouble models.ListCameraTrouble

	if err := config.DB.Where("id_camera = ?", idCamera).First(&trouble).Error; err != nil {
		http.Error(w, "Data tidak ditemukan", http.StatusNotFound)
		return
	}

	json.NewEncoder(w).Encode(trouble)
}

// POST /api/list-camera-trouble
func CreateCameraTrouble(w http.ResponseWriter, r *http.Request) {
	var input models.ListCameraTrouble
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Auto-generate IDCamera jika kosong
	if input.IDCamera == "" {
		nextID, err := getNextAvailableCameraID()
		if err != nil {
			http.Error(w, "Gagal mendapatkan IDCamera: "+err.Error(), http.StatusInternalServerError)
			return
		}
		input.IDCamera = nextID
	}

	input.TanggalInput = time.Now()

	// Tentukan status otomatis
	if !input.SelesaiPerbaikan.IsZero() {
		input.Status = "Selesai Perbaikan/On Kembali"
	} else if !input.RequestPerbaikan.IsZero() {
		input.Status = "Request Perbaikan"
	} else if !input.StartError.IsZero() {
		input.Status = "Error"
	} else {
		input.Status = "Kamera Dilepas"
	}

	// ===== Hitung otomatis waktu =====
	input.DurasiError = calcDuration(input.StartError, input.SelesaiPerbaikan)
	input.ResponseTime = calcDuration(input.RequestPerbaikan, input.SelesaiPerbaikan)
	input.AverageResponse = calcDuration(input.StartError, input.SelesaiPerbaikan)

	// Simpan ke DB
	if err := config.DB.Create(&input).Error; err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	updateStatisticCCTV(input.IDCamera)
	updateAverageResponse()
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "Data berhasil ditambahkan",
		"data":    input,
	})
}

// PUT /api/list-camera-trouble/{id_camera}
func UpdateCameraTrouble(w http.ResponseWriter, r *http.Request) {
	idCamera := mux.Vars(r)["id_camera"]
	var trouble models.ListCameraTrouble

	if err := config.DB.Where("id_camera = ?", idCamera).First(&trouble).Error; err != nil {
		http.Error(w, "Data tidak ditemukan", http.StatusNotFound)
		return
	}

	var input models.ListCameraTrouble
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	trouble.Lokasi = input.Lokasi
	trouble.LokasiDetail = input.LokasiDetail
	trouble.Keterangan = input.Keterangan
	trouble.Petugas = input.Petugas
	trouble.StartError = input.StartError
	trouble.RequestPerbaikan = input.RequestPerbaikan
	trouble.SelesaiPerbaikan = input.SelesaiPerbaikan

	// Tentukan status otomatis
	if input.Status == "Kamera Dilepas" {
		trouble.Status = "Kamera Dilepas"
	} else {
		if !trouble.SelesaiPerbaikan.IsZero() {
			trouble.Status = "Selesai Perbaikan/On Kembali"
		} else if !trouble.RequestPerbaikan.IsZero() {
			trouble.Status = "Request Perbaikan"
		} else {
			trouble.Status = "Error"
		}
	}

	// ===== Hitung ulang waktu =====
	trouble.DurasiError = calcDuration(trouble.StartError, trouble.SelesaiPerbaikan)
	trouble.ResponseTime = calcDuration(trouble.RequestPerbaikan, trouble.SelesaiPerbaikan)
	trouble.AverageResponse = calcDuration(trouble.StartError, trouble.SelesaiPerbaikan)

	if err := config.DB.Save(&trouble).Error; err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	updateStatisticCCTV(trouble.IDCamera)

	updateAverageResponse()
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "Data berhasil diperbarui",
		"data":    trouble,
	})
}

// DELETE /api/list-camera-trouble/{id_camera}
func DeleteCameraTrouble(w http.ResponseWriter, r *http.Request) {
	idCamera := mux.Vars(r)["id_camera"]

	if err := config.DB.Unscoped().Where("id_camera = ?", idCamera).Delete(&models.ListCameraTrouble{}).Error; err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	updateStatisticCCTV(idCamera)
	updateAverageResponse()
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Data berhasil dihapus",
	})
}

// Hitung rata-rata response time
func updateAverageResponse() {
	var troubles []models.ListCameraTrouble
	config.DB.Find(&troubles)

	var totalMinutes float64
	var count int

	for _, t := range troubles {
		if t.ResponseTime != "" {
			var h, m, s int
			fmt.Sscanf(t.ResponseTime, "%d:%d:%d", &h, &m, &s)
			totalMinutes += float64(h*60 + m + s/60)
			count++
		}
	}

	avg := "00:00:00"
	if count > 0 {
		avg = minutesToHHMMSS(totalMinutes / float64(count))
	}

	config.DB.Model(&models.ListCameraTrouble{}).Update("average_response", avg)
}

func updateStatisticCCTV(idCamera string) {
    var cctv models.IDCCTVModels
    if err := config.DB.Where("id_camera = ?", idCamera).First(&cctv).Error; err == nil {
        _ = cctv.RecalculateStats()
    }
}

